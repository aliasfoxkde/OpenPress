import { Hono } from "hono";
import { logger } from "hono/logger";
import type { Bindings, Variables } from "./lib/types";
import { securityHeaders, rateLimit, corsConfig, requireCapability } from "./lib/security";
import auth from "./lib/auth";
import content from "./lib/content";
import media from "./lib/media";
import taxonomies from "./lib/taxonomies";
import settings from "./lib/settings";
import products from "./lib/products";
import orders, { cart } from "./lib/orders";
import aiRoutes from "./lib/ai";
import revisions from "./lib/revisions";
import users from "./lib/users";
import seo from "./lib/seo";
import stripeRoutes from "./lib/stripe";
import comments from "./lib/comments";
import cron from "./lib/cron";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Security middleware
app.use("*", corsConfig());
app.use("*", securityHeaders());
app.use("*", rateLimit({ windowMs: 60_000, maxRequests: 100 }));
app.use("*", logger());

// Health check (public)
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "openpress",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Site info (public, cached)
app.get("/api/site", async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  let siteName = "OpenPress";
  let siteDescription = "A modern, edge-native CMS";

  // Try KV cache first
  if (cache) {
    const cached = await cache.get("settings:site");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return c.json(parsed);
      } catch { /* cache miss */ }
    }
  }

  if (db) {
    const result = await db
      .prepare("SELECT key, value FROM settings WHERE key IN ('site_name', 'site_description')")
      .all();
    for (const row of result.results as { key: string; value: string }[]) {
      if (row.key === "site_name") siteName = row.value;
      if (row.key === "site_description") siteDescription = row.value;
    }
  }

  const response = {
    data: {
      name: siteName,
      description: siteDescription,
      version: "0.1.0",
      features: {
        plugins: true,
        themes: true,
        media: true,
        blockEditor: true,
        ai: true,
        ecommerce: true,
      },
    },
  };

  // Cache for 5 minutes
  if (cache) {
    await cache.put("settings:site", JSON.stringify(response), { expirationTtl: 300 });
  }

  return c.json(response);
});

// Auth routes (public - register, login, refresh)
app.route("/api/auth", auth);

// Protected routes - require auth
const protectedRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();
protectedRoutes.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Authorization required", code: "UNAUTHORIZED" } }, 401);
  }

  try {
    const { SignJWT } = await import("jose");
    // Simple JWT verification
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode("openpress-secret-key-2026-change-me-in-production");
    const { payload } = await import("jose").then(async (jose) => {
      return await jose.jwtVerify(token, secret);
    });
    c.set("user", { id: payload.sub as string, email: payload.email as string, role: payload.role as string });
    return next();
  } catch {
    return c.json({ error: { message: "Invalid or expired token", code: "INVALID_TOKEN" } }, 401);
  }
});

// Content routes - any authenticated user can read; write requires capabilities
const contentRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();
contentRoutes.get("/*", async (c, next) => next()); // Read = any auth user
contentRoutes.post("/", requireCapability("submit_draft"), async (c, next) => next());
contentRoutes.put("/*", async (c, next) => {
  // Ownership check for content updates
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Authorization required", code: "UNAUTHORIZED" } }, 401);
  const slug = c.req.path.split("/").pop();
  if (!slug) return next();
  const db = c.env.DB;
  const item = await db?.prepare("SELECT author_id FROM content_items WHERE slug = ?").bind(slug).first<{ author_id: string }>();
  // Admins/editors with edit_any can edit anything
  if (user.role === "admin" || user.role === "editor") return next();
  // Authors/contributors can only edit their own
  if (item && item.author_id === user.id) return next();
  return c.json({ error: { message: "Insufficient permissions", code: "FORBIDDEN" } }, 403);
});
contentRoutes.delete("/*", requireCapability("delete_any"));
contentRoutes.route("/", content);
protectedRoutes.route("/content", contentRoutes);

protectedRoutes.route("/media", media);
protectedRoutes.use("/taxonomies/*", requireCapability("manage_taxonomies"));
protectedRoutes.route("/taxonomies", taxonomies);
protectedRoutes.use("/settings/*", requireCapability("manage_settings"));
protectedRoutes.route("/settings", settings);
protectedRoutes.use("/products/*", requireCapability("manage_products"));
protectedRoutes.route("/products", products);
protectedRoutes.use("/orders/*", requireCapability("manage_orders"));
protectedRoutes.route("/orders", orders);
protectedRoutes.use("/ai/*", requireCapability("use_ai"));
protectedRoutes.route("/ai", aiRoutes);
protectedRoutes.route("/revisions", revisions);
protectedRoutes.route("/users", users);

