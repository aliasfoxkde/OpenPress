// Fail-closed JWT_SECRET contract (2026-10-04 security fix).
//
// Before this fix both token-issuing and token-verifying code fell back to a
// hardcoded secret committed to the repo ("openpress-secret-key-2026-…"), and
// production ran with NO JWT_SECRET configured — so every access token in
// production was signed with a public string and could be forged by anyone.
// These tests pin the replacement behavior:
//
//   - Issuing routes (register / demo-login / login / refresh) return 503
//     AUTH_NOT_CONFIGURED instead of signing with a fallback secret.
//   - Token verification rejects EVERY token — including one forged with the
//     old public fallback secret — when JWT_SECRET is unset, and still
//     rejects fallback-forged tokens when a real secret is configured.
//
// Run with: pnpm test
import { describe, it, expect } from "vitest";
import { SignJWT } from "jose";

// The real Pages entrypoint (the [[route]] catch-all with the inline auth
// middleware), exercised through onRequest like the runtime would.
import { onRequest } from "../../functions/api/[[route]].ts";
import { hashPassword } from "../../functions/api/lib/auth";

/** The secret that used to be the hardcoded fallback — now attacker-known. */
const OLD_PUBLIC_FALLBACK = "openpress-secret-key-2026-change-me-in-production";

/** Minimal D1 stub: every SELECT returns `firstRow`, every write succeeds. */
function mockD1(firstRow: unknown = null) {
  const bound = () => ({
    first: async () => firstRow,
    run: async () => ({ success: true }),
    all: async () => ({ results: [] }),
  });
  return {
    prepare: (_sql: string) => ({ bind: bound, first: bound().first, all: bound().all, run: bound().run }),
  };
}

const CACHE_KV = { get: async () => null, put: async () => {}, delete: async () => {} };

function call(
  path: string,
  env: Record<string, unknown>,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
) {
  const request = new Request(`https://openpress.pages.dev${path}`, {
    method: init.method ?? "GET",
    headers: init.headers ?? {},
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  return onRequest({ request, env, params: {} } as never);
}

async function signToken(payload: Record<string, unknown>, secret: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

describe("JWT fail-closed (no hardcoded fallback secret)", () => {
  it("register returns 503 AUTH_NOT_CONFIGURED and issues no token when JWT_SECRET is unset", async () => {
    const res = await call(
      "/api/auth/register",
      { DB: mockD1(null), CACHE: CACHE_KV }, // no JWT_SECRET — production state as of 2026-10-04
      {
        method: "POST",
        body: { email: "reader@example.com", password: "Str0ngPass", name: "Reader" },
      },
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe("AUTH_NOT_CONFIGURED");
    expect(body.error.message).not.toContain("token");
    expect(body.data?.access_token).toBeUndefined();
  });

  it("demo-login returns 503 AUTH_NOT_CONFIGURED after credential verification when JWT_SECRET is unset", async () => {
    const demoUser = {
      id: "demo-user-id",
      email: "demo@openpress.dev",
      name: "Demo",
      role: "admin",
      password_hash: await hashPassword("Demo1234"),
    };
    const res = await call(
      "/api/auth/demo-login",
      { DB: mockD1(demoUser), CACHE: CACHE_KV },
      { method: "POST" },
    );
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error.code).toBe("AUTH_NOT_CONFIGURED");
    expect(body.data?.access_token).toBeUndefined();
  });

  it("a token forged with the old public fallback is rejected when JWT_SECRET is unset", async () => {
    // Exactly what an attacker could do against the pre-fix production deploy.
    const forged = await signToken(
      { sub: "attacker", email: "attacker@example.com", role: "admin" },
      OLD_PUBLIC_FALLBACK,
    );
    const res = await call(
      "/api/stats",
      { DB: mockD1(), CACHE: CACHE_KV }, // no JWT_SECRET
      { headers: { Authorization: `Bearer ${forged}` } },
    );
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("INVALID_TOKEN");
  });

  it("a token forged with the old public fallback is still rejected when a real secret is configured", async () => {
    const forged = await signToken(
      { sub: "attacker", email: "attacker@example.com", role: "admin" },
      OLD_PUBLIC_FALLBACK,
    );
    const res = await call(
      "/api/stats",
      { DB: mockD1(), CACHE: CACHE_KV, JWT_SECRET: "real-secret-set-via-dashboard" },
      { headers: { Authorization: `Bearer ${forged}` } },
    );
    expect(res.status).toBe(401);
  });

  it("a token signed with the configured secret passes the verification middleware", async () => {
    const secret = "real-secret-set-via-dashboard";
    const token = await signToken(
      { sub: "user-1", email: "user@example.com", role: "admin" },
      secret,
    );
    const res = await call(
      "/api/stats",
      { DB: mockD1(), CACHE: CACHE_KV, JWT_SECRET: secret },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    // The middleware passed if we got anything but an auth rejection — the
    // content handler's own response depends on the D1 stub, not on auth.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(503);
  });
});
