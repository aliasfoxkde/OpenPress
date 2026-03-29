import { describe, it, expect } from "vitest";
import app from "../../functions/api/test-helpers/app";

describe("Health API", () => {
  it("should return ok status", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("openpress");
    expect(body.version).toBe("0.1.0");
    expect(body.timestamp).toBeDefined();
  });

  it("should include CORS headers", async () => {
    const res = await app.request("/api/health");
    expect(res.headers.get("access-control-allow-origin")).toBeDefined();
  });
});

describe("Site API", () => {
  it("should return site info", async () => {
    const res = await app.request("/api/site");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.name).toBeDefined();
    expect(body.data.version).toBe("0.1.0");
    expect(body.data.features).toBeDefined();
  });
});

describe("Content API (no DB)", () => {
  it("should return 503 when database not configured", async () => {
    const res = await app.request("/api/content");
    expect(res.status).toBe(503);
  });
});

describe("404 handling", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await app.request("/api/nonexistent");
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
