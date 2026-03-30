import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const aiAssistant = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /admin/ai/config - Get assistant configuration
aiAssistant.get("/admin/ai/config", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const config = await db
    .prepare("SELECT * FROM ai_assistant_config WHERE id = ?")
    .bind("default")
    .first();

  if (!config) {
    // Return defaults when no config exists yet
    return c.json({
      data: {
        id: "default",
        is_enabled: false,
        name: "AI Assistant",
        greeting: "Hello! How can I help you today?",
        avatar_url: null,
        system_prompt: "You are a helpful assistant for this website.",
        model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        max_tokens: 1024,
        temperature: 0.7,
        widget_position: "bottom-right",
        widget_primary_color: "#3b82f6",
        widget_bg_color: "#ffffff",
        widget_text_color: "#111827",
        voice_enabled: false,
        voice_language: "en-US",
        auto_open: false,
        created_at: null,
        updated_at: null,
      },
    });
  }

  return c.json({ data: config });
});

// PUT /admin/ai/config - Upsert assistant configuration
aiAssistant.put("/admin/ai/config", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const now = new Date().toISOString();

  const {
    is_enabled = false,
    name = "AI Assistant",
    greeting = "Hello! How can I help you today?",
    avatar_url = null,
    system_prompt = "You are a helpful assistant for this website.",
    model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    max_tokens = 1024,
    temperature = 0.7,
    widget_position = "bottom-right",
    widget_primary_color = "#3b82f6",
    widget_bg_color = "#ffffff",
    widget_text_color = "#111827",
    voice_enabled = false,
    voice_language = "en-US",
    auto_open = false,
  } = body;

  await db
    .prepare(
      `INSERT INTO ai_assistant_config (
        id, is_enabled, name, greeting, avatar_url, system_prompt, model,
        max_tokens, temperature, widget_position, widget_primary_color,
        widget_bg_color, widget_text_color, voice_enabled, voice_language,
        auto_open, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_enabled = ?, name = ?, greeting = ?, avatar_url = ?, system_prompt = ?,
        model = ?, max_tokens = ?, temperature = ?, widget_position = ?,
        widget_primary_color = ?, widget_bg_color = ?, widget_text_color = ?,
        voice_enabled = ?, voice_language = ?, auto_open = ?, updated_at = ?`
    )
    .bind(
      "default", is_enabled ? 1 : 0, name, greeting, avatar_url, system_prompt, model,
      max_tokens, temperature, widget_position, widget_primary_color,
      widget_bg_color, widget_text_color, voice_enabled ? 1 : 0, voice_language,
      auto_open ? 1 : 0, now, now,
      is_enabled ? 1 : 0, name, greeting, avatar_url, system_prompt, model,
      max_tokens, temperature, widget_position, widget_primary_color,
      widget_bg_color, widget_text_color, voice_enabled ? 1 : 0, voice_language,
      auto_open ? 1 : 0, now,
    )
    .run();

  // Invalidate KV cache
  if (c.env.CACHE) {
    await c.env.CACHE.delete("ai:widget:config");
  }

  return c.json({
    data: {
      id: "default",
      is_enabled,
      name,
      greeting,
      avatar_url,
      system_prompt,
      model,
      max_tokens,
      temperature,
      widget_position,
      widget_primary_color,
      widget_bg_color,
      widget_text_color,
      voice_enabled,
      voice_language,
      auto_open,
      updated_at: now,
    },
  });
});

// GET /admin/ai/knowledge - List knowledge documents
aiAssistant.get("/admin/ai/knowledge", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const sourceType = c.req.query("source_type");
  const activeOnly = c.req.query("active") === "true";

  let query = "SELECT * FROM ai_knowledge";
  const params: unknown[] = [];

  if (sourceType) {
    query += " WHERE source_type = ?";
    params.push(sourceType);
  }
  if (activeOnly) {
    query += params.length > 0 ? " AND is_active = 1" : " WHERE is_active = 1";
  }

  query += " ORDER BY updated_at DESC";

  const result = params.length > 0
    ? await db.prepare(query).bind(...params).all()
    : await db.prepare(query).all();

  return c.json({ data: result.results });
});

