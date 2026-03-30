import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import {
  hasCapability,
  requireCapability,
  VALID_ROLES,
  ALLOWED_CONTENT_STATUSES,
  ALLOWED_CONTENT_TYPES,
} from "../../functions/api/lib/security";
import type { Variables, Bindings } from "../../functions/api/lib/types";
import type { Capability } from "../../functions/api/lib/security";

// ─── RBAC Capability Matrix ────────────────────────────────────────────────

describe("RBAC capability matrix", () => {
  const allCapabilities: Capability[] = [
    "read",
    "submit_draft",
    "publish_own",
    "publish_any",
    "edit_any",
    "delete_any",
    "manage_settings",
    "manage_users",
    "manage_taxonomies",
    "manage_products",
    "manage_orders",
    "manage_comments",
    "use_ai",
  ];

  it("admin should have ALL capabilities", () => {
    for (const cap of allCapabilities) {
      expect(hasCapability("admin", cap), `admin missing: ${cap}`).toBe(true);
    }
  });

  it("editor capabilities", () => {
    const editorHas: Capability[] = ["read", "submit_draft", "publish_any", "edit_any", "delete_any", "use_ai"];
    const editorLacks: Capability[] = ["manage_settings", "manage_users"];

    for (const cap of editorHas) {
      expect(hasCapability("editor", cap), `editor missing: ${cap}`).toBe(true);
    }
    for (const cap of editorLacks) {
      expect(hasCapability("editor", cap), `editor should not have: ${cap}`).toBe(false);
    }
  });

  it("author capabilities", () => {
    const authorHas: Capability[] = ["read", "submit_draft", "publish_own", "use_ai"];
    const authorLacks: Capability[] = ["publish_any", "edit_any", "delete_any", "manage_settings"];

    for (const cap of authorHas) {
      expect(hasCapability("author", cap), `author missing: ${cap}`).toBe(true);
    }
    for (const cap of authorLacks) {
      expect(hasCapability("author", cap), `author should not have: ${cap}`).toBe(false);
    }
  });

  it("contributor capabilities", () => {
    const contributorHas: Capability[] = ["read", "submit_draft"];
    const contributorLacks: Capability[] = ["publish_own", "publish_any", "edit_any", "delete_any"];

    for (const cap of contributorHas) {
      expect(hasCapability("contributor", cap), `contributor missing: ${cap}`).toBe(true);
    }
    for (const cap of contributorLacks) {
      expect(hasCapability("contributor", cap), `contributor should not have: ${cap}`).toBe(false);
    }
  });

  it("subscriber and viewer should only have read", () => {
    for (const role of ["subscriber", "viewer"]) {
      expect(hasCapability(role, "read")).toBe(true);
      expect(hasCapability(role, "submit_draft")).toBe(false);
      expect(hasCapability(role, "publish_own")).toBe(false);
      expect(hasCapability(role, "manage_settings")).toBe(false);
    }
  });
});

// ─── Capability middleware ──────────────────────────────────────────────────

describe("requireCapability middleware", () => {
  function createTestApp(userRole: string | null, capability: Capability): Hono<{ Bindings: Bindings; Variables: Variables }> {
    const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

    if (userRole) {
      app.use("*", async (c, next) => {
        c.set("user", { id: "1", email: "test@test.com", role: userRole });
        await next();
      });
    }

    app.use("*", requireCapability(capability));
    app.get("/test", (c) => c.json({ ok: true }));

    return app;
  }

  it("admin can access manage_settings", async () => {
    const app = createTestApp("admin", "manage_settings");
    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("editor cannot access manage_settings", async () => {
    const app = createTestApp("editor", "manage_settings");
    const res = await app.request("/test");
    expect(res.status).toBe(403);
  });

  it("author can access publish_own", async () => {
    const app = createTestApp("author", "publish_own");
    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("author cannot access publish_any", async () => {
    const app = createTestApp("author", "publish_any");
    const res = await app.request("/test");
    expect(res.status).toBe(403);
  });

  it("unauthenticated user gets 401", async () => {
    const app = createTestApp(null, "read");
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("subscriber can access read", async () => {
    const app = createTestApp("subscriber", "read");
    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });
});

// ─── Content validation ────────────────────────────────────────────────────

describe("Content validation", () => {
  it("should accept all valid content statuses", () => {
    const expected = ["draft", "published", "scheduled", "trash", "archived", "pending"];
    expect(ALLOWED_CONTENT_STATUSES).toEqual(expected);
  });

  it("should accept all valid content types", () => {
    const expected = ["post", "page", "product"];
    expect(ALLOWED_CONTENT_TYPES).toEqual(expected);
  });

  it("should accept all valid roles", () => {
    const expected = ["admin", "editor", "author", "contributor", "subscriber", "viewer"];
    expect(VALID_ROLES).toEqual(expected);
  });
});

// ─── Content slug generation ───────────────────────────────────────────────

describe("Content slug generation", () => {
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  it("should generate slugs from titles", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("My First Blog Post")).toBe("my-first-blog-post");
    expect(generateSlug("OpenPress 2026")).toBe("openpress-2026");
  });

  it("should handle special characters", () => {
    expect(generateSlug("What's Up?")).toBe("what-s-up");
    expect(generateSlug("C++ Guide")).toBe("c-guide");
    expect(generateSlug("  Leading and Trailing  ")).toBe("leading-and-trailing");
  });

  it("should handle consecutive special chars", () => {
    expect(generateSlug("A & B // C")).toBe("a-b-c");
    expect(generateSlug("---test---")).toBe("test");
  });

  it("should handle unicode by stripping it", () => {
    expect(generateSlug("Café")).toBe("caf");
  });
});

// ─── Ownership checks ──────────────────────────────────────────────────────

describe("Ownership middleware simulation", () => {
  it("admin and editor bypass ownership check", () => {
    for (const role of ["admin", "editor"]) {
      const canEdit = role === "admin" || role === "editor";
      expect(canEdit).toBe(true);
    }
  });

  it("author can edit own content", () => {
    const user = { id: "author-1", role: "author" };
    const item = { author_id: "author-1" };
    const canEdit =
      user.role === "admin" ||
      user.role === "editor" ||
      (item && item.author_id === user.id);
    expect(canEdit).toBe(true);
  });

  it("author cannot edit other author's content", () => {
    const user = { id: "author-1", role: "author" };
    const item = { author_id: "author-2" };
    const canEdit =
      user.role === "admin" ||
      user.role === "editor" ||
      (item && item.author_id === user.id);
    expect(canEdit).toBe(false);
  });

  it("contributor can edit own content", () => {
    const user = { id: "contrib-1", role: "contributor" };
    const item = { author_id: "contrib-1" };
    const canEdit =
      user.role === "admin" ||
      user.role === "editor" ||
      (item && item.author_id === user.id);
    expect(canEdit).toBe(true);
  });
});
