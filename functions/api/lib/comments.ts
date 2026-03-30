import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const comments = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List all comments for admin (with status filter)
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

// PUT /:id/status - Moderate comment
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

// DELETE /:id - Delete comment
comments.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  await db.prepare("DELETE FROM comments WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ data: { deleted: true } });
});

export default comments;
