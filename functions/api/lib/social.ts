import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { requireCapability } from "./security";

const social = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─── Public route: active social links for website display ────────────────

social.get("/social-links", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const result = await db
    .prepare("SELECT id, platform, url, icon, label, sort_order FROM social_links WHERE is_active = 1 ORDER BY sort_order ASC")
    .all();

  return c.json({ data: result.results });
});

// ─── Admin routes: require manage_settings capability ─────────────────────

social.use("/admin/*", requireCapability("manage_settings"));

// GET /admin/social - List all social links
social.get("/admin/social", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const result = await db
    .prepare("SELECT * FROM social_links ORDER BY sort_order ASC")
    .all();

  return c.json({ data: result.results });
});

// POST /admin/social - Add social link
social.post("/admin/social", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { platform, url, icon, label } = body;

  if (!platform || !url) {
    return c.json({ error: { message: "Platform and URL are required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get the next sort_order
  const maxSort = await db
    .prepare("SELECT MAX(sort_order) as max_sort FROM social_links")
    .first<{ max_sort: number | null }>();
  const sortOrder = (maxSort?.max_sort ?? -1) + 1;

  await db.prepare(
    "INSERT INTO social_links (id, platform, url, icon, label, is_active, sort_order, created_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
  ).bind(id, platform, url, icon || null, label || null, sortOrder, now).run();

  return c.json({ data: { id, platform, url, icon: icon || null, label: label || null, is_active: true, sort_order: sortOrder } }, 201);
});

// PUT /admin/social/:id - Update social link
social.put("/admin/social/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.prepare("SELECT id FROM social_links WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Social link not found", code: "NOT_FOUND" } }, 404);
  }

  const ALLOWED_COLUMNS = ["platform", "url", "icon", "label", "is_active", "sort_order"] as const;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED_COLUMNS) {
    if (body[col] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[col]);
    }
  }

  if (updates.length === 0) {
    return c.json({ error: { message: "No valid fields to update", code: "VALIDATION" } }, 400);
  }

  params.push(id);
  await db.prepare(`UPDATE social_links SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

  return c.json({ data: { id, updated: true } });
});

// DELETE /admin/social/:id - Remove social link
social.delete("/admin/social/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const existing = await db.prepare("SELECT id FROM social_links WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Social link not found", code: "NOT_FOUND" } }, 404);
  }

  await db.prepare("DELETE FROM social_links WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

// PUT /admin/social/reorder - Reorder social links
social.put("/admin/social/reorder", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { ids } = body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return c.json({ error: { message: "ids array is required", code: "VALIDATION" } }, 400);
  }

  const statements = ids.map((id: string, index: number) => {
    return db.prepare("UPDATE social_links SET sort_order = ? WHERE id = ?").bind(index, id).run();
  });

  await Promise.all(statements);

  return c.json({ data: { reordered: ids.length } });
});

// GET /admin/integrations - List all integrations
social.get("/admin/integrations", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const result = await db
    .prepare("SELECT * FROM integrations ORDER BY created_at DESC")
    .all();

  return c.json({ data: result.results });
});

// POST /admin/integrations - Add integration
social.post("/admin/integrations", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { service, name, config, settings } = body;

  if (!service || !name) {
    return c.json({ error: { message: "Service and name are required", code: "VALIDATION" } }, 400);
  }

  // Check for unique service constraint
  const existing = await db.prepare("SELECT id FROM integrations WHERE service = ?").bind(service).first();
  if (existing) {
    return c.json({ error: { message: "Integration for this service already exists", code: "CONFLICT" } }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const configStr = config ? JSON.stringify(config) : null;
  const settingsStr = settings ? JSON.stringify(settings) : null;

  await db.prepare(
    "INSERT INTO integrations (id, service, name, config, is_enabled, settings, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)"
  ).bind(id, service, name, configStr, settingsStr, now, now).run();

  return c.json({
    data: { id, service, name, is_enabled: true, created_at: now, updated_at: now },
  }, 201);
});

// PUT /admin/integrations/:id - Update integration
social.put("/admin/integrations/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.prepare("SELECT id FROM integrations WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Integration not found", code: "NOT_FOUND" } }, 404);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.name !== undefined) {
    updates.push("name = ?");
    params.push(body.name);
  }

  if (body.config !== undefined) {
    updates.push("config = ?");
    params.push(typeof body.config === "string" ? body.config : JSON.stringify(body.config));
  }

  if (body.is_enabled !== undefined) {
    updates.push("is_enabled = ?");
    params.push(body.is_enabled ? 1 : 0);
  }

  if (body.settings !== undefined) {
    updates.push("settings = ?");
    params.push(typeof body.settings === "string" ? body.settings : JSON.stringify(body.settings));
  }

  if (body.last_sync_at !== undefined) {
    updates.push("last_sync_at = ?");
    params.push(body.last_sync_at);
  }

  if (updates.length === 0) {
    return c.json({ error: { message: "No valid fields to update", code: "VALIDATION" } }, 400);
  }

  const now = new Date().toISOString();
  updates.push("updated_at = ?");
  params.push(now);
  params.push(id);

  await db.prepare(`UPDATE integrations SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

  return c.json({ data: { id, updated_at: now } });
});

// DELETE /admin/integrations/:id - Remove integration
social.delete("/admin/integrations/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const existing = await db.prepare("SELECT id FROM integrations WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Integration not found", code: "NOT_FOUND" } }, 404);
  }

  await db.prepare("DELETE FROM integrations WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

export default social;
