import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const heroSlides = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /hero-slides — Public: get active slides
heroSlides.get("/hero-slides", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slides = await db
    .prepare("SELECT id, title, subtitle, content, background_image_url, background_gradient, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, animation_type FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC")
    .all();

  return c.json({ data: slides.results });
});

// GET /admin/hero-slides — Admin: list all slides
heroSlides.get("/admin/hero-slides", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slides = await db
    .prepare("SELECT * FROM hero_slides ORDER BY sort_order ASC")
    .all();

  return c.json({ data: slides.results });
});

// POST /admin/hero-slides — Create slide
heroSlides.post("/admin/hero-slides", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { title, subtitle, content, background_image_url, background_gradient, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, is_active, animation_type } = body;

  if (!title) {
    return c.json({ error: { message: "Title is required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get max sort_order
  const maxSort = await db.prepare("SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM hero_slides").first<{ max_sort: number }>();
  const sortOrder = (maxSort?.max_sort ?? -1) + 1;

  await db.prepare(
    `INSERT INTO hero_slides (id, title, subtitle, content, background_image_url, background_gradient, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, sort_order, is_active, animation_type, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, title, subtitle || null, content || null, background_image_url || null,
    background_gradient || "from-primary-950 via-primary-900 to-primary-800",
    primary_button_text || null, primary_button_url || null,
    secondary_button_text || null, secondary_button_url || null,
    sortOrder, is_active !== undefined ? (is_active ? 1 : 0) : 1,
    animation_type || "slide", now, now,
  ).run();

  const slide = await db.prepare("SELECT * FROM hero_slides WHERE id = ?").bind(id).first();
  return c.json({ data: slide }, 201);
});

// PUT /admin/hero-slides/:id — Update slide
heroSlides.put("/admin/hero-slides/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const existing = await db.prepare("SELECT id FROM hero_slides WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Slide not found", code: "NOT_FOUND" } }, 404);
  }

  const body = await c.req.json();
  const allowed = ["title", "subtitle", "content", "background_image_url", "background_gradient", "primary_button_text", "primary_button_url", "secondary_button_text", "secondary_button_url", "is_active", "animation_type", "sort_order"] as const;
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const col of allowed) {
    if (body[col] !== undefined) {
      updates.push(`${col} = ?`);
      if (col === "is_active") {
        values.push(body[col] ? 1 : 0);
      } else {
        values.push(body[col]);
      }
    }
  }

  if (updates.length === 0) {
    return c.json({ error: { message: "No fields to update", code: "VALIDATION" } }, 400);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await db.prepare(`UPDATE hero_slides SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
  const slide = await db.prepare("SELECT * FROM hero_slides WHERE id = ?").bind(id).first();
  return c.json({ data: slide });
});

// DELETE /admin/hero-slides/:id — Delete slide
heroSlides.delete("/admin/hero-slides/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const existing = await db.prepare("SELECT id FROM hero_slides WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Slide not found", code: "NOT_FOUND" } }, 404);
  }

  await db.prepare("DELETE FROM hero_slides WHERE id = ?").bind(id).run();
  return c.json({ data: { deleted: true } });
});

// PUT /admin/hero-slides/reorder — Reorder slides
heroSlides.put("/admin/hero-slides/reorder", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return c.json({ error: { message: "items array is required", code: "VALIDATION" } }, 400);
  }

  const now = new Date().toISOString();
  for (const item of items as Array<{ id: string; sort_order: number }>) {
    if (!item.id) continue;
    await db.prepare("UPDATE hero_slides SET sort_order = ?, updated_at = ? WHERE id = ?").bind(item.sort_order, now, item.id).run();
  }

  return c.json({ data: { reordered: true, count: items.length } });
});

export default heroSlides;
