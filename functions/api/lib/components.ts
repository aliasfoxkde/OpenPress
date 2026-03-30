import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const components = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /admin/components - List all components
components.get("/admin/components", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const category = c.req.query("category") || "";
  const type = c.req.query("type") || "";

  let query = "SELECT * FROM reusable_components ORDER BY name ASC";
  const params: unknown[] = [];

  if (category) {
    query = "SELECT * FROM reusable_components WHERE category = ? ORDER BY name ASC";
    params.push(category);
  }
  if (type) {
    query = "SELECT * FROM reusable_components WHERE type = ? ORDER BY name ASC";
    params.push(type);
  }

  const result = params.length > 0
    ? await db.prepare(query).bind(...params).all()
    : await db.prepare(query).all();

  return c.json({ data: result.results });
});

// POST /admin/components - Create component
components.post("/admin/components", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { name, slug, type, category, description, template, config_schema } = body;

  if (!name || !type) {
    return c.json({ error: { message: "Name and type are required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const componentSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO reusable_components (id, name, slug, type, category, description, template, config_schema, is_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, name, componentSlug, type, category || null, description || null, template || null, config_schema || null, body.is_enabled !== false ? 1 : 0, now, now)
    .run();

  return c.json({ data: { id, name, slug: componentSlug, type, created_at: now } }, 201);
});

// PUT /admin/components/:id - Update component
components.put("/admin/components/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const existing = await db.prepare("SELECT id FROM reusable_components WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Component not found", code: "NOT_FOUND" } }, 404);
  }

  const ALLOWED_COLUMNS = ["name", "slug", "type", "category", "description", "template", "config_schema", "is_enabled"] as const;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED_COLUMNS) {
    if (body[col] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[col]);
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);
    await db.prepare(`UPDATE reusable_components SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: { id, updated_at: now } });
});

// DELETE /admin/components/:id - Delete component
components.delete("/admin/components/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const existing = await db.prepare("SELECT id FROM reusable_components WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Component not found", code: "NOT_FOUND" } }, 404);
  }

  await db.prepare("DELETE FROM reusable_components WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

// POST /admin/components/:id/duplicate - Clone component
components.post("/admin/components/:id/duplicate", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const original = await db.prepare("SELECT * FROM reusable_components WHERE id = ?").bind(id).first<{
    name: string;
    slug: string;
    type: string;
    category: string | null;
    description: string | null;
    template: string | null;
    config_schema: string | null;
    is_enabled: number;
  }>();

  if (!original) {
    return c.json({ error: { message: "Component not found", code: "NOT_FOUND" } }, 404);
  }

  const newId = crypto.randomUUID();
  const newSlug = `${original.slug}-copy-${Date.now()}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO reusable_components (id, name, slug, type, category, description, template, config_schema, is_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(newId, `${original.name} (Copy)`, newSlug, original.type, original.category, original.description, original.template, original.config_schema, 0, now, now)
    .run();

  return c.json({ data: { id: newId, name: `${original.name} (Copy)`, slug: newSlug, type: original.type, created_at: now } }, 201);
});

// GET /components - PUBLIC: List enabled components
components.get("/components", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const category = c.req.query("category") || "";

  let query = "SELECT id, name, slug, type, category, description, config_schema FROM reusable_components WHERE is_enabled = 1 ORDER BY name ASC";
  const params: unknown[] = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  const result = params.length > 0
    ? await db.prepare(query).bind(...params).all()
    : await db.prepare(query).all();

  return c.json({ data: result.results });
});

// GET /components/:slug/render - PUBLIC: Render component by slug
components.get("/components/:slug/render", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");

  const component = await db
    .prepare("SELECT * FROM reusable_components WHERE slug = ? AND is_enabled = 1")
    .bind(slug)
    .first<{
      id: string;
      name: string;
      slug: string;
      type: string;
      category: string | null;
      description: string | null;
      template: string | null;
      config_schema: string | null;
    }>();

  if (!component) {
    return c.json({ error: { message: "Component not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({
    data: {
      id: component.id,
      name: component.name,
      slug: component.slug,
      type: component.type,
      category: component.category,
      description: component.description,
      template: component.template,
      config_schema: component.config_schema ? JSON.parse(component.config_schema) : null,
    },
  });
});

export default components;
