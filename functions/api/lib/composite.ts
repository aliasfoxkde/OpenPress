import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const composite = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ========================
// PUBLIC ROUTES
// ========================

// GET /:slug/composite — Get full composite product for customer view
composite.get("/:slug/composite", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");

  // Find the product
  const product = await db.prepare(
    `SELECT p.*, ci.title, ci.slug, ci.content, ci.excerpt, ci.featured_image_url
     FROM products p
     JOIN content_items ci ON p.content_id = ci.id
     WHERE ci.slug = ? AND p.product_type = 'composite' AND p.status = 'active'`
  ).bind(slug).first();

  if (!product) {
    return c.json({ error: { message: "Composite product not found", code: "NOT_FOUND" } }, 404);
  }

  // Get composite metadata
  const comp = await db.prepare(
    "SELECT * FROM composite_products WHERE product_id = ?"
  ).bind(product.id as string).first();

  if (!comp) {
    return c.json({ error: { message: "Composite configuration not found", code: "NOT_FOUND" } }, 404);
  }

  // Get components with their options (joined with product data)
  const components = await db.prepare(
    `SELECT cc.* FROM composite_components cc
     WHERE cc.composite_id = ?
     ORDER BY cc.sort_order`
  ).bind(comp.id as string).all();

  const componentsWithOptions = [];
  for (const comp2 of components.results as any[]) {
    const options = await db.prepare(
      `SELECT cco.*, p.price as base_product_price, ci.title as product_title, ci.slug as product_slug,
              ci.featured_image_url as product_image, p.sku as product_sku, p.inventory as product_inventory
       FROM composite_component_options cco
       JOIN products p ON cco.product_id = p.id
       JOIN content_items ci ON p.content_id = ci.id
       WHERE cco.component_id = ?
       ORDER BY cco.sort_order`
    ).bind(comp2.id).all();
    componentsWithOptions.push({ ...comp2, options: options.results });
  }

  // Get scenarios with their defaults
  const scenarios = await db.prepare(
    "SELECT * FROM composite_scenarios WHERE composite_id = ? ORDER BY sort_order"
  ).bind(comp.id as string).all();

  const scenariosWithDefaults = [];
  for (const scenario of scenarios.results as any[]) {
    const defaults = await db.prepare(
      `SELECT sd.*, ci.title as option_title
       FROM composite_scenario_defaults sd
       LEFT JOIN products p ON sd.option_id = p.id
       LEFT JOIN content_items ci ON p.content_id = ci.id
       WHERE sd.scenario_id = ?`
    ).bind(scenario.id).all();
    scenariosWithDefaults.push({ ...scenario, defaults: defaults.results });
  }

  // Get compatibility rules
  const compatRules = await db.prepare(
    `SELECT cr.*,
       ci1.title as option_title,
       ci2.title as incompatible_option_title,
       cc1.title as component_title,
       cc2.title as incompatible_component_title
     FROM composite_compat_rules cr
     LEFT JOIN composite_components cc1 ON cr.component_id = cc1.id
     LEFT JOIN composite_components cc2 ON cr.incompatible_component_id = cc2.id
     LEFT JOIN products p1 ON cr.option_id = p1.id
     LEFT JOIN content_items ci1 ON p1.content_id = ci1.id
     LEFT JOIN products p2 ON cr.incompatible_option_id = p2.id
     LEFT JOIN content_items ci2 ON p2.content_id = ci2.id
     WHERE cr.composite_id = ?`
  ).bind(comp.id as string).all();

  return c.json({
    data: {
      product,
      composite: comp,
      components: componentsWithOptions,
      scenarios: scenariosWithDefaults,
      compatRules: compatRules.results,
    },
  });
});