app.route("/api", protectedRoutes);

// Public cart routes (session-based, no auth required)
app.route("/api/cart", cart);

// Public product listing (no auth required)
app.get("/api/products", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db.prepare(
      `SELECT p.*, ci.title, ci.slug, ci.excerpt, ci.featured_image_url
       FROM products p JOIN content_items ci ON p.content_id = ci.id
       WHERE p.status = 'active' ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all(),
    db.prepare("SELECT COUNT(*) as total FROM products WHERE status = 'active'").first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) },
  });
});

app.get("/api/products/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const product = await db.prepare(
    `SELECT p.*, ci.title, ci.slug, ci.content, ci.excerpt, ci.featured_image_url
     FROM products p JOIN content_items ci ON p.content_id = ci.id WHERE p.id = ? OR p.sku = ?`
  ).bind(id, id).first();

  if (!product) return c.json({ error: { message: "Product not found", code: "NOT_FOUND" } }, 404);

  const variants = await db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order").bind(product.id as string).all();
  return c.json({ data: { ...product, variants: variants.results } });
});

// Public read endpoints (no auth required)
app.get("/api/content", async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;

  // Try KV cache for page 1
  const cacheKey = `content:list:page=${page}:limit=${limit}`;
  if (cache && page === 1) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      try { return c.json(JSON.parse(cached)); } catch { /* cache miss */ }
    }
  }

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        "SELECT ci.id, ci.type, ci.slug, ci.title, ci.excerpt, ci.status, ci.author_id, ci.featured_image_url, ci.published_at, ci.created_at, ci.updated_at, u.name as author_name FROM content_items ci LEFT JOIN users u ON ci.author_id = u.id WHERE ci.status = 'published' ORDER BY ci.published_at DESC LIMIT ? OFFSET ?",
      )
      .bind(limit, offset)
      .all(),
    db.prepare("SELECT COUNT(*) as total FROM content_items WHERE status = 'published'").first<{ total: number }>(),
  ]);

  const response = c.json({
    data: items.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });

  // Cache page 1 for 5 minutes
  if (cache && page === 1) {
    const body = JSON.stringify({ data: items.results, pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) } });
    await cache.put(cacheKey, body, { expirationTtl: 300 });
  }

  return response;
});

app.get("/api/content/:slug", async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");

  // Try KV cache
  const cacheKey = `content:${slug}`;
  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      try { return c.json(JSON.parse(cached)); } catch { /* cache miss */ }
    }
  }
  const item = await db
    .prepare(
      "SELECT ci.*, u.name as author_name FROM content_items ci LEFT JOIN users u ON ci.author_id = u.id WHERE ci.slug = ? AND ci.status = 'published'"
    )
    .bind(slug)
    .first();

  if (!item) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  const [blocks, terms] = await Promise.all([
    db.prepare("SELECT * FROM content_blocks WHERE content_id = ? ORDER BY sort_order ASC").bind(item.id as string).all(),
    db
      .prepare(
        "SELECT t.* FROM terms t JOIN term_relationships tr ON t.id = tr.term_id WHERE tr.content_id = ?",
      )
      .bind(item.id as string)
      .all(),
  ]);

  const response = c.json({
    data: { ...item, blocks: blocks.results, terms: terms.results },
  });

  // Cache for 5 minutes
  if (cache) {
    const body = JSON.stringify({ data: { ...item, blocks: blocks.results, terms: terms.results } });
    await cache.put(cacheKey, body, { expirationTtl: 300 });
  }

  return response;
});

// SEO routes (public - sitemap, RSS, robots, search)
app.route("/api/seo", seo);

// Comments (public: GET/POST per slug; protected: admin list/moderate)
app.route("/api/comments", comments);

// Cron endpoints (for Workers Cron Trigger)
app.route("/api/cron", cron);

// Stripe checkout (protected - create session) and webhook (public)
app.route("/api/checkout", stripeRoutes);
app.route("/api/webhooks", stripeRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    { error: { message: err.message || "Internal server error", code: "INTERNAL_ERROR" } },
    500,
  );
});

export const onRequest = async (context: EventContext<Bindings, string, Record<string, unknown>>) => {
  return app.fetch(context.request, context.env, context);
};
