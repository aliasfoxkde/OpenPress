import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { timingSafeEqual } from "./security";

const stripe = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST / - Create a Stripe checkout session from cart
stripe.post("/create", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const secretKey = c.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return c.json({ error: { message: "Stripe not configured", code: "CONFIG_ERROR" } }, 503);
  }

  const user = c.get("user");
  const sessionId = c.req.header("x-session-id") || "anonymous";
  const body = await c.req.json();
  const { success_url, cancel_url, email } = body;

  if (!success_url || !cancel_url) {
    return c.json({ error: { message: "success_url and cancel_url are required", code: "VALIDATION" } }, 400);
  }

  // Get cart items
  const cartResult = user
    ? await db.prepare("SELECT ci.*, p.price, p.sku, ci.title FROM cart_items ci JOIN products p ON ci.product_id = p.id LEFT JOIN content_items ci2 ON p.content_id = ci2.id WHERE ci.user_id = ?").bind(user.id).all()
    : await db.prepare("SELECT * FROM cart_items WHERE session_id = ?").bind(sessionId).all();

  if (!cartResult.results || cartResult.results.length === 0) {
    return c.json({ error: { message: "Cart is empty", code: "EMPTY_CART" } }, 400);
  }

  // Build line items for Stripe
  let subtotal = 0;
  const lineItems: Array<{ price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number }; quantity: number }> = [];

  for (const item of cartResult.results as Array<{ product_id: string; variant_id?: string; quantity: number; title?: string; price?: number; sku?: string }>) {
    // Fetch product details if not already joined
    let product = item;
    if (!item.price) {
      product = await db
        .prepare("SELECT p.price, p.sku, ci.title FROM products p JOIN content_items ci ON p.content_id = ci.id WHERE p.id = ?")
        .bind(item.product_id)
        .first<{ price: number; sku: string; title: string }>() as typeof product;
    }

    if (product && product.price) {
      const unitAmount = Math.round(product.price * 100); // Stripe uses cents
      subtotal += product.price * item.quantity;

      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.title || product.sku || "Product",
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      });
    }
  }

  if (lineItems.length === 0) {
    return c.json({ error: { message: "No valid items in cart", code: "EMPTY_CART" } }, 400);
  }

  // Create order in D1 (status: pending_payment)
  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.prepare(
    "INSERT INTO orders (id, user_id, email, status, subtotal, total, currency, created_at, updated_at) VALUES (?, ?, ?, 'pending_payment', ?, ?, 'USD', ?, ?)"
  ).bind(orderId, user?.id || null, email || user?.email || null, subtotal, subtotal, now, now).run();

  // Create line items in D1
  for (const item of cartResult.results as Array<{ product_id: string; quantity: number }>) {
    const product = await db
      .prepare("SELECT p.price, p.sku, ci.title FROM products p JOIN content_items ci ON p.content_id = ci.id WHERE p.id = ?")
      .bind(item.product_id)
      .first<{ price: number; sku: string; title: string }>();

    if (product) {
      await db.prepare(
        "INSERT INTO order_items (id, order_id, product_id, title, sku, price, quantity, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), orderId, item.product_id, product.title, product.sku, product.price, item.quantity, product.price * item.quantity, now).run();
    }
  }

  // Call Stripe API to create checkout session
  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(secretKey + ":")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "payment",
      payment_method_types: "card",
      line_items: JSON.stringify(lineItems),
      success_url: `${success_url}?order_id=${orderId}`,
      cancel_url: `${cancel_url}?order_id=${orderId}`,
      client_reference_id: orderId,
      metadata: JSON.stringify({ order_id: orderId }),
    }),
  });

  if (!stripeRes.ok) {
    const errBody = await stripeRes.text();
    console.error("Stripe API error:", errBody);
    return c.json({ error: { message: "Failed to create checkout session", code: "STRIPE_ERROR" } }, 502);
  }

  const session = await stripeRes.json() as { id: string; url: string };

  // Store Stripe session ID on order
  await db.prepare("UPDATE orders SET stripe_session_id = ? WHERE id = ?").bind(session.id, orderId).run();

  // Clear cart
  if (user) {
    await db.prepare("DELETE FROM cart_items WHERE user_id = ?").bind(user.id).run();
  } else {
    await db.prepare("DELETE FROM cart_items WHERE session_id = ?").bind(sessionId).run();
  }

  return c.json({ data: { checkout_url: session.url, order_id: orderId } });
});

// POST /webhook - Handle Stripe webhook events
stripe.post("/webhook", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const webhookSecret = c.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return c.json({ error: { message: "Stripe webhook not configured", code: "CONFIG_ERROR" } }, 503);
  }

  const body = await c.req.text();
  const sig = c.req.header("stripe-signature");

  if (!sig) {
    return c.json({ error: { message: "Missing stripe-signature header", code: "VALIDATION" } }, 400);
  }

  // Verify webhook signature using Stripe's signed payload format
  // Stripe sends: t=timestamp,v1=signature
  const timestamp = sig.split(",")[0]?.split("=")[1] || "";
  const signature = sig.split(",")[1]?.split("=")[1] || "";

  // Import Web Crypto for HMAC verification
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const payload = `${timestamp}.${body}`;
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedSig = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (!(await timingSafeEqual(expectedSig, signature))) {
    return c.json({ error: { message: "Invalid signature", code: "INVALID_SIGNATURE" } }, 400);
  }

  // Check timestamp freshness (reject events older than 5 minutes)
  const eventTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - eventTime > 300) {
    return c.json({ error: { message: "Event too old", code: "STALE_EVENT" } }, 400);
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: { message: "Invalid JSON", code: "INVALID_JSON" } }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.client_reference_id as string || session.metadata?.order_id as string;
      const paymentIntentId = session.payment_intent as string;

      if (orderId) {
        const now = new Date().toISOString();
        await db.prepare(
          "UPDATE orders SET status = 'paid', stripe_payment_intent_id = ?, paid_at = ?, updated_at = ? WHERE id = ?"
        ).bind(paymentIntentId, now, now, orderId).run();
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id as string;

      if (orderId) {
        const now = new Date().toISOString();
        await db.prepare(
          "UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?"
        ).bind(now, orderId).run();
      }
      break;
    }
  }

  return c.json({ received: true });
});

// GET /:id/receipt - Get order receipt
stripe.get("/:id/receipt", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const orderId = c.req.param("id");
  const user = c.get("user");

  const order = await db
    .prepare("SELECT * FROM orders WHERE id = ? AND (user_id = ? OR email = ?)")
    .bind(orderId, user?.id || "", user?.email || "")
    .first();

  if (!order) {
    return c.json({ error: { message: "Order not found", code: "NOT_FOUND" } }, 404);
  }

  const lineItems = await db
    .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at")
    .bind(orderId)
    .all();

  return c.json({ data: { ...order, items: lineItems.results } });
});

export default stripe;
