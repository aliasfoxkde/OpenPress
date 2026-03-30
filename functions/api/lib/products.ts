import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { isValidProductStatus } from "./security";

const products = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List products
products.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const status = c.req.query("status") || "active";
  const search = c.req.query("search") || "";
  const sort = c.req.query("sort") || "newest";

  let orderBy = "p.updated_at DESC";
  if (sort === "price-asc") orderBy = "p.price ASC";
  else if (sort === "price-desc") orderBy = "p.price DESC";
  else if (sort === "name") orderBy = "ci.title ASC";

  let whereClause = "WHERE p.status = ?";
  const bindParams: unknown[] = [status];

  if (search) {
    whereClause += " AND (ci.title LIKE ? OR ci.excerpt LIKE ? OR p.sku LIKE ?)";
    const term = `%${search}%`;
    bindParams.push(term, term, term);
  }

  const [items, countResult] = await Promise.all([
    db.prepare(
      `SELECT p.*, ci.title, ci.slug, ci.excerpt, ci.featured_image_url
       FROM products p
       JOIN content_items ci ON p.content_id = ci.id
       ${whereClause}
       ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).bind(...bindParams, limit, offset).all(),
    db.prepare(`SELECT COUNT(*) as total FROM products p JOIN content_items ci ON p.content_id = ci.id ${whereClause}`).bind(...bindParams).first<{ total: number }>(),
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
  if (typeof price !== "number" || price < 0 || price > 99999999) {
    return c.json({ error: { message: "Price must be a number between 0 and 99999999", code: "VALIDATION" } }, 400);
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

  // Build update with allowlisted columns
  const ALLOWED_COLUMNS = ["price", "compare_at_price", "inventory", "sku", "status"] as const;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED_COLUMNS) {
    if (body[col] !== undefined) {
      if (col === "status" && !isValidProductStatus(body[col])) continue;
      updates.push(`${col} = ?`);
      params.push(body[col]);
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(now);
    params.push(id);
    await db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: { id, updated_at: now } });
});

export default products;
