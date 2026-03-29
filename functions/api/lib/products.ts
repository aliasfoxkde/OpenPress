import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const products = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List products
products.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const status = c.req.query("status") || "active";

  const [items, countResult] = await Promise.all([
    db.prepare(
      `SELECT p.*, ci.title, ci.slug, ci.excerpt, ci.featured_image_url
       FROM products p
       JOIN content_items ci ON p.content_id = ci.id
       WHERE p.status = ?
       ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
    ).bind(status, limit, offset).all(),
    db.prepare("SELECT COUNT(*) as total FROM products WHERE status = ?").bind(status).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) },
  });
});

// GET /:id - Get single product
products.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const product = await db.prepare(
    `SELECT p.*, ci.title, ci.slug, ci.content, ci.excerpt, ci.featured_image_url
     FROM products p
     JOIN content_items ci ON p.content_id = ci.id
     WHERE p.id = ? OR p.sku = ?`
  ).bind(id, id).first();

  if (!product) return c.json({ error: { message: "Product not found", code: "NOT_FOUND" } }, 404);

  const variants = await db.prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY sort_order").bind(product.id as string).all();

  return c.json({ data: { ...product, variants: variants.results } });
});

// POST / - Create product
products.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const body = await c.req.json();
  const { title, price, sku, content_id, compare_at_price, inventory, is_digital, status } = body;

  if (!title || price == null) {
    return c.json({ error: { message: "Title and price are required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Create content item if not provided
  let cId = content_id;
  if (!cId) {
    cId = crypto.randomUUID();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await db.prepare(
      "INSERT INTO content_items (id, type, slug, title, status, author_id, created_at, updated_at) VALUES (?, 'product', ?, ?, 'published', ?, ?, ?)"
    ).bind(cId, slug, title, user?.id || null, now, now).run();
  }

  await db.prepare(
    "INSERT INTO products (id, content_id, sku, price, compare_at_price, inventory, is_digital, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, cId, sku || null, price, compare_at_price || null, inventory || 0, is_digital ? 1 : 0, status || "draft", now, now).run();

  return c.json({ data: { id, content_id: cId, price, status: status || "draft" } }, 201);
});

// PUT /:id - Update product
products.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const params: unknown[] = [];

  if (body.price !== undefined) { updates.push("price = ?"); params.push(body.price); }
  if (body.compare_at_price !== undefined) { updates.push("compare_at_price = ?"); params.push(body.compare_at_price); }
  if (body.inventory !== undefined) { updates.push("inventory = ?"); params.push(body.inventory); }
  if (body.sku !== undefined) { updates.push("sku = ?"); params.push(body.sku); }
  if (body.status !== undefined) { updates.push("status = ?"); params.push(body.status); }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);
    await db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: { id, updated_at: now } });
});

export default products;