// POST /admin/ai/knowledge - Add knowledge document
aiAssistant.post("/admin/ai/knowledge", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { title, content, source_type = "manual", source_url = null } = body;

  if (!title || !content) {
    return c.json({ error: { message: "Title and content are required", code: "VALIDATION" } }, 400);
  }

  if (title.length > 500 || content.length > 50000) {
    return c.json({ error: { message: "Title max 500 chars, content max 50000 chars", code: "VALIDATION" } }, 400);
  }

  const validSourceTypes = ["manual", "url", "file", "content"];
  if (!validSourceTypes.includes(source_type)) {
    return c.json({ error: { message: `source_type must be one of: ${validSourceTypes.join(", ")}`, code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO ai_knowledge (id, title, content, source_type, source_url, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
    )
    .bind(id, title.trim(), content.trim(), source_type, source_url, now, now)
    .run();

  return c.json({ data: { id, title, source_type, source_url, is_active: true, created_at: now } }, 201);
});

// PUT /admin/ai/knowledge/:id - Update knowledge document
aiAssistant.put("/admin/ai/knowledge/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const body = await c.req.json();
  const now = new Date().toISOString();

  const existing = await db.prepare("SELECT id FROM ai_knowledge WHERE id = ?").bind(id).first<{ id: string }>();
  if (!existing) {
    return c.json({ error: { message: "Knowledge document not found", code: "NOT_FOUND" } }, 404);
  }

  const { title, content, source_type, source_url, is_active } = body;
  const updates: string[] = ["updated_at = ?"];
  const params: unknown[] = [now];

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0 || title.length > 500) {
      return c.json({ error: { message: "Title must be 1-500 characters", code: "VALIDATION" } }, 400);
    }
    updates.push("title = ?");
    params.push(title.trim());
  }
  if (content !== undefined) {
    if (typeof content !== "string" || content.length > 50000) {
      return c.json({ error: { message: "Content max 50000 characters", code: "VALIDATION" } }, 400);
    }
    updates.push("content = ?");
    params.push(content.trim());
  }
  if (source_type !== undefined) {
    const validSourceTypes = ["manual", "url", "file", "content"];
    if (!validSourceTypes.includes(source_type)) {
      return c.json({ error: { message: `source_type must be one of: ${validSourceTypes.join(", ")}`, code: "VALIDATION" } }, 400);
    }
    updates.push("source_type = ?");
    params.push(source_type);
  }
  if (source_url !== undefined) {
    updates.push("source_url = ?");
    params.push(source_url);
  }
  if (is_active !== undefined) {
    updates.push("is_active = ?");
    params.push(is_active ? 1 : 0);
  }

  params.push(id);
  await db.prepare(`UPDATE ai_knowledge SET ${updates.join(", ")} WHERE id = ?`).bind(...params).run();

  return c.json({ data: { id, updated_at: now } });
});

// DELETE /admin/ai/knowledge/:id - Delete knowledge document
aiAssistant.delete("/admin/ai/knowledge/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");

  await db.prepare("DELETE FROM ai_knowledge WHERE id = ?").bind(id).run();
  return c.json({ data: { deleted: true } });
});

// GET /admin/ai/analytics - Chat analytics
aiAssistant.get("/admin/ai/analytics", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const days = Math.min(90, Math.max(1, parseInt(c.req.query("days") || "30")));
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [totalMessages, totalSessions, recentMessages, recentSessions] = await Promise.all([
    db.prepare("SELECT COUNT(*) as count FROM ai_chat_history").first<{ count: number }>(),
    db.prepare("SELECT COUNT(DISTINCT session_id) as count FROM ai_chat_history").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) as count FROM ai_chat_history WHERE created_at >= ?").bind(since).first<{ count: number }>(),
    db.prepare("SELECT COUNT(DISTINCT session_id) as count FROM ai_chat_history WHERE created_at >= ?").bind(since).first<{ count: number }>(),
  ]);

  return c.json({
    data: {
      total_messages: totalMessages?.count || 0,
      total_sessions: totalSessions?.count || 0,
      recent_messages: recentMessages?.count || 0,
      recent_sessions: recentSessions?.count || 0,
      period_days: days,
    },
  });
});

