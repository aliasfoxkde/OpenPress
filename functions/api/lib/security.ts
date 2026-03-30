import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

/**
 * Security headers middleware.
 * Adds standard security headers to all responses.
 */
export function securityHeaders() {
  return async (_c: any, next: any) => {
    await next();
    _c.header("X-Content-Type-Options", "nosniff");
    _c.header("X-Frame-Options", "DENY");
    _c.header("X-XSS-Protection", "0");
    _c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    _c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    _c.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
    );
  };
}

/**
 * Rate limiting middleware using KV.
 * Tracks request counts per IP with configurable window.
 */
export function rateLimit(options: { windowMs?: number; maxRequests?: number; keyPrefix?: string } = {}) {
  const windowMs = options.windowMs || 60_000; // 1 minute
  const maxRequests = options.maxRequests || 100;
  const keyPrefix = options.keyPrefix || "rl:";

  return async (c: any, next: any) => {
    const cache = c.env?.CACHE as KVNamespace | undefined;
    if (!cache) {
      // No KV = no rate limiting, allow through
      return next();
    }

    const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
    const key = `${keyPrefix}${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const raw = await cache.get(key);
      const requests: number[] = raw ? JSON.parse(raw) : [];

      // Filter to only requests within the window
      const recent = requests.filter((t) => t > windowStart);

      if (recent.length >= maxRequests) {
        return c.json(
          { error: { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" } },
          429,
          {
            "Retry-After": String(Math.ceil((recent[0]! + windowMs - now) / 1000)),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
          },
        );
      }

      // Record this request
      recent.push(now);
      await cache.put(key, JSON.stringify(recent), { expirationTtl: Math.ceil(windowMs / 1000) + 1 });

      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", String(maxRequests - recent.length));
    } catch {
      // KV error = allow through
    }

    return next();
  };
}

/**
 * Stricter rate limit for auth endpoints.
 */
export function authRateLimit() {
  return rateLimit({ windowMs: 15 * 60_000, maxRequests: 10, keyPrefix: "auth-rl:" });
}

/**
 * CORS configuration with origin restriction.
 */
export function corsConfig() {
  return async (c: any, next: any) => {
    const origin = c.req.header("Origin") || "";
    const allowedOrigins = [
      "https://openpress.pages.dev",
      "http://localhost:5173",
      "http://localhost:8788",
    ];

    // Allow any *.pages.dev subdomain for preview deployments
    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith(".openpress.pages.dev") ||
      origin.endsWith(".pages.dev");

    if (isAllowed && origin) {
      c.header("Access-Control-Allow-Origin", origin);
    }
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-Id, X-Csrf-Token");
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Max-Age", "86400");

    if (c.req.method === "OPTIONS") {
      return c.text("", 204);
    }

    return next();
  };
}

/**
 * Input sanitization helpers.
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
];

export const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 255);
}

export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }
  return { valid: true };
}

/**
 * Allowed status values for content items.
 */
export const ALLOWED_CONTENT_STATUSES = ["draft", "published", "scheduled", "trash", "archived", "pending"] as const;
export const ALLOWED_CONTENT_TYPES = ["post", "page", "product"] as const;
export const ALLOWED_PRODUCT_STATUSES = ["draft", "active", "archived"] as const;

export function isValidStatus(status: string): boolean {
  return (ALLOWED_CONTENT_STATUSES as readonly string[]).includes(status);
}

export function isValidContentType(type: string): boolean {
  return (ALLOWED_CONTENT_TYPES as readonly string[]).includes(type);
}

export function isValidProductStatus(status: string): boolean {
  return (ALLOWED_PRODUCT_STATUSES as readonly string[]).includes(status);
}

// ─── RBAC Capability System ──────────────────────────────────────────────────

export type Role = "admin" | "editor" | "author" | "contributor" | "subscriber" | "viewer";

export type Capability =
  | "publish_any"
  | "edit_any"
  | "delete_any"
  | "manage_media"
  | "manage_taxonomies"
  | "manage_settings"
  | "manage_users"
  | "manage_plugins"
  | "manage_products"
  | "manage_orders"
  | "manage_comments"
  | "use_ai"
  | "publish_own"
  | "edit_own"
  | "delete_own"
  | "upload_media"
  | "submit_draft"
  | "read";

/**
 * WordPress-style capability map.
 * Each role inherits capabilities from roles below it.
 */
const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  admin: [
    "publish_any", "edit_any", "delete_any",
    "manage_media", "manage_taxonomies", "manage_settings",
    "manage_users", "manage_plugins", "manage_products",
    "manage_orders", "manage_comments", "use_ai",
    "publish_own", "edit_own", "delete_own",
    "upload_media", "submit_draft", "read",
  ],
  editor: [
    "publish_any", "edit_any", "delete_any",
    "manage_media", "manage_taxonomies",
    "manage_products", "manage_orders", "manage_comments", "use_ai",
    "publish_own", "edit_own", "delete_own",
    "upload_media", "submit_draft", "read",
  ],
  author: [
    "publish_own", "edit_own", "delete_own",
    "upload_media", "use_ai",
    "submit_draft", "read",
  ],
  contributor: [
    "submit_draft", "edit_own",
    "upload_media", "read",
  ],
  subscriber: [
    "read",
  ],
  viewer: [
    "read",
  ],
};

/**
 * Check if a role has a specific capability.
 */
export function hasCapability(role: string, cap: Capability): boolean {
  const caps = ROLE_CAPABILITIES[role as Role];
  if (!caps) return false;
  return caps.includes(cap);
}

/**
 * Hono middleware that requires a specific capability.
 * Must be used AFTER auth middleware (requires c.get("user")).
 */
export function requireCapability(cap: Capability) {
  return async (c: any, next: any) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Authorization required", code: "UNAUTHORIZED" } }, 401);
    }

    if (!hasCapability(user.role, cap)) {
      return c.json({ error: { message: "Insufficient permissions", code: "FORBIDDEN" } }, 403);
    }

    return next();
  };
}

/**
 * Hono middleware that checks ownership for "own" capabilities.
 * If user has the "any" variant, allow regardless of ownership.
 * Otherwise, verify the user owns the resource.
 */
export function requireOwnership(capAny: Capability, capOwn: Capability, getOwnerId: (c: any) => Promise<string | null>) {
  return async (c: any, next: any) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: { message: "Authorization required", code: "UNAUTHORIZED" } }, 401);
    }

    // Admins/editors with "any" capability bypass ownership check
    if (hasCapability(user.role, capAny)) {
      return next();
    }

    // Check if user has "own" capability
    if (!hasCapability(user.role, capOwn)) {
      return c.json({ error: { message: "Insufficient permissions", code: "FORBIDDEN" } }, 403);
    }

    // Verify ownership
    const ownerId = await getOwnerId(c);
    if (ownerId !== user.id) {
      return c.json({ error: { message: "You can only modify your own content", code: "FORBIDDEN" } }, 403);
    }

    return next();
  };
}

export const VALID_ROLES: Role[] = ["admin", "editor", "author", "contributor", "subscriber", "viewer"];

export function isValidRole(role: string): boolean {
  return VALID_ROLES.includes(role as Role);
}

// ─── CSRF Protection ───────────────────────────────────────────────────────

/**
 * Timing-safe string comparison using Web Crypto API.
 * Prevents timing attacks on token/signature verification.
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(a), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  try {
    await crypto.subtle.sign("HMAC", key, encoder.encode(b));
    return true;
  } catch {
    return false;
  }
}

/**
 * CSRF protection middleware using double-submit cookie pattern.
 * Generates a CSRF token, sets it as a cookie, and requires a matching
 * x-csrf-token header on state-changing requests.
 */
export function csrfProtection() {
  return async (c: any, next: any) => {
    const method = c.req.method;
    // Safe methods don't need CSRF check
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next();
    }

    const csrfCookie = c.req.header("Cookie")
      ?.split("; ")
      .find((row: string) => row.startsWith("csrf_token="))
      ?.split("=")[1];

    const csrfHeader = c.req.header("x-csrf-token");

    if (!csrfCookie || !csrfHeader) {
      return c.json({ error: { message: "CSRF token missing", code: "CSRF_MISSING" } }, 403);
    }

    const equal = await timingSafeEqual(csrfCookie, csrfHeader);
    if (!equal) {
      return c.json({ error: { message: "CSRF token mismatch", code: "CSRF_INVALID" } }, 403);
    }

    return next();
  };
}

/**
 * Request body size limit middleware.
 * Rejects requests where Content-Length exceeds the specified limit.
 */
export function bodySizeLimit(maxBytes: number) {
  return async (c: any, next: any) => {
    const contentLength = parseInt(c.req.header("Content-Length") || "0", 10);
    if (contentLength > maxBytes) {
      return c.json(
        { error: { message: `Request body too large (max ${Math.round(maxBytes / 1024)}KB)`, code: "PAYLOAD_TOO_LARGE" } },
        413,
      );
    }
    return next();
  };
}

// ─── Cache Purge ───────────────────────────────────────────────────────────

/**
 * Purge specific KV cache keys by prefix.
 * Used after content/settings/product mutations to keep cache fresh.
 */
export async function purgeCache(cache: KVNamespace, prefixes: string[]): Promise<void> {
  const keys = await cache.list({ prefix: prefixes[0] });
  if (prefixes.length > 1) {
    for (const p of prefixes.slice(1)) {
      const more = await cache.list({ prefix: p });
      keys.keys.push(...more.keys);
    }
  }
  await Promise.all(keys.keys.map((k) => cache.delete(k.name)));
}

/**
 * Middleware that purges KV cache after successful state-changing requests
 * to content, settings, or products.
 */
export function cachePurgeOnMutation() {
  return async (c: any, next: any) => {
    await next();

    // Only purge on successful mutations
    const method = c.req.method;
    if (method !== "POST" && method !== "PUT" && method !== "DELETE") return;
    if (c.res.status >= 400) return;

    const cache = c.env.CACHE as KVNamespace | undefined;
    if (!cache) return;

    const path = c.req.path;

    // Fire-and-forget cache purge
    const purgePromise = (async () => {
      try {
        if (path.includes("/content")) {
          // Purge content list cache and the specific slug if available
          await purgeCache(cache, ["content:list:"]);
          const slug = path.split("/").pop();
          if (slug && slug.length > 0) {
            await cache.delete(`content:${slug}`);
          }
        } else if (path.includes("/settings")) {
          await purgeCache(cache, ["settings:"]);
        } else if (path.includes("/products")) {
          const slug = path.split("/").pop();
          if (slug && slug.length > 0) {
            await cache.delete(`product:${slug}`);
          }
        }
      } catch {
        // Cache purge failure should not affect the response
      }
    })();

    // Wait for purge to complete before response (Cloudflare edge needs this)
    c.executionCtx?.waitUntil(purgePromise);
  };
}
