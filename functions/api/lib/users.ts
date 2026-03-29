import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { requireCapability, isValidRole } from "./security";
import { hashPassword, verifyPassword } from "./auth";

const users = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Password change — accessible to any authenticated user for their own account
users.put("/:id/password", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Authorization required", code: "UNAUTHORIZED" } }, 401);
  }

  const targetId = c.req.param("id");
  if (targetId !== user.id) {
    return c.json({ error: { message: "You can only change your own password", code: "FORBIDDEN" } }, 403);
  }

  const body = await c.req.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return c.json({ error: { message: "Current password and new password are required", code: "VALIDATION" } }, 400);
  }

  if (new_password.length < 8) {
    return c.json({ error: { message: "Password must be at least 8 characters", code: "VALIDATION" } }, 400);
  }

  const stored = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(targetId).first<{ password_hash: string }>();
  if (!stored) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  const valid = await verifyPassword(current_password, stored.password_hash);
  if (!valid) {
    return c.json({ error: { message: "Current password is incorrect", code: "VALIDATION" } }, 401);
  }

  const newHash = await hashPassword(new_password);
  const now = new Date().toISOString();
  await db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").bind(newHash, now, targetId).run();

  return c.json({ data: { updated: true } });
});

// All remaining user management routes require manage_users capability
users.use("*", requireCapability("manage_users"));

// GET / - List all users
users.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const search = c.req.query("search");

  const conditions: string[] = ["1=1"];
  const params: unknown[] = [];

  if (search && search.length <= 200) {
    conditions.push("(name LIKE ? OR email LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, email, name, role, avatar_url, created_at, updated_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, limit, offset)
      .all(),
    db.prepare(`SELECT COUNT(*) as total FROM users ${whereClause}`).bind(...params).first<{ total: number }>(),
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

// GET /:id - Get single user
users.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const user = await db
    .prepare("SELECT id, email, name, role, avatar_url, created_at, updated_at FROM users WHERE id = ?")
    .bind(id)
    .first();

  if (!user) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: user });
});

// PUT /:id/role - Update user role
users.put("/:id/role", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const currentUser = c.get("user");
  const body = await c.req.json();
  const { role } = body;

  if (!role || !isValidRole(role)) {
    return c.json({ error: { message: "Invalid role. Must be one of: admin, editor, author, contributor, subscriber, viewer", code: "VALIDATION" } }, 400);
  }

  // Prevent demoting yourself
  if (id === currentUser?.id) {
    return c.json({ error: { message: "Cannot change your own role", code: "VALIDATION" } }, 400);
  }

  const existing = await db.prepare("SELECT id FROM users WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  const now = new Date().toISOString();
  await db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").bind(role, now, id).run();

  return c.json({ data: { id, role, updated_at: now } });
});

// PUT /:id - Update user profile (name, avatar)
users.put("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const { name, avatar_url } = body;

  const ALLOWED_COLUMNS = ["name", "avatar_url"] as const;
  const updates: string[] = [];
  const params: unknown[] = [];

  for (const col of ALLOWED_COLUMNS) {
    if (body[col] !== undefined) {
      updates.push(`${col} = ?`);
      params.push(body[col]);
    }
  }

  if (updates.length === 0) {
    return c.json({ error: { message: "No valid fields to update", code: "VALIDATION" } }, 400);
  }

  updates.push("updated_at = ?");
  const now = new Date().toISOString();
  params.push(now);
  params.push(id);

  await db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

  return c.json({ data: { id, updated_at: now } });
});

// DELETE /:id - Delete user
users.delete("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const currentUser = c.get("user");

  // Prevent deleting yourself
  if (id === currentUser?.id) {
    return c.json({ error: { message: "Cannot delete your own account", code: "VALIDATION" } }, 400);
  }

  const existing = await db.prepare("SELECT id FROM users WHERE id = ?").bind(id).first();
  if (!existing) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  // Reassign content to current user before deleting
  await db.prepare("UPDATE content_items SET author_id = ? WHERE author_id = ?").bind(currentUser?.id || null, id).run();

  // Delete user sessions and user
  await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
  await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

export default users;
