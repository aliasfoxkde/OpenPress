import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
};

type Variables = {
  user: { id: string; email: string; role: string } | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());
app.use("*", logger());

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "openpress",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Content API
app.get("/api/content", async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        "SELECT id, type, slug, title, status, author_id, created_at, updated_at FROM content_items ORDER BY updated_at DESC LIMIT ? OFFSET ?",
      )
      .bind(limit, offset)
      .all(),
    db
      .prepare("SELECT COUNT(*) as total FROM content_items")
      .first<{ total: number }>(),
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
  if (!db) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const slug = c.req.param("slug");
  const item = await db
    .prepare("SELECT * FROM content_items WHERE slug = ?")
    .bind(slug)
    .first();

  if (!item) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  const blocks = await db
    .prepare("SELECT * FROM content_blocks WHERE content_id = ? ORDER BY sort_order ASC")
    .bind(item.id as string)
    .all();

  return c.json({
    data: { ...item, blocks: blocks.results },
  });
});

app.post("/api/content", async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const body = await c.req.json();
  const id = crypto.randomUUID();
  const slug =
    body.slug ||
    (body.title as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO content_items (id, type, slug, title, status, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      body.type || "post",
      slug,
      body.title,
      body.status || "draft",
      body.author_id || null,
      now,
      now,
    )
    .run();

  return c.json(
    {
      data: { id, slug, title: body.title, status: body.status || "draft" },
    },
    201,
  );
});

// Auth API (placeholder - will be expanded)
app.post("/api/auth/register", async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: "Database not configured" }, 503);
  }

  const body = await c.req.json();
  const id = crypto.randomUUID();

  await db
    .prepare(
      "INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      body.email,
      body.name || body.email.split("@")[0],
      "admin",
      new Date().toISOString(),
      new Date().toISOString(),
    )
    .run();

  return c.json({ data: { id, email: body.email } }, 201);
});

// Media API (placeholder)
app.get("/api/media", async (c) => {
  return c.json({ data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
});

app.post("/api/media", async (c) => {
  const media = c.env.MEDIA;
  if (!media) {
    return c.json({ error: "Storage not configured" }, 503);
  }
  return c.json({ error: { message: "Not yet implemented", code: "NOT_IMPLEMENTED" } }, 501);
});

// Taxonomies API (placeholder)
app.get("/api/taxonomies", async (c) => {
  return c.json({
    data: [
      { id: "categories", name: "Categories", type: "hierarchical" },
      { id: "tags", name: "Tags", type: "flat" },
    ],
  });
});

// Site info
app.get("/api/site", async (c) => {
  const db = c.env.DB;
  let siteName = "OpenPress";
  let siteDescription = "A modern, edge-native CMS";

  if (db) {
    const settings = await db
      .prepare("SELECT key, value FROM settings WHERE key IN ('site_name', 'site_description')")
      .all();
    for (const row of settings.results as { key: string; value: string }[]) {
      if (row.key === "site_name") siteName = row.value;
      if (row.key === "site_description") siteDescription = row.value;
    }
  }

  return c.json({
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
