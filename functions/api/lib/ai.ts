import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const ai = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// POST /generate - Generate content using Workers AI
ai.post("/generate", async (c) => {
  const body = await c.req.json();
  const { prompt, model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast", max_tokens = 1024, system } = body;

  if (!prompt) return c.json({ error: { message: "Prompt required", code: "VALIDATION" } }, 400);

  try {
    // @ts-expect-error Workers AI binding
    const aiBinding: AiTextGeneration = c.env.AI;
    if (!aiBinding) return c.json({ error: { message: "AI not configured", code: "AI_ERROR" } }, 503);

    const messages = [
      ...(system ? [{ role: "system" as const, content: system }] : []),
      { role: "user" as const, content: prompt },
    ];

    const result = await aiBinding.run(model, { messages, max_tokens });

    return c.json({
      data: {
        text: result.response,
        model,
        usage: result.usage,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return c.json({ error: { message, code: "AI_ERROR" } }, 500);
  }
});

// POST /summarize - Summarize text
ai.post("/summarize", async (c) => {
  const body = await c.req.json();
  const { text, max_length = 200 } = body;

  if (!text) return c.json({ error: { message: "Text required", code: "VALIDATION" } }, 400);

  try {
    // @ts-expect-error Workers AI binding
    const aiBinding: AiTextGeneration = c.env.AI;
    if (!aiBinding) return c.json({ error: { message: "AI not configured", code: "AI_ERROR" } }, 503);

    const result = await aiBinding.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: "Summarize the following text concisely. Keep it under the specified length." },
        { role: "user", content: `Summarize (max ${max_length} chars):\n\n${text}` },
      ],
      max_tokens: 512,
    });

    return c.json({ data: { summary: result.response, original_length: text.length } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summarization failed";
    return c.json({ error: { message, code: "AI_ERROR" } }, 500);
  }
});

// POST /suggest - Content suggestions (titles, SEO meta, etc.)
ai.post("/suggest", async (c) => {
  const body = await c.req.json();
  const { type = "title", content, count = 3 } = body;

  if (!content) return c.json({ error: { message: "Content required", code: "VALIDATION" } }, 400);

  const prompts: Record<string, string> = {
    title: `Generate ${count} compelling titles for this content. Return as JSON array of strings.\n\nContent:\n${content}`,
    excerpt: `Write ${count} brief excerpts (1-2 sentences) for this content. Return as JSON array of strings.\n\nContent:\n${content}`,
    seo: `Generate SEO metadata for this content. Return JSON with "title", "description", and "keywords" (array of 5-10 keywords).\n\nContent:\n${content}`,
    tags: `Suggest ${count} relevant tags/categories for this content. Return as JSON array of strings.\n\nContent:\n${content}`,
  };

  try {
    // @ts-expect-error Workers AI binding
    const aiBinding: AiTextGeneration = c.env.AI;
    if (!aiBinding) return c.json({ error: { message: "AI not configured", code: "AI_ERROR" } }, 503);

    const result = await aiBinding.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: "You are a content assistant. Respond with valid JSON only, no markdown." },
        { role: "user", content: prompts[type] || prompts.title },
      ],
      max_tokens: 512,
    });

    let suggestions;
    try {
      // Try parsing the AI response as JSON
      const cleaned = result.response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      suggestions = result.response;
    }

    return c.json({ data: { type, suggestions } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Suggestion failed";
    return c.json({ error: { message, code: "AI_ERROR" } }, 500);
  }
});

// POST /translate - Translate text
ai.post("/translate", async (c) => {
  const body = await c.req.json();
  const { text, target_lang = "en" } = body;

  if (!text) return c.json({ error: { message: "Text required", code: "VALIDATION" } }, 400);

  try {
    // @ts-expect-error Workers AI binding
    const aiBinding: AiTextGeneration = c.env.AI;
    if (!aiBinding) return c.json({ error: { message: "AI not configured", code: "AI_ERROR" } }, 503);

    const result = await aiBinding.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: `You are a translator. Translate the following text to ${target_lang}. Return only the translated text, nothing else.` },
        { role: "user", content: text },
      ],
      max_tokens: 2048,
    });

    return c.json({ data: { translation: result.response, target_lang } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return c.json({ error: { message, code: "AI_ERROR" } }, 500);
  }
});

// POST /embed - Generate text embeddings for semantic search
ai.post("/embed", async (c) => {
  const body = await c.req.json();
  const { texts } = body;

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return c.json({ error: { message: "Texts array required", code: "VALIDATION" } }, 400);
  }

  try {
    // @ts-expect-error Workers AI binding
    const aiBinding: AiTextGeneration = c.env.AI;
    if (!aiBinding) return c.json({ error: { message: "AI not configured", code: "AI_ERROR" } }, 503);

    const results = await (aiBinding as unknown as { run: (model: string, opts: { text: string[] }) => Promise<{ data: number[][] }> }).run(
      "@cf/baai/bge-base-en-v1.5",
      { texts }
    );

    return c.json({ data: { embeddings: results.data } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Embedding failed";
    return c.json({ error: { message, code: "AI_ERROR" } }, 500);
  }
});

export default ai;
