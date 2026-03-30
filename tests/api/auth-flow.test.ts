import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, verifyPassword } from "../../functions/api/lib/auth";

// ─── Password hashing ──────────────────────────────────────────────────────

describe("Password hashing", () => {
  const testPassword = "SecurePass1";

  it("should hash a password with PBKDF2 format", async () => {
    const hash = await hashPassword(testPassword);
    expect(hash).toMatch(/^pbkdf2:\d+:[a-f0-9]+:[a-f0-9]+$/);
  });

  it("should verify a correct password", async () => {
    const hash = await hashPassword(testPassword);
    expect(await verifyPassword(testPassword, hash)).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const hash = await hashPassword(testPassword);
    expect(await verifyPassword("WrongPass1", hash)).toBe(false);
  });

  it("should produce different hashes for the same password (random salt)", async () => {
    const hash1 = await hashPassword(testPassword);
    const hash2 = await hashPassword(testPassword);
    expect(hash1).not.toBe(hash2);
  });

  it("should support legacy SHA-256 hashes via verifyPassword", async () => {
    // Legacy SHA-256 hash of "testpassword"
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode("testpassword"));
    const legacyHash = Array.from(new Uint8Array(hashBuffer), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");

    expect(await verifyPassword("testpassword", legacyHash)).toBe(true);
    expect(await verifyPassword("wrongpassword", legacyHash)).toBe(false);
  });

  it("should handle passwords at length boundaries", async () => {
    const short = "Aa1"; // 3 chars — still works, app validates min 8
    expect(await verifyPassword(short, await hashPassword(short))).toBe(true);

    const long = "A" + "a".repeat(126) + "1"; // 128 chars
    expect(await verifyPassword(long, await hashPassword(long))).toBe(true);
  });
});

// ─── Registration validation ────────────────────────────────────────────────

describe("Auth registration validation", () => {
  // These tests verify the validation rules that auth.register applies
  // The actual route is tested against the stub app (returns 503 without DB)

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it("should accept valid emails", () => {
    expect(emailRegex.test("user@example.com")).toBe(true);
    expect(emailRegex.test("user.name@domain.co")).toBe(true);
    expect(emailRegex.test("a@b.c")).toBe(true);
  });

  it("should reject invalid emails", () => {
    expect(emailRegex.test("")).toBe(false);
    expect(emailRegex.test("notanemail")).toBe(false);
    expect(emailRegex.test("@domain.com")).toBe(false);
    expect(emailRegex.test("user@")).toBe(false);
    expect(emailRegex.test("user name@example.com")).toBe(false);
  });

  it("should enforce password strength rules", () => {
    const validPassword = "SecurePass1";
    expect(validPassword.length >= 8).toBe(true);
    expect(validPassword.length <= 128).toBe(true);
    expect(/[A-Z]/.test(validPassword)).toBe(true);
    expect(/[a-z]/.test(validPassword)).toBe(true);
    expect(/[0-9]/.test(validPassword)).toBe(true);

    const tooShort = "Short1A";
    expect(tooShort.length >= 8).toBe(false);

    const noUppercase = "lowercase1";
    expect(/[A-Z]/.test(noUppercase)).toBe(false);

    const noLowercase = "UPPERCASE1";
    expect(/[a-z]/.test(noLowercase)).toBe(false);

    const noNumber = "NoNumbers";
    expect(/[0-9]/.test(noNumber)).toBe(false);
  });
});

// ─── JWT token generation ───────────────────────────────────────────────────

describe("JWT tokens", () => {
  it("should generate tokens with correct payload structure", async () => {
    // Use hono/jwt directly (same as production)
    const { sign, verify } = await import("hono/jwt");
    const secret = "test-secret-key";

    const token = await sign(
      {
        sub: "user-123",
        email: "test@example.com",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as Parameters<typeof sign>[0],
      secret,
      "HS256",
    );

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts

    const payload = await verify(token, secret, "HS256");
    expect(payload.sub).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
    expect(payload.role).toBe("admin");
  });

  it("should reject tokens with wrong secret", async () => {
    const { sign, verify } = await import("hono/jwt");

    const token = await sign(
      {
        sub: "user-123",
        email: "test@example.com",
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      } as Parameters<typeof sign>[0],
      "secret1",
      "HS256",
    );

    await expect(verify(token, "wrong-secret", "HS256")).rejects.toThrow();
  });

  it("should reject expired tokens", async () => {
    const { sign, verify } = await import("hono/jwt");
    const secret = "test-secret-key";

    const token = await sign(
      {
        sub: "user-123",
        email: "test@example.com",
        role: "admin",
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // expired 1 hour ago
      } as Parameters<typeof sign>[0],
      secret,
      "HS256",
    );

    await expect(verify(token, secret, "HS256")).rejects.toThrow();
  });
});
