import { describe, it, expect } from "vitest";
import app from "../../functions/api/test-helpers/app";

describe("Auth API", () => {
  it("should return 404 for auth routes not in test app", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password" }),
    });
    expect(res.status).toBe(404);
  });

  it("should return 404 for register route", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password", name: "Test" }),
    });
    expect(res.status).toBe(404);
  });

  it("should return 404 for refresh route", async () => {
    const res = await app.request("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: "test" }),
    });
    expect(res.status).toBe(404);
  });

  it("should return 404 for me route", async () => {
    const res = await app.request("/api/auth/me");
    expect(res.status).toBe(404);
  });
});
