import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign, verify as jwtVerify } from "hono/jwt";
import type { Bindings, Variables } from "./types";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const JWT_SECRET = "openpress-secret-key-2026-change-me-in-production";
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 3600; // 7 days

// Password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === hash;
}

// Generate JWT access token
async function generateAccessToken(userId: string, email: string, role: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, email, role, iat: now, exp: now + ACCESS_TOKEN_EXPIRY },
    JWT_SECRET,
  );
}

// Generate refresh token
function generateRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// POST /register
auth.post("/register", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { email, password, name } = body;

  if (!email || !password) {
    return c.json({ error: { message: "Email and password required", code: "VALIDATION" } }, 400);
  }
  if (password.length < 8) {
    return c.json({ error: { message: "Password must be at least 8 characters", code: "VALIDATION" } }, 400);
  }

  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return c.json({ error: { message: "Email already registered", code: "DUPLICATE" } }, 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO users (id, email, name, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, email, name || email.split("@")[0], passwordHash, "admin", now, now)
    .run();

  const token = await generateAccessToken(id, email, "admin");
  const refreshToken = generateRefreshToken();
  const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), id, refreshToken, refreshExpiry, now)
    .run();

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/api",
    maxAge: REFRESH_TOKEN_EXPIRY / 1000,
  });

  return c.json(
    {
      data: {
        user: { id, email, name: name || email.split("@")[0], role: "admin" },
        access_token: token,
        expires_in: ACCESS_TOKEN_EXPIRY,
      },
    },
    201,
  );
});

// POST /login
auth.post("/login", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { email, password } = body;
  if (!email || !password) {
    return c.json({ error: { message: "Email and password required", code: "VALIDATION" } }, 400);
  }

  const user = await db
    .prepare("SELECT id, email, name, role, password_hash FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; email: string; name: string; role: string; password_hash: string }>();

  if (!user) {
    return c.json({ error: { message: "Invalid credentials", code: "INVALID_CREDENTIALS" } }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: { message: "Invalid credentials", code: "INVALID_CREDENTIALS" } }, 401);
  }

  const token = await generateAccessToken(user.id, user.email, user.role);
  const refreshToken = generateRefreshToken();
  const now = new Date().toISOString();
  const refreshExpiry = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, refresh_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), user.id, refreshToken, refreshExpiry, now)
    .run();

  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/api",
    maxAge: REFRESH_TOKEN_EXPIRY / 1000,
  });

  return c.json({
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      access_token: token,
      expires_in: ACCESS_TOKEN_EXPIRY,
    },
  });
});

// POST /refresh
auth.post("/refresh", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { refresh_token } = body;
  if (!refresh_token) {
    return c.json({ error: { message: "Refresh token required", code: "VALIDATION" } }, 400);
  }

  const session = await db
    .prepare(
      "SELECT s.user_id, s.expires_at, u.email, u.name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.refresh_token = ? AND s.expires_at > datetime('now')",
    )
    .bind(refresh_token)
    .first<{ user_id: string; expires_at: string; email: string; name: string; role: string }>();

  if (!session) {
    return c.json({ error: { message: "Invalid or expired refresh token", code: "INVALID_TOKEN" } }, 401);
  }

  const accessToken = await generateAccessToken(session.user_id, session.email, session.role);

  return c.json({
    data: {
      access_token: accessToken,
      expires_in: ACCESS_TOKEN_EXPIRY,
    },
  });
});

// GET /me - get current user
auth.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: { message: "Not authenticated", code: "UNAUTHORIZED" } }, 401);
  }
  return c.json({ data: user });
});

// Auth verification middleware
export const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Authorization required", code: "UNAUTHORIZED" } }, 401);
  }

  try {
    const payload = await jwtVerify({ alg: "HS256" }, authHeader.slice(7), JWT_SECRET);
    c.set("user", { id: payload.sub, email: payload.email, role: payload.role });
    return next();
  } catch {
    return c.json({ error: { message: "Invalid or expired token", code: "INVALID_TOKEN" } }, 401);
  }
};

export default auth;
