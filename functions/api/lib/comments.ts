import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const comments = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /:slug - Add comment to a content item (public)
comments.post("/:slug", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const body = await c.req.json();
  const { author_name, author_email, body: commentBody, parent_id } = body;

  if (!author_name || !commentBody) {
    return c.json({ error: { message: "Name and comment body are required", code: "VALIDATION" } }, 400);
  }

  if (author_name.length > 100 || commentBody.length > 5000) {
    return c.json({ error: { message: "Comment too long", code: "VALIDATION" } }, 400);
  }

  // Verify content item exists and is published
  const content = await db.prepare("SELECT id FROM content_items WHERE slug = ? AND status = 'published'").bind(slug).first<{ id: string }>();
  if (!content) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  // Verify parent comment exists if replying
  if (parent_id) {
    const parent = await db.prepare("SELECT id FROM comments WHERE id = ? AND content_id = ?").bind(parent_id, content.id).first();
    if (!parent) {
      return c.json({ error: { message: "Parent comment not found", code: "NOT_FOUND" } }, 404);
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    "INSERT INTO comments (id, content_id, author_name, author_email, body, parent_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)"
  ).bind(id, content.id, author_name.trim(), author_email?.trim() || null, commentBody.trim(), parent_id || null, now).run();

  return c.json({ data: { id, status: "pending" } }, 201);
});

// GET /:slug - Get approved comments for a content item (public)
comments.get("/:slug", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "50")));
  const offset = (page - 1) * limit;

  const content = await db.prepare("SELECT id FROM content_items WHERE slug = ? AND status = 'published'").bind(slug).first<{ id: string }>();
  if (!content) {
    return c.json({ error: { message: "Content not found", code: "NOT_FOUND" } }, 404);
  }

  const [items, countResult] = await Promise.all([
    db.prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM comments WHERE parent_id = c.id) as reply_count
       FROM comments c WHERE c.content_id = ? AND c.status = 'approved'
       ORDER BY c.created_at ASC LIMIT ? OFFSET ?`
    ).bind(content.id, limit, offset).all(),
    db.prepare("SELECT COUNT(*) as total FROM comments WHERE content_id = ? AND status = 'approved'")
      .bind(content.id).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) },
  });
});

// GET / - List all comments for admin (protected, with status filter)
comments.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const status = c.req.query("status");

  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (status && ["pending", "approved", "spam", "trash"].includes(status)) {
    conditions.push("c.status = ?");
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const [items, countResult] = await Promise.all([
    db.prepare(
      `SELECT c.*, ci.title as content_title, ci.slug as content_slug
       FROM comments c JOIN content_items ci ON c.content_id = ci.id
       ${whereClause} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all(),
    db.prepare(`SELECT COUNT(*) as total FROM comments c ${whereClause}`).bind(...params).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) },
  });
});

// PUT /:id/status - Moderate comment (protected)
comments.put("/:id/status", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const { status } = body;

  if (!["approved", "pending", "spam", "trash"].includes(status)) {
    return c.json({ error: { message: "Invalid status", code: "VALIDATION" } }, 400);
  }

  await db.prepare("UPDATE comments SET status = ? WHERE id = ?").bind(status, id).run();
  return c.json({ data: { id, status } });
});

// DELETE /:id - Delete comment (protected)
comments.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  await db.prepare("DELETE FROM comments WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ data: { deleted: true } });
});

export default comments;