// POST /ai/chat - Public: send message (with RAG context from knowledge base)
aiAssistant.post("/ai/chat", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const body = await c.req.json();
  const { message, session_id, history = [] } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return c.json({ error: { message: "Message is required", code: "VALIDATION" } }, 400);
  }

  if (message.length > 10000) {
    return c.json({ error: { message: "Message too long (max 10000 chars)", code: "VALIDATION" } }, 400);
  }

  // Check if assistant is enabled
  const config = await db
    .prepare("SELECT * FROM ai_assistant_config WHERE id = ?")
    .bind("default")
    .first<{
      is_enabled: number;
      name: string;
      greeting: string;
      system_prompt: string;
      model: string;
      max_tokens: number;
      temperature: number;
    }>();

  if (!config || !config.is_enabled) {
    return c.json({ error: { message: "AI assistant is not available", code: "UNAVAILABLE" } }, 503);
  }

  // Generate or validate session ID
  const sessionId = session_id && typeof session_id === "string" && session_id.length > 0
    ? session_id
    : crypto.randomUUID();

  // Save user message to history
  const userMsgId = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare("INSERT INTO ai_chat_history (id, session_id, role, content, metadata, created_at) VALUES (?, ?, 'user', ?, ?, ?)")
    .bind(userMsgId, sessionId, message.trim(), null, now)
    .run();

  // Search knowledge base for relevant context (simple LIKE search)
  let knowledgeContext = "";
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length > 0) {
    // Search for documents matching any significant word from the user message
    const conditions = words.slice(0, 5).map(() => "LOWER(content) LIKE ?").join(" OR ");
    const searchParams = words.slice(0, 5).map((w) => `%${w}%`);

    const knowledgeResults = await db
      .prepare(`SELECT title, content FROM ai_knowledge WHERE is_active = 1 AND (${conditions}) LIMIT 3`)
      .bind(...searchParams)
      .all();

    const docs = knowledgeResults.results as { title: string; content: string }[];
    if (docs.length > 0) {
      knowledgeContext = "\n\nRelevant knowledge base context:\n" +
        docs.map((d) => `[${d.title}]\n${d.content.substring(0, 2000)}`).join("\n---\n");
    }
  }

  // Build messages array with system prompt + knowledge context + conversation history
  const systemContent = config.system_prompt + (knowledgeContext ? knowledgeContext + "\n\nUse the above context to answer the user's question when relevant. If the context doesn't help, answer based on your general knowledge." : "");

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemContent },
  ];

  // Add conversation history (last 10 messages)
  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  for (const entry of recentHistory) {
    if (entry.role === "user" || entry.role === "assistant") {
      messages.push({ role: entry.role, content: String(entry.content) });
    }
  }

  // Add current user message
  messages.push({ role: "user", content: message.trim() });

  // Attempt AI generation via Workers AI binding
  let assistantReply: string;

  try {
    // @ts-expect-error Workers AI binding
    const aiBinding: AiTextGeneration = c.env.AI;

    if (aiBinding) {
      const result = await aiBinding.run(config.model, {
        messages,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
      });
      assistantReply = result.response || "I apologize, but I could not generate a response at this time.";
    } else {
      assistantReply = "I'm here to help! The AI service is currently being configured. Please try again shortly.";
    }
  } catch {
    assistantReply = "I'm experiencing a temporary issue. Please try again.";
  }

  // Save assistant reply to history
  const assistantMsgId = crypto.randomUUID();
  await db
    .prepare("INSERT INTO ai_chat_history (id, session_id, role, content, metadata, created_at) VALUES (?, ?, 'assistant', ?, ?, ?)")
    .bind(assistantMsgId, sessionId, assistantReply, null, now)
    .run();

  return c.json({
    data: {
      session_id: sessionId,
      message: assistantReply,
      model: config.model,
    },
  });
});

// GET /ai/widget/config - Public: widget configuration for embedding
aiAssistant.get("/ai/widget/config", async (c) => {
  const db = c.env.DB;
  const cache = c.env.CACHE;

  // Try KV cache first
  if (cache) {
    const cached = await cache.get("ai:widget:config");
    if (cached) {
      try {
        return c.json(JSON.parse(cached));
      } catch {
        // cache miss
      }
    }
  }

  if (!db) {
    return c.json({ data: { is_enabled: false } });
  }

  const config = await db
    .prepare(
      `SELECT is_enabled, name, greeting, avatar_url, widget_position,
              widget_primary_color, widget_bg_color, widget_text_color,
              voice_enabled, voice_language, auto_open
       FROM ai_assistant_config WHERE id = ?`
    )
    .bind("default")
    .first<{
      is_enabled: number;
      name: string;
      greeting: string;
      avatar_url: string | null;
      widget_position: string;
      widget_primary_color: string;
      widget_bg_color: string;
      widget_text_color: string;
      voice_enabled: number;
      voice_language: string;
      auto_open: number;
    }>();

  if (!config || !config.is_enabled) {
    return c.json({ data: { is_enabled: false } });
  }

  const response = c.json({
    data: {
      is_enabled: true,
      name: config.name,
      greeting: config.greeting,
      avatar_url: config.avatar_url,
      widget_position: config.widget_position,
      widget_primary_color: config.widget_primary_color,
      widget_bg_color: config.widget_bg_color,
      widget_text_color: config.widget_text_color,
      voice_enabled: !!config.voice_enabled,
      voice_language: config.voice_language,
      auto_open: !!config.auto_open,
    },
  });

  // Cache for 5 minutes
  if (cache) {
    const body = JSON.stringify({
      data: {
        is_enabled: true,
        name: config.name,
        greeting: config.greeting,
        avatar_url: config.avatar_url,
        widget_position: config.widget_position,
        widget_primary_color: config.widget_primary_color,
        widget_bg_color: config.widget_bg_color,
        widget_text_color: config.widget_text_color,
        voice_enabled: !!config.voice_enabled,
        voice_language: config.voice_language,
        auto_open: !!config.auto_open,
      },
    });
    await cache.put("ai:widget:config", body, { expirationTtl: 300 });
  }

  return response;
});

export default aiAssistant;
