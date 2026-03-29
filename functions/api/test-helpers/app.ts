// Test helper - standalone Hono app without Cloudflare bindings
// Used for unit tests that don't need D1/KV/R2

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    service: "openpress",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Site info
app.get("/api/site", (c) => {
  return c.json({
    data: {
      name: "OpenPress",
      description: "A modern, edge-native CMS",
      version: "0.1.0",
      features: {
        plugins: true,
        themes: true,
        media: true,
        blockEditor: true,
        ai: false,
      },
    },
  });
});

// Content (no DB)
app.get("/api/content", (c) => {
  return c.json({ error: "Database not configured" }, 503);
});

// 404
app.notFound((c) => {
  return c.json({ error: { message: "Not found", code: "NOT_FOUND" } }, 404);
});

app.onError((err, c) => {
  console.error("API Error:", err);
  return c.json(
    { error: { message: err.message || "Internal server error", code: "INTERNAL_ERROR" } },
    500,
  );
});

export default app;
