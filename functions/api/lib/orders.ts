import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const orders = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Cart endpoints (public, session-based)
const cart = new Hono<{ Bindings: Bindings; Variables: Variables }>();

cart.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ data: [] });

  const sessionId = c.req.header("x-session-id") || "anonymous";
  const user = c.get("user");

  const items = user
    ? await db.prepare("SELECT * FROM cart_items WHERE user_id = ?").bind(user.id).all()
    : await db.prepare("SELECT * FROM cart_items WHERE session_id = ?").bind(sessionId).all();

  return c.json({ data: items.results });
});

cart.post("/add", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const sessionId = c.req.header("x-session-id") || "anonymous";
  const body = await c.req.json();
  const { product_id, variant_id, quantity = 1 } = body;

  if (!product_id) return c.json({ error: { message: "Product ID required", code: "VALIDATION" } }, 400);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    "INSERT INTO cart_items (id, user_id, session_id, product_id, variant_id, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, user?.id || null, sessionId, product_id, variant_id || null, quantity, now, now).run();

  return c.json({ data: { id, product_id, quantity } }, 201);
});

cart.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  await db.prepare("DELETE FROM cart_items WHERE id = ?").bind(c.req.param("id")).run();
  return c.json({ data: { removed: true } });
});

cart.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const { quantity } = body;

  if (typeof quantity !== "number" || quantity < 1) {
    return c.json({ error: { message: "Quantity must be a positive number", code: "VALIDATION" } }, 400);
  }

  await db.prepare("UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?").bind(quantity, new Date().toISOString(), id).run();
  return c.json({ data: { id, quantity } });
});

cart.post("/clear", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const sessionId = c.req.header("x-session-id") || "anonymous";

  if (user) {
    await db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(user.id).run();
  } else {
    await db.prepare("DELETE FROM cart_items WHERE session_id = ?").bind(sessionId).run();
  }

  return c.json({ data: { cleared: true } });
});

// Orders (protected)
orders.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20")));

  const [items, countResult] = await Promise.all([
    db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .bind(user?.id, limit, (page - 1) * limit).all(),
    db.prepare("SELECT COUNT(*) as total FROM orders WHERE user_id = ?").bind(user?.id).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) },
  });
});

// Single order detail
orders.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!order) return c.json({ error: { message: "Order not found", code: "NOT_FOUND" } }, 404);

  const lineItems = await db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at").bind(id).all();

  return c.json({ data: { ...order, items: lineItems.results } });
});

// Update order status
orders.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const { status } = body;

  if (!status) return c.json({ error: { message: "Status is required", code: "VALIDATION" } }, 400);

  await db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").bind(status, new Date().toISOString(), id).run();
  return c.json({ data: { id, status } });
});

orders.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const body = await c.req.json();
  const { email, shipping_address, billing_address, notes } = body;

  if (!email) return c.json({ error: { message: "Email required", code: "VALIDATION" } }, 400);

  // Get cart items
  const cartItems = user
    ? await db.prepare("SELECT * FROM cart_items WHERE user_id = ?").bind(user.id).all()
    : { results: [] };

  if (cartItems.results.length === 0) {
    return c.json({ error: { message: "Cart is empty", code: "EMPTY_CART" } }, 400);
  }

  // Calculate total
  let subtotal = 0;
  const lineItems = [];
  for (const item of cartItems.results as { product_id: string; variant_id?: string; quantity: number }[]) {
    const product = await db.prepare("SELECT p.price, ci.title, p.sku FROM products p JOIN content_items ci ON p.content_id = ci.id WHERE p.id = ?")
      .bind(item.product_id).first<{ price: number; title: string; sku: string }>();
    if (product) {
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      lineItems.push({ product, item, lineTotal });
    }
  }

  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  const total = subtotal;

  await db.prepare(
    "INSERT INTO orders (id, user_id, email, status, subtotal, total, currency, shipping_address, billing_address, notes, created_at, updated_at) VALUES (?, ?, ?, 'pending', ?, ?, 'USD', ?, ?, ?, ?, ?)"
  ).bind(orderId, user?.id || null, email, subtotal, total, JSON.stringify(shipping_address || {}), JSON.stringify(billing_address || {}), notes || null, now, now).run();

  // Create line items
  for (const li of lineItems) {
    await db.prepare(
      "INSERT INTO order_items (id, order_id, product_id, title, sku, price, quantity, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(crypto.randomUUID(), orderId, li.item.product_id, li.product.title, li.product.sku, li.product.price, li.item.quantity, li.lineTotal, now).run();
  }

  // Clear cart
  if (user) {
    await db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(user.id).run();
  }

  return c.json({ data: { id: orderId, status: "pending", total, currency: "USD" } }, 201);
});

export { cart };
export default orders;
