import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { sign, verify as jwtVerify } from "hono/jwt";
import type { Bindings, Variables } from "./types";

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// JWT secret - in production, set via `wrangler secret put JWT_SECRET`
function getJwtSecret(c: any): string {
  return c.env?.JWT_SECRET || "openpress-secret-key-2026-change-me-in-production";
}

const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 3600; // 7 days

// Password hashing using PBKDF2 (100k iterations, SHA-256)
const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16; // 128-bit salt

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const hashBytes = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Support legacy SHA-256 hashes for migration
  if (!storedHash.startsWith("pbkdf2:")) {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
    const computedHash = Array.from(new Uint8Array(hashBuffer), (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    return computedHash === storedHash;
  }

  const [, , saltHex, expectedHashHex] = storedHash.split(":");
  const salt = Uint8Array.from({ length: saltHex!.length / 2 }, (_, i) =>
    parseInt(saltHex!.substring(i * 2, i * 2 + 2), 16),
  );
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256,
  );
  const computedHashHex = Array.from(new Uint8Array(derivedBits), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
  return computedHashHex === expectedHashHex;
}

// Generate JWT access token
async function generateAccessToken(
  userId: string,
  email: string,
  role: string,
  secret: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await sign(
    { alg: "HS256", typ: "JWT" },
    { sub: userId, email, role, iat: now, exp: now + ACCESS_TOKEN_EXPIRY },
    secret,
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
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 254) {
    return c.json({ error: { message: "Invalid email format", code: "VALIDATION" } }, 400);
  }
  // Password strength: min 8 chars, at least one uppercase, one lowercase, one number
  if (password.length < 8 || password.length > 128) {
    return c.json({ error: { message: "Password must be between 8 and 128 characters", code: "VALIDATION" } }, 400);
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return c.json({ error: { message: "Password must contain uppercase, lowercase, and a number", code: "VALIDATION" } }, 400);
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
    .bind(id, email, name || email.split("@")[0], passwordHash, "subscriber", now, now)
    .run();

  const token = await generateAccessToken(id, email, "subscriber", getJwtSecret(c));
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

  // Generate CSRF token for double-submit cookie pattern
  const csrfToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
  setCookie(c, "csrf_token", csrfToken, {
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  return c.json(
    {
      data: {
        user: { id, email, name: name || email.split("@")[0], role: "subscriber" },
        access_token: token,
        expires_in: ACCESS_TOKEN_EXPIRY,
        csrf_token: csrfToken,
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

  const token = await generateAccessToken(user.id, user.email, user.role, getJwtSecret(c));
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

  // Generate CSRF token for double-submit cookie pattern
  const csrfToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
  setCookie(c, "csrf_token", csrfToken, {
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  return c.json({
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      access_token: token,
      expires_in: ACCESS_TOKEN_EXPIRY,
      csrf_token: csrfToken,
    },
  });
});

// POST /refresh
auth.post("/refresh", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  // Read refresh token from httpOnly cookie first, then fall back to request body
  let refreshToken = "";
  const cookieHeader = c.req.header("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    if (match) refreshToken = match[1];
  }
  if (!refreshToken) {
    try {
      const body = await c.req.json();
      refreshToken = body.refresh_token || "";
    } catch {
      // body may not be JSON
    }
  }
  if (!refreshToken) {
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

  const accessToken = await generateAccessToken(session.user_id, session.email, session.role, getJwtSecret(c));

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

// POST /forgot-password - initiate password reset
auth.post("/forgot-password", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const { email } = await c.req.json<{ email: string }>();
  if (!email) {
    return c.json({ error: { message: "Email is required", code: "VALIDATION_ERROR" } }, 400);
  }

  const user = await db.prepare("SELECT id, name FROM users WHERE email = ?").bind(email).first<{ id: string; name: string }>();
  if (!user) {
    // Don't reveal whether email exists - return success regardless
    return c.json({ message: "If an account with that email exists, a password reset link has been sent." });
  }

  // Generate a reset token (valid for 1 hour)
  const resetToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 3600_000).toISOString();
  await db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?")
    .bind(resetToken, expiresAt, user.id)
    .run();

  return c.json({ message: "If an account with that email exists, a password reset link has been sent." });
});

// POST /reset-password - reset password with token
auth.post("/reset-password", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const { token, password } = await c.req.json<{ token: string; password: string }>();
  if (!token || !password) {
    return c.json({ error: { message: "Token and password are required", code: "VALIDATION_ERROR" } }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return c.json({ error: { message: "Password must be between 8 and 128 characters", code: "VALIDATION_ERROR" } }, 400);
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return c.json({ error: { message: "Password must contain uppercase, lowercase, and a number", code: "VALIDATION_ERROR" } }, 400);
  }

  const user = await db.prepare("SELECT id, reset_token_expires FROM users WHERE reset_token = ?").bind(token).first<{ id: string; reset_token_expires: string }>();
  if (!user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
    return c.json({ error: { message: "Invalid or expired reset token", code: "INVALID_TOKEN" } }, 400);
  }

  const hash = await hashPassword(password);
  await db.prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?")
    .bind(hash, user.id)
    .run();

  return c.json({ message: "Password has been reset successfully." });
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
