import { describe, it, expect } from "vitest";
import type { Bindings } from "../../functions/api/lib/types";
import aiAssistant from "../../functions/api/lib/ai-assistant";

// The public widget-config route is fetched by every page that embeds the AI
// widget, so its KV interaction must be read-first / write-on-miss with a
// TTL that does not re-write the key on every expiry (the admin config PUT
// deletes the key on save, so the TTL is a backstop, not the invalidation).

function kvStub(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const puts: Array<{ key: string; value: string; ttl?: number }> = [];
  return {
    store,
    puts,
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      puts.push({ key, value, ttl: opts?.expirationTtl });
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
  };
}

function dbReturning(row: Record<string, unknown>) {
  return {
    prepare: () => ({
      bind: () => ({ first: async () => row }),
      first: async () => row,
    }),
  };
}

function widgetEnv(db: unknown, cache: unknown) {
  return { DB: db, CACHE: cache } as unknown as Bindings;
}

describe("AI widget config KV cache", () => {
  it("serves the cached config without touching D1 or writing KV", async () => {
    const cached = { data: { is_enabled: true, name: "Cached Guide" } };
    const cache = kvStub({ "ai:widget:config": JSON.stringify(cached) });
    const untouchedDb = dbReturning({});

    const res = await aiAssistant.request(
      "/ai/widget/config",
      {},
      widgetEnv(untouchedDb, cache),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(cached);
    expect(cache.puts).toHaveLength(0);
  });

  it("writes through once on a miss with a 1h TTL", async () => {
    const cache = kvStub();
    const row = {
      is_enabled: 1,
      name: "Guide",
      greeting: "Hi there",
      avatar_url: null,
      widget_position: "br",
      widget_primary_color: "#111111",
      widget_bg_color: "#ffffff",
      widget_text_color: "#111111",
      voice_enabled: 0,
      voice_language: "en",
      auto_open: 0,
    };

    const res = await aiAssistant.request(
      "/ai/widget/config",
      {},
      widgetEnv(dbReturning(row), cache),
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { name: string } };
    expect(body.data.name).toBe("Guide");
    expect(cache.puts).toHaveLength(1);
    expect(cache.puts[0]!.key).toBe("ai:widget:config");
    expect(cache.puts[0]!.ttl).toBe(3600);
  });
});
