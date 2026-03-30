import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const marketing = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─── Coupons (admin) ──────────────────────────────────────────────────

// GET /admin/marketing/coupons - List coupons
marketing.get("/admin/marketing/coupons", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const search = c.req.query("search");

  let whereClause = "WHERE 1=1";
  const params: unknown[] = [];

  if (search && search.length <= 200) {
    whereClause += " AND (code LIKE ? OR id LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [items, countResult] = await Promise.all([
    db
      .prepare(`SELECT * FROM coupons ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...params, limit, offset)
      .all(),
    db.prepare(`SELECT COUNT(*) as total FROM coupons ${whereClause}`).bind(...params).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

// POST /admin/marketing/coupons - Create coupon
marketing.post("/admin/marketing/coupons", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { code, type, value, min_order, max_uses, starts_at, expires_at, applies_to, is_enabled } = body;

  if (!code || !type || value === undefined) {
    return c.json({ error: { message: "code, type, and value are required", code: "VALIDATION" } }, 400);
  }

  const validTypes = ["percentage", "fixed"];
  if (!validTypes.includes(type)) {
    return c.json({ error: { message: "type must be 'percentage' or 'fixed'", code: "VALIDATION" } }, 400);
  }

  if (typeof value !== "number" || value < 0) {
    return c.json({ error: { message: "value must be a non-negative number", code: "VALIDATION" } }, 400);
  }

  if (type === "percentage" && value > 100) {
    return c.json({ error: { message: "percentage value cannot exceed 100", code: "VALIDATION" } }, 400);
  }

  // Check for duplicate code
  const existing = await db.prepare("SELECT id FROM coupons WHERE code = ?").bind(code.trim().toUpperCase()).first();
  if (existing) {
    return c.json({ error: { message: "Coupon code already exists", code: "DUPLICATE" } }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    "INSERT INTO coupons (id, code, type, value, min_order, max_uses, used_count, starts_at, expires_at, applies_to, is_enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    code.trim().toUpperCase(),
    type,
    value,
    min_order || null,
    max_uses || null,
    starts_at || null,
    expires_at || null,
    applies_to || null,
    is_enabled !== undefined ? (is_enabled ? 1 : 0) : 1,
    now,
  ).run();

  const coupon = await db.prepare("SELECT * FROM coupons WHERE id = ?").bind(id).first();

  return c.json({ data: coupon }, 201);
});

// PUT /admin/marketing/coupons/:id - Update coupon
marketing.put("/admin/marketing/coupons/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.prepare("SELECT id FROM coupons WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Coupon not found", code: "NOT_FOUND" } }, 404);
  }

  const ALLOWED_COLUMNS = ["code", "type", "value", "min_order", "max_uses", "starts_at", "expires_at", "applies_to", "is_enabled"] as const;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED_COLUMNS) {
    if (body[col] !== undefined) {
      if (col === "code") {
        const normalizedCode = (body[col] as string).trim().toUpperCase();
        // Check for duplicate code if changing it
        const dup = await db.prepare("SELECT id FROM coupons WHERE code = ? AND id != ?").bind(normalizedCode, id).first();
        if (dup) {
          return c.json({ error: { message: "Coupon code already exists", code: "DUPLICATE" } }, 409);
        }
        updates.push("code = ?");
        params.push(normalizedCode);
      } else if (col === "is_enabled") {
        updates.push("is_enabled = ?");
        params.push(body[col] ? 1 : 0);
      } else {
        updates.push(`${col} = ?`);
        params.push(body[col]);
      }
    }
  }

  if (updates.length === 0) {
    return c.json({ error: { message: "No valid fields to update", code: "VALIDATION" } }, 400);
  }

  params.push(id);
  await db.prepare(`UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

  const coupon = await db.prepare("SELECT * FROM coupons WHERE id = ?").bind(id).first();

  return c.json({ data: coupon });
});

// DELETE /admin/marketing/coupons/:id - Delete coupon
marketing.delete("/admin/marketing/coupons/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const existing = await db.prepare("SELECT id FROM coupons WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Coupon not found", code: "NOT_FOUND" } }, 404);
  }

  // Check if coupon is referenced by any active campaigns
  const campaignRef = await db.prepare("SELECT id FROM campaigns WHERE coupon_id = ? AND is_active = 1").bind(id).first();
  if (campaignRef) {
    return c.json({ error: { message: "Cannot delete coupon: it is referenced by an active campaign", code: "REFERENCED" } }, 409);
  }

  await db.prepare("DELETE FROM coupons WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

// ─── Campaigns (admin) ────────────────────────────────────────────────

// GET /admin/marketing/campaigns - List campaigns
marketing.get("/admin/marketing/campaigns", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const search = c.req.query("search");

  let whereClause = "WHERE 1=1";
  const params: unknown[] = [];

  if (search && search.length <= 200) {
    whereClause += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        `SELECT cm.*, cp.code as coupon_code, cp.type as coupon_type, cp.value as coupon_value
         FROM campaigns cm
         LEFT JOIN coupons cp ON cm.coupon_id = cp.id
         ${whereClause} ORDER BY cm.created_at DESC LIMIT ? OFFSET ?`
      )
      .bind(...params, limit, offset)
      .all(),
    db.prepare(`SELECT COUNT(*) as total FROM campaigns ${whereClause}`).bind(...params).first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

// POST /admin/marketing/campaigns - Create campaign
marketing.post("/admin/marketing/campaigns", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { title, type, description, banner_image_url, starts_at, ends_at, coupon_id, applies_to, is_active } = body;

  if (!title || !type) {
    return c.json({ error: { message: "title and type are required", code: "VALIDATION" } }, 400);
  }

  const validTypes = ["sale", "banner", "promotion", "announcement"];
  if (!validTypes.includes(type)) {
    return c.json({ error: { message: "type must be one of: sale, banner, promotion, announcement", code: "VALIDATION" } }, 400);
  }

  // Verify coupon exists if provided
  if (coupon_id) {
    const coupon = await db.prepare("SELECT id FROM coupons WHERE id = ?").bind(coupon_id).first();
    if (!coupon) {
      return c.json({ error: { message: "Referenced coupon not found", code: "NOT_FOUND" } }, 400);
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    "INSERT INTO campaigns (id, title, type, description, banner_image_url, starts_at, ends_at, coupon_id, applies_to, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    id,
    title,
    type,
    description || null,
    banner_image_url || null,
    starts_at || null,
    ends_at || null,
    coupon_id || null,
    applies_to || null,
    is_active !== undefined ? (is_active ? 1 : 0) : 1,
    now,
    now,
  ).run();

  const campaign = await db
    .prepare(
      `SELECT cm.*, cp.code as coupon_code, cp.type as coupon_type, cp.value as coupon_value
       FROM campaigns cm
       LEFT JOIN coupons cp ON cm.coupon_id = cp.id
       WHERE cm.id = ?`
    )
    .bind(id)
    .first();

  return c.json({ data: campaign }, 201);
});

// PUT /admin/marketing/campaigns/:id - Update campaign
marketing.put("/admin/marketing/campaigns/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();

  const existing = await db.prepare("SELECT id FROM campaigns WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Campaign not found", code: "NOT_FOUND" } }, 404);
  }

  // Verify coupon exists if provided
  if (body.coupon_id) {
    const coupon = await db.prepare("SELECT id FROM coupons WHERE id = ?").bind(body.coupon_id).first();
    if (!coupon) {
      return c.json({ error: { message: "Referenced coupon not found", code: "NOT_FOUND" } }, 400);
    }
  }

  const ALLOWED_COLUMNS = ["title", "type", "description", "banner_image_url", "starts_at", "ends_at", "coupon_id", "applies_to", "is_active"] as const;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED_COLUMNS) {
    if (body[col] !== undefined) {
      if (col === "is_active") {
        updates.push("is_active = ?");
        params.push(body[col] ? 1 : 0);
      } else {
        updates.push(`${col} = ?`);
        params.push(body[col]);
      }
    }
  }

  if (updates.length === 0) {
    return c.json({ error: { message: "No valid fields to update", code: "VALIDATION" } }, 400);
  }

  const now = new Date().toISOString();
  updates.push("updated_at = ?");
  params.push(now);
  params.push(id);

  await db.prepare(`UPDATE campaigns SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

  const campaign = await db
    .prepare(
      `SELECT cm.*, cp.code as coupon_code, cp.type as coupon_type, cp.value as coupon_value
       FROM campaigns cm
       LEFT JOIN coupons cp ON cm.coupon_id = cp.id
       WHERE cm.id = ?`
    )
    .bind(id)
    .first();

  return c.json({ data: campaign });
});

// DELETE /admin/marketing/campaigns/:id - Delete campaign
marketing.delete("/admin/marketing/campaigns/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const existing = await db.prepare("SELECT id FROM campaigns WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Campaign not found", code: "NOT_FOUND" } }, 404);
  }

  await db.prepare("DELETE FROM campaigns WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

// ─── Public Cart Coupon Routes ────────────────────────────────────────

// POST /cart/apply-coupon - Validate and apply coupon to cart session
marketing.post("/cart/apply-coupon", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { code } = body;

  if (!code) {
    return c.json({ error: { message: "Coupon code is required", code: "VALIDATION" } }, 400);
  }

  const normalizedCode = code.trim().toUpperCase();

  // Find the coupon
  const coupon = await db
    .prepare("SELECT * FROM coupons WHERE code = ? AND is_enabled = 1")
    .bind(normalizedCode)
    .first<{
      id: string;
      code: string;
      type: string;
      value: number;
      min_order: number | null;
      max_uses: number | null;
      used_count: number;
      starts_at: string | null;
      expires_at: string | null;
      applies_to: string | null;
    }>();

  if (!coupon) {
    return c.json({ error: { message: "Invalid or expired coupon code", code: "INVALID_COUPON" } }, 404);
  }

  // Check usage limit
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return c.json({ error: { message: "Coupon usage limit reached", code: "COUPON_EXHAUSTED" } }, 400);
  }

  // Check date validity
  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return c.json({ error: { message: "Coupon is not yet active", code: "COUPON_NOT_ACTIVE" } }, 400);
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return c.json({ error: { message: "Coupon has expired", code: "COUPON_EXPIRED" } }, 400);
  }

  // Get cart subtotal to check min_order and calculate discount
  const sessionId = c.req.header("x-session-id") || "anonymous";
  const user = c.get("user");

  const cartResult = user
    ? await db.prepare("SELECT ci.*, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id = ?").bind(user.id).all()
    : await db.prepare("SELECT ci.*, p.price FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.session_id = ?").bind(sessionId).all();

  let subtotal = 0;
  for (const item of cartResult.results as { quantity: number; price: number }[]) {
    subtotal += item.price * item.quantity;
  }

  // Check minimum order
  if (coupon.min_order !== null && subtotal < coupon.min_order) {
    return c.json({
      error: {
        message: `Minimum order of $${coupon.min_order.toFixed(2)} required for this coupon`,
        code: "MIN_ORDER_NOT_MET",
      },
    }, 400);
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage") {
    discount = Math.round(subtotal * (coupon.value / 100) * 100) / 100;
  } else {
    discount = Math.min(coupon.value, subtotal);
  }

  // Store applied coupon in cart (update existing cart_items' session/user records)
  // We store the applied coupon info in a lightweight way using KV for the session
  const cache = c.env.CACHE;
  if (cache) {
    const cartCouponKey = user ? `cart:coupon:user:${user.id}` : `cart:coupon:session:${sessionId}`;
    await cache.put(cartCouponKey, JSON.stringify({
      coupon_id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      applies_to: coupon.applies_to,
    }), { expirationTtl: 86400 }); // 24h TTL
  }

  return c.json({
    data: {
      coupon_id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      subtotal,
      total: subtotal - discount,
    },
  });
});

// DELETE /cart/coupon - Remove coupon from cart session
marketing.delete("/cart/coupon", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const sessionId = c.req.header("x-session-id") || "anonymous";
  const user = c.get("user");

  const cache = c.env.CACHE;
  if (cache) {
    const cartCouponKey = user ? `cart:coupon:user:${user.id}` : `cart:coupon:session:${sessionId}`;
    await cache.delete(cartCouponKey);
  }

  return c.json({ data: { coupon_removed: true } });
});

export default marketing;
