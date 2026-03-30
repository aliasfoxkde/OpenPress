import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const navigation = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /admin/navigation - List all menu locations with their items
navigation.get("/admin/navigation", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const locations = await db.prepare("SELECT * FROM menu_locations ORDER BY name ASC").all();

  // Batch-fetch all items in a single query
  const allItems = await db
    .prepare("SELECT * FROM menu_items ORDER BY menu_id ASC, sort_order ASC")
    .all();

  // Group items by menu_id
  const itemsByMenu = new Map<string, unknown[]>();
  for (const item of allItems.results as Array<{ menu_id: string }>) {
    const list = itemsByMenu.get(item.menu_id) || [];
    list.push(item);
    itemsByMenu.set(item.menu_id, list);
  }

  const result = (locations.results as unknown as Record<string, unknown>[]).map((location) => ({
    ...location,
    items: itemsByMenu.get(location.id as string) || [],
  }));

  return c.json({ data: result });
});

// POST /admin/navigation/locations - Create a menu location
navigation.post("/admin/navigation/locations", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { name, description, max_depth } = body;
  if (!name) {
    return c.json({ error: { message: "Location name is required", code: "VALIDATION" } }, 400);
  }

  // Check for unique name
  const existing = await db.prepare("SELECT id FROM menu_locations WHERE name = ?").bind(name).first();
  if (existing) {
    return c.json({ error: { message: "A menu location with this name already exists", code: "CONFLICT" } }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO menu_locations (id, name, description, max_depth, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id, name, description || null, max_depth || 0, now)
    .run();

  return c.json({ data: { id, name, description: description || null, max_depth: max_depth || 0, created_at: now } }, 201);
});

// POST /admin/navigation/:location/items - Add a menu item to a location
navigation.post("/admin/navigation/:location/items", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const locationId = c.req.param("location");
  const location = await db.prepare("SELECT * FROM menu_locations WHERE id = ?").bind(locationId).first();
  if (!location) {
    return c.json({ error: { message: "Menu location not found", code: "NOT_FOUND" } }, 404);
  }

  const body = await c.req.json();
  const { title, url, type, reference_id, target, icon, css_class, rel, is_visible, roles, parent_id, sort_order } = body;
  if (!title) {
    return c.json({ error: { message: "Item title is required", code: "VALIDATION" } }, 400);
  }

  // Validate parent_id if provided
  if (parent_id) {
    const parent = await db.prepare("SELECT id, menu_id, depth FROM menu_items WHERE id = ?").bind(parent_id).first<{ id: string; menu_id: string; depth: number }>();
    if (!parent || parent.menu_id !== location.id) {
      return c.json({ error: { message: "Parent item not found in this menu", code: "NOT_FOUND" } }, 404);
    }
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Calculate depth from parent or default to 0
  let depth = 0;
  if (parent_id) {
    const parent = await db.prepare("SELECT depth FROM menu_items WHERE id = ?").bind(parent_id).first<{ depth: number }>();
    depth = (parent?.depth || 0) + 1;
  }

  await db
    .prepare(
      `INSERT INTO menu_items (id, menu_id, parent_id, title, url, type, reference_id, target, icon, css_class, rel, is_visible, roles, sort_order, depth, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      location.id,
      parent_id || null,
      title,
      url || null,
      type || "custom",
      reference_id || null,
      target || null,
      icon || null,
      css_class || null,
      rel || null,
      is_visible !== undefined ? (is_visible ? 1 : 0) : 1,
      roles || null,
      sort_order || 0,
      depth,
      now,
      now,
    )
    .run();

  return c.json({ data: { id, menu_id: location.id, parent_id: parent_id || null, title, url: url || null, type: type || "custom", depth, sort_order: sort_order || 0, created_at: now } }, 201);
});

// PUT /admin/navigation/:location/items/:id - Update a menu item
navigation.put("/admin/navigation/:location/items/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const locationId = c.req.param("location");
  const itemId = c.req.param("id");

  const location = await db.prepare("SELECT id FROM menu_locations WHERE id = ?").bind(locationId).first<{ id: string }>();
  if (!location) {
    return c.json({ error: { message: "Menu location not found", code: "NOT_FOUND" } }, 404);
  }

  const existing = await db.prepare("SELECT id FROM menu_items WHERE id = ? AND menu_id = ?").bind(itemId, location.id).first();
  if (!existing) {
    return c.json({ error: { message: "Menu item not found", code: "NOT_FOUND" } }, 404);
  }

  const body = await c.req.json();
  const fields: string[] = [];
  const values: unknown[] = [];

  const allowedFields = ["title", "url", "type", "reference_id", "target", "icon", "css_class", "rel", "is_visible", "roles", "parent_id"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      fields.push(`${field} = ?`);
      // Convert boolean is_visible to integer for SQLite
      if (field === "is_visible") {
        values.push(body[field] ? 1 : 0);
      } else {
        values.push(body[field]);
      }
    }
  }

  if (fields.length === 0) {
    return c.json({ error: { message: "No fields to update", code: "VALIDATION" } }, 400);
  }

  // Recalculate depth if parent_id changed
  if (body.parent_id !== undefined) {
    let depth = 0;
    if (body.parent_id) {
      const parent = await db.prepare("SELECT depth FROM menu_items WHERE id = ?").bind(body.parent_id).first<{ depth: number }>();
      depth = (parent?.depth || 0) + 1;
    }
    fields.push("depth = ?");
    values.push(depth);
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(itemId);

  await db
    .prepare(`UPDATE menu_items SET ${fields.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await db.prepare("SELECT * FROM menu_items WHERE id = ?").bind(itemId).first();
  return c.json({ data: updated });
});

// DELETE /admin/navigation/:location/items/:id - Remove a menu item (and children)
navigation.delete("/admin/navigation/:location/items/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const locationId = c.req.param("location");
  const itemId = c.req.param("id");

  const location = await db.prepare("SELECT id FROM menu_locations WHERE id = ?").bind(locationId).first<{ id: string }>();
  if (!location) {
    return c.json({ error: { message: "Menu location not found", code: "NOT_FOUND" } }, 404);
  }

  const existing = await db.prepare("SELECT id FROM menu_items WHERE id = ? AND menu_id = ?").bind(itemId, location.id).first();
  if (!existing) {
    return c.json({ error: { message: "Menu item not found", code: "NOT_FOUND" } }, 404);
  }

  // Delete children recursively (SQLite cascade would handle this with FK ON DELETE CASCADE,
  // but we do it manually for safety in case FK constraints aren't set)
  async function deleteChildren(parentId: string) {
    const children = await db.prepare("SELECT id FROM menu_items WHERE parent_id = ?").bind(parentId).all<{ id: string }>();
    for (const child of children.results) {
      await deleteChildren(child.id);
    }
    await db.prepare("DELETE FROM menu_items WHERE id = ?").bind(parentId).run();
  }

  await deleteChildren(itemId);

  return c.json({ data: { deleted: true } });
});

// PUT /admin/navigation/:location/reorder - Reorder items
navigation.put("/admin/navigation/:location/reorder", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const locationId = c.req.param("location");
  const body = await c.req.json();
  const { items } = body;

  if (!Array.isArray(items)) {
    return c.json({ error: { message: "items array is required", code: "VALIDATION" } }, 400);
  }

  const location = await db.prepare("SELECT id FROM menu_locations WHERE id = ?").bind(locationId).first<{ id: string }>();
  if (!location) {
    return c.json({ error: { message: "Menu location not found", code: "NOT_FOUND" } }, 404);
  }

  const now = new Date().toISOString();

  // Update each item's sort_order, parent_id, and depth
  for (const item of items as Array<{ id: string; sort_order: number; parent_id: string | null; depth: number }>) {
    if (!item.id) continue;

    let depth = item.depth || 0;
    // Recalculate depth if parent_id is provided
    if (item.parent_id) {
      const parent = await db.prepare("SELECT depth FROM menu_items WHERE id = ? AND menu_id = ?").bind(item.parent_id, location.id).first<{ depth: number }>();
      depth = (parent?.depth || 0) + 1;
    }

    await db
      .prepare("UPDATE menu_items SET sort_order = ?, parent_id = ?, depth = ?, updated_at = ? WHERE id = ? AND menu_id = ?")
      .bind(item.sort_order || 0, item.parent_id || null, depth, now, item.id, location.id)
      .run();
  }

  return c.json({ data: { reordered: true, count: items.length } });
});

// DELETE /admin/navigation/locations/:id - Delete a menu location and all its items
navigation.delete("/admin/navigation/locations/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  const existing = await db.prepare("SELECT id FROM menu_locations WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "Menu location not found", code: "NOT_FOUND" } }, 404);
  }

  // Delete all items for this location (cascade handles children via FK)
  await db.prepare("DELETE FROM menu_items WHERE menu_id = ?").bind(id).run();
  await db.prepare("DELETE FROM menu_locations WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

// GET /navigation/:location - PUBLIC: Render menu tree for a location (only visible items)
navigation.get("/:location", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const locationName = c.req.param("location");

  const location = await db.prepare("SELECT * FROM menu_locations WHERE name = ?").bind(locationName).first();
  if (!location) {
    return c.json({ error: { message: "Menu location not found", code: "NOT_FOUND" } }, 404);
  }

  // Fetch only visible items, ordered by sort_order
  const items = await db
    .prepare(
      "SELECT id, parent_id, title, url, type, reference_id, target, icon, css_class, rel, roles, sort_order, depth FROM menu_items WHERE menu_id = ? AND is_visible = 1 ORDER BY sort_order ASC",
    )
    .bind(location.id)
    .all();

  const flatItems = items.results as Array<{
    id: string;
    parent_id: string | null;
    title: string;
    url: string | null;
    type: string;
    reference_id: string | null;
    target: string | null;
    icon: string | null;
    css_class: string | null;
    rel: string | null;
    roles: string | null;
    sort_order: number;
    depth: number;
  }>;

  // Build tree from flat list using parent_id
  const itemMap = new Map<string, Record<string, unknown> & { children: Record<string, unknown>[] }>();
  const roots: Record<string, unknown>[] = [];

  // First pass: create map entries
  for (const item of flatItems) {
    itemMap.set(item.id, { ...item, children: [] });
  }

  // Second pass: build tree structure
  for (const item of flatItems) {
    const node = itemMap.get(item.id)!;
    if (item.parent_id && itemMap.has(item.parent_id)) {
      itemMap.get(item.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return c.json({
    data: {
      location: { id: location.id, name: location.name, description: (location as Record<string, unknown>).description },
      items: roots,
    },
  });
});

export default navigation;
