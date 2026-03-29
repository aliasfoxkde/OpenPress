import { Hono } from "hono";
import type { Bindings, Variables } from "./types";
import { validateFileUpload, sanitizeFilename } from "./security";

const media = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List media items with pagination
media.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;
  const mime_type = c.req.query("type");

  const whereClause = mime_type ? "WHERE mime_type LIKE ?" : "";
  const params: unknown[] = mime_type ? [`${mime_type}%`] : [];

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, filename, original_name, mime_type, size_bytes, alt_text, caption, width, height, created_at FROM media ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .bind(...params, limit, offset)
      .all(),
    db
      .prepare(`SELECT COUNT(*) as total FROM media ${whereClause}`)
      .bind(...params)
      .first<{ total: number }>(),
  ]);

  // Generate public URLs
  const baseUrl = new URL(c.req.url).origin;
  const data = items.results.map((item: Record<string, unknown>) => ({
    ...item,
    url: `${baseUrl}/api/media/${item.id as string}/file`,
  }));

  return c.json({
    data,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

// POST / - Upload media file to R2
media.post("/", async (c) => {
  const db = c.env.DB;
  const bucket = c.env.MEDIA;
  if (!db || !bucket) {
    return c.json({ error: { message: "Storage not configured", code: "STORAGE_ERROR" } }, 503);
  }

  const user = c.get("user");
  const formData = await c.req.parseBody();
  const file = formData["file"] as File | undefined;
  if (!file) {
    return c.json({ error: { message: "No file provided", code: "VALIDATION" } }, 400);
  }

  // Validate file upload
  const validation = validateFileUpload(file);
  if (!validation.valid) {
    return c.json({ error: { message: validation.error, code: "VALIDATION" } }, 400);
  }

  const id = crypto.randomUUID();
  const safeName = sanitizeFilename(file.name);
  const ext = safeName.split(".").pop() || "bin";
  const r2Key = `${id}.${ext}`;
  const now = new Date().toISOString();

  // Upload to R2
  await bucket.put(r2Key, file.stream());

  // Record in database
  await db
    .prepare(
      "INSERT INTO media (id, filename, original_name, mime_type, size_bytes, r2_key, alt_text, caption, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, r2Key, file.name, file.type, file.size, r2Key, null, null, user?.id || null, now)
    .run();

  return c.json(
    {
      data: {
        id,
        filename: r2Key,
        original_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        created_at: now,
      },
    },
    201,
  );
});

// GET /:id/file - Serve media file from R2
media.get("/:id/file", async (c) => {
  const db = c.env.DB;
  const bucket = c.env.MEDIA;
  if (!db || !bucket) {
    return c.json({ error: { message: "Storage not configured", code: "STORAGE_ERROR" } }, 503);
  }

  const id = c.req.param("id");
  const record = await db.prepare("SELECT r2_key, mime_type FROM media WHERE id = ?").bind(id).first<{ r2_key: string; mime_type: string }>();
  if (!record) {
    return c.json({ error: { message: "Media not found", code: "NOT_FOUND" } }, 404);
  }

  const object = await bucket.get(record.r2_key);
  if (!object) {
    return c.json({ error: { message: "File not found in storage", code: "NOT_FOUND" } }, 404);
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": record.mime_type,
      "Cache-Control": "public, max-age=31536000",
    },
  });
});

// DELETE /:id - Delete media file
media.delete("/:id", async (c) => {
  const db = c.env.DB;
  const bucket = c.env.MEDIA;
  if (!db || !bucket) {
    return c.json({ error: { message: "Storage not configured", code: "STORAGE_ERROR" } }, 503);
  }

  const id = c.req.param("id");
  const record = await db.prepare("SELECT r2_key FROM media WHERE id = ?").bind(id).first<{ r2_key: string }>();
  if (!record) {
    return c.json({ error: { message: "Media not found", code: "NOT_FOUND" } }, 404);
  }

  await bucket.delete(record.r2_key);
  await db.prepare("DELETE FROM media WHERE id = ?").bind(id).run();

  return c.json({ data: { deleted: true } });
});

export default media;
