import { describe, it, expect } from "vitest";
import app from "../../functions/api/test-helpers/app";

describe("AI API", () => {
  it("should return 404 for nonexistent AI route", async () => {
    const res = await app.request("/api/ai/nonexistent");
    expect(res.status).toBe(404);
  });
});
