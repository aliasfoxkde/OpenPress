import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const content = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List content items with pagination and filters
content.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const type = c.req.query("type");
  const status = c.req.query("status");
  const search = c.req.query("search");

  let whereClause = "WHERE 1=1";
  const params: unknown[] = [];

  if (type) {
    whereClause += " AND type = ?";
    params.push(type);
  }
  if (status) {
    whereClause += " AND status = ?";
    params.push(status);
  }
  if (search) {
    whereClause += " AND (title LIKE ? OR content LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, type, slug, title, excerpt, status, author_id, featured_image_url, published_at, created_at, updated_at FROM content_items ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) as total FROM content_items ${whereClause}`)
      .bind(...params)
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

// GET /:slug - Get single content item with blocks and terms
content.get("/:slug", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const item = await db.prepare("SELECT * FROM content_items WHERE slug = ?").bind(slug).first();

  if (!item) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  const [blocks, terms, meta] = await Promise.all([
    db.prepare("SELECT * FROM content_blocks WHERE content_id = ? ORDER BY sort_order ASC").bind(item.id as string).all(),
    db
      .prepare(
        "SELECT t.* FROM terms t JOIN term_relationships tr ON t.id = tr.term_id WHERE tr.content_id = ?",
      )
      .bind(item.id as string).all(),
    db.prepare("SELECT meta_key, meta_value FROM content_meta WHERE content_id = ?").bind(item.id as string).all(),
  ]);

  return c.json({
    data: {
      ...item,
      blocks: blocks.results,
      terms: terms.results,
      meta: Object.fromEntries(
        meta.results.map((m: { meta_key: string; meta_value: string }) => [m.meta_key, m.meta_value]),
      ),
    },
  });
});

// POST / - Create new content item
content.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const body = await c.req.json();
  const { title, type, status, content: bodyContent, excerpt, blocks, term_ids, meta } = body;

  if (!title) {
    return c.json({ error: { message: "Title is required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const slug =
    body.slug ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const now = new Date().toISOString();
  const itemStatus = status || "draft";
  const itemType = type || "post";
  const publishedAt = itemStatus === "published" ? now : null;

  await db
    .prepare(
      "INSERT INTO content_items (id, type, slug, title, content, excerpt, status, author_id, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, itemType, slug, title, bodyContent || null, excerpt || null, itemStatus, user?.id || null, publishedAt, now, now)
    .run();

  // Insert blocks if provided
  if (blocks && Array.isArray(blocks)) {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockId = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO content_blocks (id, content_id, block_type, data, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(blockId, id, block.block_type || "text", JSON.stringify(block.data || {}), i, now, now)
        .run();
    }
  }

  // Associate terms if provided
  if (term_ids && Array.isArray(term_ids)) {
    for (const termId of term_ids) {
      await db
        .prepare("INSERT OR IGNORE INTO term_relationships (content_id, term_id) VALUES (?, ?)")
        .bind(id, termId)
        .run();
    }
  }

  // Insert meta if provided
  if (meta && typeof meta === "object") {
    for (const [key, value] of Object.entries(meta)) {
      await db
        .prepare("INSERT INTO content_meta (content_id, meta_key, meta_value) VALUES (?, ?, ?)")
        .bind(id, key, String(value))
        .run();
    }
  }

  return c.json(
    {
      data: { id, slug, title, status: itemStatus, type: itemType, created_at: now },
    },
    201,
  );
});

// PUT /:slug - Update content item
content.put("/:slug", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const existing = await db.prepare("SELECT id FROM content_items WHERE slug = ?").bind(slug).first();
  if (!existing) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  const body = await c.req.json();
  const now = new Date().toISOString();
  const id = existing.id as string;

  // Build update query dynamically
  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.title !== undefined) { updates.push("title = ?"); params.push(body.title); }
  if (body.content !== undefined) { updates.push("content = ?"); params.push(body.content); }
  if (body.excerpt !== undefined) { updates.push("excerpt = ?"); params.push(body.excerpt); }
  if (body.status !== undefined) {
    updates.push("status = ?");
    params.push(body.status);
    if (body.status === "published") {
      updates.push("published_at = COALESCE(published_at, ?)");
      params.push(now);
    }
  }
  if (body.featured_image_url !== undefined) { updates.push("featured_image_url = ?"); params.push(body.featured_image_url); }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);
    await db.prepare(`UPDATE content_items SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  // Update blocks if provided
  if (body.blocks && Array.isArray(body.blocks)) {
    await db.prepare("DELETE FROM content_blocks WHERE content_id = ?").bind(id).run();
    for (let i = 0; i < body.blocks.length; i++) {
      const block = body.blocks[i];
      await db
        .prepare(
          "INSERT INTO content_blocks (id, content_id, block_type, data, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(crypto.randomUUID(), id, block.block_type || "text", JSON.stringify(block.data || {}), i, now, now)
        .run();
    }
  }

  return c.json({ data: { id, slug, updated_at: now } });
});

// DELETE /:slug - Delete content item (soft delete -> trash)
content.delete("/:slug", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const force = c.req.query("force") === "true";
  const existing = await db
    .prepare("SELECT id, status FROM content_items WHERE slug = ?")
    .bind(slug)
    .first<{ id: string; status: string }>();

  if (!existing) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  if (existing.status === "trash" || force) {
    // Hard delete
    await db.prepare("DELETE FROM content_items WHERE id = ?").bind(existing.id).run();
    return c.json({ data: { deleted: true } });
  }

  // Soft delete - move to trash
  const now = new Date().toISOString();
  await db.prepare("UPDATE content_items SET status = 'trash', updated_at = ? WHERE id = ?").bind(now, existing.id).run();
  return c.json({ data: { id: existing.id, status: "trash" } });
});

export default content;
