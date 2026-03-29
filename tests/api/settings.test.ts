import { describe, it, expect } from "vitest";
import app from "../../functions/api/test-helpers/app";

describe("Settings API", () => {
  it("should return 404 for settings route (not in test app)", async () => {
    const res = await app.request("/api/settings");
    expect(res.status).toBe(404);
  });

  it("should return 404 for PUT settings", async () => {
    const res = await app.request("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_name: "Test" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("Media API", () => {
  it("should return 404 for media listing (not in test app)", async () => {
    const res = await app.request("/api/media");
    expect(res.status).toBe(404);
  });

  it("should return 404 for media upload", async () => {
    const res = await app.request("/api/media", { method: "POST" });
    expect(res.status).toBe(404);
  });
});

describe("Taxonomies API", () => {
  it("should return 404 for taxonomies listing (not in test app)", async () => {
    const res = await app.request("/api/taxonomies");
    expect(res.status).toBe(404);
  });
});

describe("Content Detail API", () => {
  it("should return 404 for nonexistent content slug", async () => {
    const res = await app.request("/api/content/nonexistent-slug-xyz");
    expect(res.status).toBe(404);
  });
});
