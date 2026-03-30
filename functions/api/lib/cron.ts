import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const cron = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Shared secret middleware for cron endpoints.
// Cloudflare Cron Triggers can pass a custom header or use CF-Worker header.
async function cronAuth(c: any, next: any) {
  // Cloudflare Cron Trigger sets this internal header
  const cfWorker = c.req.header("CF-Worker");
  if (cfWorker) return next();

  // Fallback: check for CRON_SECRET env var via Authorization header
  const authHeader = c.req.header("Authorization");
  const secret = c.env?.CRON_SECRET;
  if (secret && authHeader === `Bearer ${secret}`) return next();

  return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
}

cron.use("/*", cronAuth);

// POST /publish-scheduled - Promote scheduled content whose published_at <= now
// Designed to be called by Cloudflare Workers Cron Trigger
cron.post("/publish-scheduled", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `UPDATE content_items SET status = 'published', updated_at = ? WHERE status = 'scheduled' AND published_at IS NOT NULL AND published_at <= ?`
    )
    .bind(now, now)
    .run();

  const count = result.meta.changes;

  return c.json({
    published: count,
    timestamp: now,
  });
});

// POST /trash-cleanup - Auto-delete content in trash older than 30 days
cron.post("/trash-cleanup", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get IDs first for cascade delete of related data
  const trashed = await db
    .prepare("SELECT id FROM content_items WHERE status = 'trash' AND updated_at <= ?")
    .bind(thirtyDaysAgo)
    .all();

  let deleted = 0;
  for (const item of trashed.results as { id: string }[]) {
    await db.prepare("DELETE FROM content_items WHERE id = ?").bind(item.id).run();
    deleted++;
  }

  return c.json({ deleted, cutoff: thirtyDaysAgo });
});

export default cron;