// POST /:slug/composite/validate — Validate a configuration
composite.post("/:slug/composite/validate", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const body = await c.req.json();
  const { configuration } = body as { configuration: Record<string, string[]> };

  if (!configuration || typeof configuration !== "object") {
    return c.json({ error: { message: "Configuration object required", code: "VALIDATION" } }, 400);
  }

  // Find composite product
  const product = await db.prepare(
    `SELECT p.id FROM products p
     JOIN content_items ci ON p.content_id = ci.id
     WHERE ci.slug = ? AND p.product_type = 'composite'`
  ).bind(slug).first<{ id: string }>();

  if (!product) {
    return c.json({ error: { message: "Composite product not found", code: "NOT_FOUND" } }, 404);
  }

  const comp = await db.prepare(
    "SELECT id FROM composite_products WHERE product_id = ?"
  ).bind(product.id).first<{ id: string }>();

  if (!comp) {
    return c.json({ error: { message: "Composite configuration not found", code: "NOT_FOUND" } }, 404);
  }

  // Check required components
  const components = await db.prepare(
    "SELECT * FROM composite_components WHERE composite_id = ?"
  ).bind(comp.id).all();

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const comp2 of components.results as any[]) {
    const selected = configuration[comp2.id];
    if (comp2.is_required && (!selected || selected.length === 0)) {
      errors.push(`"${comp2.title}" is required`);
    }
    if (comp2.selection_type === "single" && selected && selected.length > 1) {
      errors.push(`"${comp2.title}" accepts only one option`);
    }
  }

  // Check compatibility rules
  const rules = await db.prepare(
    "SELECT * FROM composite_compat_rules WHERE composite_id = ?"
  ).bind(comp.id).all();

  for (const rule of rules.results as any[]) {
    const selectedOptions = configuration[rule.component_id] || [];
    const incompatibleSelected = configuration[rule.incompatible_component_id] || [];

    if (selectedOptions.includes(rule.option_id) && incompatibleSelected.includes(rule.incompatible_option_id)) {
      warnings.push(rule.message || "Selected options are incompatible");
    }
  }

  return c.json({ data: { valid: errors.length === 0, errors, warnings } });
});

// POST /:slug/composite/price — Calculate price for a configuration
composite.post("/:slug/composite/price", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const slug = c.req.param("slug");
  const body = await c.req.json();
  const { configuration } = body as { configuration: Record<string, string[]> };

  if (!configuration || typeof configuration !== "object") {
    return c.json({ error: { message: "Configuration object required", code: "VALIDATION" } }, 400);
  }

  // Find composite product
  const product = await db.prepare(
    `SELECT p.id, p.price FROM products p
     JOIN content_items ci ON p.content_id = ci.id
     WHERE ci.slug = ? AND p.product_type = 'composite'`
  ).bind(slug).first<{ id: string; price: number }>();

  if (!product) {
    return c.json({ error: { message: "Composite product not found", code: "NOT_FOUND" } }, 404);
  }

  const comp = await db.prepare(
    "SELECT base_price FROM composite_products WHERE product_id = ?"
  ).bind(product.id).first<{ base_price: number }>();

  let total = comp?.base_price ?? product.price ?? 0;

  // Sum up option prices
  for (const [componentId, optionIds] of Object.entries(configuration)) {
    for (const optionId of optionIds as string[]) {
      const option = await db.prepare(
        `SELECT cco.price_override, cco.price_override_type, cco.price_override_value, p.price as base_product_price
         FROM composite_component_options cco
         JOIN products p ON cco.product_id = p.id
         WHERE cco.id = ?`
      ).bind(optionId).first<any>();

      if (option) {
        if (option.price_override && option.price_override_value != null) {
          const basePrice = option.base_product_price || 0;
          if (option.price_override_type === "fixed") {
            total += option.price_override_value;
          } else if (option.price_override_type === "discount") {
            total += basePrice - option.price_override_value;
          } else if (option.price_override_type === "markup") {
            total += basePrice + option.price_override_value;
          }
        } else {
          total += option.base_product_price || 0;
        }
      }
    }
  }

  return c.json({ data: { total, currency: "USD" } });
});

// ========================
// ADMIN ROUTES
// ========================

// GET /admin — List all composite products
composite.get("/admin", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const items = await db.prepare(
    `SELECT cp.*, p.status as product_status, ci.title, ci.slug, ci.featured_image_url
     FROM composite_products cp
     JOIN products p ON cp.product_id = p.id
     JOIN content_items ci ON p.content_id = ci.id
     ORDER BY cp.created_at DESC`
  ).all();

  // Get component counts for each composite
  const withCounts = [];
  for (const item of items.results as any[]) {
    const [compCount, optionCount] = await Promise.all([
      db.prepare("SELECT COUNT(*) as count FROM composite_components WHERE composite_id = ?").bind(item.id).first<{ count: number }>(),
      db.prepare("SELECT COUNT(*) as count FROM composite_component_options o JOIN composite_components c ON o.component_id = c.id WHERE c.composite_id = ?").bind(item.id).first<{ count: number }>(),
    ]);
    withCounts.push({ ...item, component_count: compCount?.count || 0, option_count: optionCount?.count || 0 });
  }

  return c.json({ data: withCounts });
});

