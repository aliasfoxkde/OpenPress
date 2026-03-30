import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const settings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - Get all settings
settings.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const result = await db.prepare("SELECT key, value FROM settings").all();
  const data: Record<string, string> = {};
  for (const row of result.results as unknown as { key: string; value: string }[]) {
    data[row.key] = row.value;
  }

  return c.json({ data });
});

// PUT / - Update settings
settings.put("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const now = new Date().toISOString();

  const statements: Promise<unknown>[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;
    statements.push(
      db
        .prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?")
        .bind(key, value, now, value, now)
        .run(),
    );
  }

  await Promise.all(statements);

  // Invalidate KV cache
  if (c.env.CACHE) {
    await c.env.CACHE.delete("settings:all");
  }

  return c.json({ data: { updated: Object.keys(body).length } });
});

export default settings;
