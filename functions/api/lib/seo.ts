import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { handleSitemap, handleFeed, handleRobots } from "../../lib/seo-handlers";

const seo = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Re-export shared handlers at /api/seo/ paths
seo.get("/sitemap.xml", async (c) => {
  const response = await handleSitemap(c as any);
  return response;
});

seo.get("/feed.xml", async (c) => {
  const response = await handleFeed(c as any);
  return response;
});

seo.get("/robots.txt", async (c) => {
  const response = await handleRobots(c as any);
  return response;
});

// GET /search - Full-text search endpoint
seo.get("/search", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const q = c.req.query("q");
  if (!q || q.trim().length < 2) {
    return c.json({ error: { message: "Query must be at least 2 characters", code: "VALIDATION" } }, 400);
  }

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;

  // Use LIKE-based search (FTS5 requires separate virtual table setup)
  const searchPattern = `%${q.trim()}%`;
  const items = await db
    .prepare(
      `SELECT id, type, slug, title, excerpt, status, published_at, created_at, updated_at,
              CASE WHEN title LIKE ? THEN 3 ELSE 0 END + CASE WHEN excerpt LIKE ? THEN 1 ELSE 0 END as relevance
       FROM content_items
       WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)
       ORDER BY relevance DESC, published_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, limit, offset)
    .all();

  const countResult = await db
    .prepare(
      `SELECT COUNT(*) as total FROM content_items WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)`
    )
    .bind(searchPattern, searchPattern, searchPattern)
    .first<{ total: number }>();

  return c.json({
    data: items.results,
    query: q,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

export default seo;