// POST /admin — Create composite product
composite.post("/admin", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const body = await c.req.json();
  const { title, slug, base_price, price_display, layout } = body;

  if (!title) {
    return c.json({ error: { message: "Title is required", code: "VALIDATION" } }, 400);
  }

  const now = new Date().toISOString();
  const productId = crypto.randomUUID();
  const compositeId = crypto.randomUUID();
  const contentId = crypto.randomUUID();
  const productSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Create content item
  await db.prepare(
    "INSERT INTO content_items (id, type, slug, title, status, author_id, created_at, updated_at) VALUES (?, 'product', ?, ?, 'active', ?, ?, ?)"
  ).bind(contentId, productSlug, title, user?.id || null, now, now).run();

  // Create product with composite type
  await db.prepare(
    "INSERT INTO products (id, content_id, price, product_type, status, created_at, updated_at) VALUES (?, ?, ?, 'composite', 'active', ?, ?)"
  ).bind(productId, contentId, base_price || 0, now, now).run();

  // Create composite metadata
  await db.prepare(
    "INSERT INTO composite_products (id, product_id, base_price, price_display, layout, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(compositeId, productId, base_price || 0, price_display || "range", layout || "accordion", now, now).run();

  return c.json({
    data: {
      id: compositeId,
      product_id: productId,
      content_id: contentId,
      slug: productSlug,
      title,
    },
  }, 201);
});

// PUT /admin/:id — Update composite metadata
composite.put("/admin/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const ALLOWED = ["base_price", "min_price", "max_price", "price_display", "layout", "shop_page_thumbnail"];
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED) {
    if (body[col] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[col]);
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(now, id);
    await db.prepare(`UPDATE composite_products SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: { id, updated_at: now } });
});

// DELETE /admin/:id — Delete composite product
composite.delete("/admin/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const comp = await db.prepare("SELECT product_id FROM composite_products WHERE id = ?").bind(id).first<{ product_id: string }>();
  if (!comp) {
    return c.json({ error: { message: "Composite product not found", code: "NOT_FOUND" } }, 404);
  }

  // Delete in transaction (cascade handles components, options, scenarios, rules)
  await db.prepare("DELETE FROM composite_products WHERE id = ?").bind(id).run();
  await db.prepare("DELETE FROM products WHERE id = ?").bind(comp.product_id).run();

  return c.json({ data: { deleted: true } });
});

// ========================
// COMPONENT MANAGEMENT
// ========================

// POST /admin/:id/components — Add component to composite
composite.post("/admin/:id/components", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const compositeId = c.req.param("id");
  const body = await c.req.json();
  const { title, description, is_required, selection_type, min_quantity, max_quantity, display_mode, sort_order } = body;

  if (!title) {
    return c.json({ error: { message: "Component title is required", code: "VALIDATION" } }, 400);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO composite_components (id, composite_id, title, description, is_required, selection_type, min_quantity, max_quantity, display_mode, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, compositeId, title, description || null, is_required !== false ? 1 : 0, selection_type || "single", min_quantity || 1, max_quantity || 1, display_mode || "thumbnail", sort_order || 0, now, now).run();

  return c.json({ data: { id, title } }, 201);
});

// PUT /admin/:id/components/:componentId — Update component
composite.put("/admin/:id/components/:componentId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const componentId = c.req.param("componentId");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const ALLOWED = ["title", "description", "is_required", "selection_type", "min_quantity", "max_quantity", "display_mode", "sort_order"];
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED) {
    if (body[col] !== undefined) {
      if (col === "is_required") {
        updates.push(`${col} = ?`);
        params.push(body[col] ? 1 : 0);
      } else {
        updates.push(`${col} = ?`);
        params.push(body[col]);
      }
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = ?");
    params.push(now, componentId);
    await db.prepare(`UPDATE composite_components SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: { id: componentId, updated_at: now } });
});

// DELETE /admin/:id/components/:componentId — Remove component
composite.delete("/admin/:id/components/:componentId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const componentId = c.req.param("componentId");
  await db.prepare("DELETE FROM composite_components WHERE id = ?").bind(componentId).run();
  return c.json({ data: { deleted: true } });
});

// ========================
// OPTION MANAGEMENT
// ========================

