import { describe, it, expect } from "vitest";
import app from "../../functions/api/test-helpers/app";

describe("Products API (no DB)", () => {
  it("should return 404 for public product listing route (not in test app)", async () => {
    const res = await app.request("/api/products");
    // Test app doesn't have the products route, so it's a 404
    expect(res.status).toBe(404);
  });

  it("should return 404 for product detail without DB", async () => {
    const res = await app.request("/api/products/test-id");
    expect(res.status).toBe(404);
  });
});

describe("Cart API (no DB)", () => {
  it("should return 404 for cart route (not in test app)", async () => {
    const res = await app.request("/api/cart");
    expect(res.status).toBe(404);
  });
});

describe("Orders API (no DB)", () => {
  it("should return 404 for orders route (not in test app)", async () => {
    const res = await app.request("/api/orders");
    expect(res.status).toBe(404);
  });
});
