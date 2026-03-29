import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const taxonomies = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List all taxonomies with their terms
taxonomies.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const taxonomyList = await db.prepare("SELECT * FROM taxonomies ORDER BY name ASC").all();

  // Get terms for each taxonomy
  const result = [];
  for (const taxonomy of taxonomyList.results as Record<string, unknown>) {
    const terms = await db
      .prepare("SELECT * FROM terms WHERE taxonomy_id = ? ORDER BY sort_order ASC, name ASC")
      .bind(taxonomy.id as string)
      .all();
    result.push({ ...taxonomy, terms: terms.results });
  }

  return c.json({ data: result });
});

// GET /:id - Get single taxonomy with terms
taxonomies.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const taxonomy = await db.prepare("SELECT * FROM taxonomies WHERE id = ? OR slug = ?").bind(id, id).first();
  if (!taxonomy) {
    return c.json({ error: { message: "Taxonomy not found", code: "NOT_FOUND" } }, 404);
  }

  const terms = await db
    .prepare("SELECT * FROM terms WHERE taxonomy_id = ? ORDER BY sort_order ASC, name ASC")
    .bind(taxonomy.id as string)
    .all();

  return c.json({ data: { ...taxonomy, terms: terms.results } });
});

// POST /:id/terms - Create a new term in a taxonomy
taxonomies.post("/:id/terms", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const taxonomyId = c.req.param("id");
  const taxonomy = await db.prepare("SELECT * FROM taxonomies WHERE id = ? OR slug = ?").bind(taxonomyId, taxonomyId).first();
  if (!taxonomy) {
    return c.json({ error: { message: "Taxonomy not found", code: "NOT_FOUND" } }, 404);
  }

  const body = await c.req.json();
  const { name, description, parent_id } = body;
  if (!name) {
    return c.json({ error: { message: "Term name is required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const slug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO terms (id, taxonomy_id, name, slug, description, parent_id, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, taxonomy.id, name, slug, description || null, parent_id || null, body.sort_order || 0, now)
    .run();

  return c.json({ data: { id, taxonomy_id: taxonomy.id, name, slug, created_at: now } }, 201);
});

// DELETE /terms/:termId - Delete a term
taxonomies.delete("/terms/:termId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const termId = c.req.param("termId");
  const existing = await db.prepare("SELECT id FROM terms WHERE id = ?").bind(termId).first();
  if (!existing) {
    return c.json({ error: { message: "Term not found", code: "NOT_FOUND" } }, 404);
  }

  await db.prepare("DELETE FROM term_relationships WHERE term_id = ?").bind(termId).run();
  await db.prepare("DELETE FROM terms WHERE id = ?").bind(termId).run();

  return c.json({ data: { deleted: true } });
});

export default taxonomies;