// POST /admin/:id/components/:componentId/options — Add option to component
composite.post("/admin/:id/components/:componentId/options", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const componentId = c.req.param("componentId");
  const body = await c.req.json();
  const { product_id, is_default, price_override, price_override_type, price_override_value, sort_order } = body;

  if (!product_id) {
    return c.json({ error: { message: "Product ID is required", code: "VALIDATION" } }, 400);
  }

  // Verify the product exists
  const prod = await db.prepare("SELECT id FROM products WHERE id = ?").bind(product_id).first();
  if (!prod) {
    return c.json({ error: { message: "Referenced product not found", code: "NOT_FOUND" } }, 404);
  }

  const id = crypto.randomUUID();

  await db.prepare(
    `INSERT INTO composite_component_options (id, component_id, product_id, is_default, price_override, price_override_type, price_override_value, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, componentId, product_id, is_default ? 1 : 0, price_override || null, price_override_type || null, price_override_value || null, sort_order || 0).run();

  return c.json({ data: { id, product_id } }, 201);
});

// DELETE /admin/:id/components/:componentId/options/:optionId — Remove option
composite.delete("/admin/:id/components/:componentId/options/:optionId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const optionId = c.req.param("optionId");
  await db.prepare("DELETE FROM composite_component_options WHERE id = ?").bind(optionId).run();
  return c.json({ data: { deleted: true } });
});

// ========================
// SCENARIO MANAGEMENT
// ========================

// POST /admin/:id/scenarios — Add scenario
composite.post("/admin/:id/scenarios", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const compositeId = c.req.param("id");
  const body = await c.req.json();
  const { title, description, thumbnail_url, is_default, sort_order, defaults } = body;

  if (!title) {
    return c.json({ error: { message: "Scenario title is required", code: "VALIDATION" } }, 400);
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.prepare(
    "INSERT INTO composite_scenarios (id, composite_id, title, description, thumbnail_url, is_default, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, compositeId, title, description || null, thumbnail_url || null, is_default ? 1 : 0, sort_order || 0, now).run();

  // Add defaults if provided
  if (defaults && Array.isArray(defaults)) {
    for (const def of defaults) {
      const defId = crypto.randomUUID();
      await db.prepare(
        "INSERT INTO composite_scenario_defaults (id, scenario_id, component_id, option_id, is_hidden) VALUES (?, ?, ?, ?, ?)"
      ).bind(defId, id, def.component_id, def.option_id || null, def.is_hidden ? 1 : 0).run();
    }
  }

  return c.json({ data: { id, title } }, 201);
});

// PUT /admin/:id/scenarios/:scenarioId — Update scenario
composite.put("/admin/:id/scenarios/:scenarioId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const scenarioId = c.req.param("scenarioId");
  const body = await c.req.json();

  const ALLOWED = ["title", "description", "thumbnail_url", "is_default", "sort_order"];
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED) {
    if (body[col] !== undefined) {
      if (col === "is_default") {
        updates.push(`${col} = ?`);
        params.push(body[col] ? 1 : 0);
      } else {
        updates.push(`${col} = ?`);
        params.push(body[col]);
      }
    }
  }

  if (updates.length > 0) {
    params.push(scenarioId);
    await db.prepare(`UPDATE composite_scenarios SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  return c.json({ data: { id: scenarioId } });
});

// DELETE /admin/:id/scenarios/:scenarioId — Remove scenario
composite.delete("/admin/:id/scenarios/:scenarioId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const scenarioId = c.req.param("scenarioId");
  await db.prepare("DELETE FROM composite_scenarios WHERE id = ?").bind(scenarioId).run();
  return c.json({ data: { deleted: true } });
});

// ========================
// COMPATIBILITY RULES
// ========================

// POST /admin/:id/compat — Add compatibility rule
composite.post("/admin/:id/compat", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const compositeId = c.req.param("id");
  const body = await c.req.json();
  const { component_id, option_id, incompatible_component_id, incompatible_option_id, message } = body;

  if (!component_id || !option_id || !incompatible_component_id || !incompatible_option_id) {
    return c.json({ error: { message: "All IDs are required for compatibility rule", code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();

  await db.prepare(
    "INSERT INTO composite_compat_rules (id, composite_id, component_id, option_id, incompatible_component_id, incompatible_option_id, message) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(id, compositeId, component_id, option_id, incompatible_component_id, incompatible_option_id, message || null).run();

  return c.json({ data: { id } }, 201);
});

// DELETE /admin/:id/compat/:ruleId — Remove compatibility rule
composite.delete("/admin/:id/compat/:ruleId", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const ruleId = c.req.param("ruleId");
  await db.prepare("DELETE FROM composite_compat_rules WHERE id = ?").bind(ruleId).run();
  return c.json({ data: { deleted: true } });
});

export default composite;
