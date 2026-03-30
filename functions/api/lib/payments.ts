import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const payments = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Admin: list all payment providers
payments.get("/admin/providers", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const providers = await db.prepare("SELECT * FROM payment_providers ORDER BY created_at DESC").all();
  return c.json({ data: providers.results });
});

// Admin: create a payment provider
payments.post("/admin/providers", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { name, type, config, settings, is_enabled = true } = body;

  if (!name || !type) {
    return c.json({ error: { message: "name and type are required", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    "INSERT INTO payment_providers (id, name, type, is_enabled, config, settings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, name, type, is_enabled ? 1 : 0, JSON.stringify(config || {}), JSON.stringify(settings || {}), now, now).run();

  return c.json({ data: { id, name, type, is_enabled } }, 201);
});

// Admin: update a payment provider
payments.put("/admin/providers/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, type, config, settings, is_enabled } = body;

  const existing = await db.prepare("SELECT * FROM payment_providers WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: { message: "Provider not found", code: "NOT_FOUND" } }, 404);

  const now = new Date().toISOString();
  await db.prepare(
    "UPDATE payment_providers SET name = ?, type = ?, is_enabled = ?, config = ?, settings = ?, updated_at = ? WHERE id = ?"
  ).bind(
    name ?? (existing as { name: string }).name,
    type ?? (existing as { type: string }).type,
    is_enabled !== undefined ? (is_enabled ? 1 : 0) : (existing as { is_enabled: number }).is_enabled,
    config !== undefined ? JSON.stringify(config) : (existing as { config: string }).config,
    settings !== undefined ? JSON.stringify(settings) : (existing as { settings: string }).settings,
    now,
    id,
  ).run();

  return c.json({ data: { id, name: name ?? (existing as { name: string }).name, type: type ?? (existing as { type: string }).type, is_enabled: is_enabled !== undefined ? is_enabled : !!(existing as { is_enabled: number }).is_enabled } });
});

// Admin: delete a payment provider
payments.delete("/admin/providers/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const existing = await db.prepare("SELECT * FROM payment_providers WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: { message: "Provider not found", code: "NOT_FOUND" } }, 404);

  await db.prepare("DELETE FROM payment_providers WHERE id = ?").bind(id).run();
  return c.json({ data: { removed: true } });
});

// Admin: list transactions with pagination
payments.get("/admin/transactions", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const provider = c.req.query("provider") || "";
  const status = c.req.query("status") || "";

  let query = "SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT ? OFFSET ?";
  let countQuery = "SELECT COUNT(*) as total FROM payment_transactions";
  const bindParams: unknown[] = [limit, (page - 1) * limit];
  const countParams: unknown[] = [];
  const conditions: string[] = [];

  if (provider) {
    conditions.push("provider = ?");
    bindParams.unshift(provider);
    countParams.push(provider);
  }
  if (status) {
    conditions.push("status = ?");
    bindParams.unshift(status);
    countParams.push(status);
  }

  if (conditions.length > 0) {
    const where = " WHERE " + conditions.join(" AND ");
    query = query.replace(" ORDER BY", where + " ORDER BY");
    countQuery += where;
  }

  const [items, countResult] = await Promise.all([
    db.prepare(query).bind(...bindParams).all(),
    db.prepare(countQuery).bind(...countParams).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: { page, limit, total: countResult?.total || 0, totalPages: Math.ceil((countResult?.total || 0) / limit) },
  });
});

// Public: list enabled providers for checkout
payments.get("/checkout/providers", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ data: [] });

  const providers = await db.prepare("SELECT id, name, type FROM payment_providers WHERE is_enabled = 1 ORDER BY created_at ASC").all();
  return c.json({ data: providers.results });
});

// Public: create payment session for a provider type
payments.post("/checkout/providers/:type/session", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const type = c.req.param("type");
  const body = await c.req.json();
  const { order_id, return_url } = body;

  if (!order_id) {
    return c.json({ error: { message: "order_id is required", code: "VALIDATION" } }, 400);
  }

  // Find enabled provider for this type
  const provider = await db
    .prepare("SELECT * FROM payment_providers WHERE type = ? AND is_enabled = 1")
    .bind(type)
    .first<{ id: string; name: string; config: string; settings: string }>();

  if (!provider) {
    return c.json({ error: { message: `No enabled provider found for type: ${type}`, code: "NOT_FOUND" } }, 404);
  }

  // Verify order exists
  const order = await db.prepare("SELECT * FROM orders WHERE id = ?").bind(order_id).first<{ id: string; total: number; currency: string }>();
  if (!order) {
    return c.json({ error: { message: "Order not found", code: "NOT_FOUND" } }, 404);
  }

  const providerConfig = JSON.parse(provider.config || "{}") as Record<string, string>;
  const transactionId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Record transaction
  await db.prepare(
    "INSERT INTO payment_transactions (id, order_id, provider, provider_transaction_id, status, amount, currency, metadata, created_at) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)"
  ).bind(transactionId, order_id, type, null, order.total, order.currency || "USD", JSON.stringify({ provider_id: provider.id, return_url: return_url || "" }), now).run();

  // Update order with provider reference
  await db.prepare("UPDATE orders SET payment_provider_id = ?, updated_at = ? WHERE id = ?").bind(provider.id, now, order_id).run();

  // Return session info — the frontend handles provider-specific redirect logic
  return c.json({
    data: {
      transaction_id: transactionId,
      provider: type,
      provider_name: provider.name,
      amount: order.total,
      currency: order.currency || "USD",
      return_url: return_url || null,
    },
  });
});

export default payments;
