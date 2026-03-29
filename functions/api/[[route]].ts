import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Bindings, Variables } from "./lib/types";
import auth from "./lib/auth";
import content from "./lib/content";
import media from "./lib/media";
import taxonomies from "./lib/taxonomies";
import settings from "./lib/settings";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use("*", cors());
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
        ai: false,
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

protectedRoutes.route("/content", content);
protectedRoutes.route("/media", media);
protectedRoutes.route("/taxonomies", taxonomies);
protectedRoutes.route("/settings", settings);

app.route("/api", protectedRoutes);

// Public read endpoints (no auth required)
app.get("/api/content", async (c) => {
  // Re-use content list for public access
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        "SELECT id, type, slug, title, excerpt, status, author_id, featured_image_url, published_at, created_at, updated_at FROM content_items WHERE status = 'published' ORDER BY published_at DESC LIMIT ? OFFSET ?",
      )
      .bind(limit, offset)
      .all(),
    db.prepare("SELECT COUNT(*) as total FROM content_items WHERE status = 'published'").first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

app.get("/api/content/:slug", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const item = await db
    .prepare("SELECT * FROM content_items WHERE slug = ? AND status = 'published'")
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

  return c.json({
    data: { ...item, blocks: blocks.results, terms: terms.results },
  });
});

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
