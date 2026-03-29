import { Hono } from "hono";
import type { Bindings, Variables } from "./types";

const revisions = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET / - List revisions for a content item
revisions.get("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const contentId = c.req.param("contentId");
  if (!contentId) {
    return c.json({ error: { message: "contentId required", code: "VALIDATION" } }, 400);
  }

  const page = Math.max(1, parseInt(c.req.query("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "20")));
  const offset = (page - 1) * limit;

  const [items, countResult] = await Promise.all([
    db
      .prepare(
        `SELECT cr.*, u.name as author_name
         FROM content_revisions cr
         LEFT JOIN users u ON cr.author_id = u.id
         WHERE cr.content_id = ?
         ORDER BY cr.revision_number DESC
         LIMIT ? OFFSET ?`,
      )
      .bind(contentId, limit, offset)
      .all(),
    db
      .prepare("SELECT COUNT(*) as total FROM content_revisions WHERE content_id = ?")
      .bind(contentId)
      .first<{ total: number }>(),
  ]);

  return c.json({
    data: items.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit),
    },
  });
});

// GET /:id - Get single revision
revisions.get("/:id", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const revision = await db
    .prepare(
      `SELECT cr.*, u.name as author_name
       FROM content_revisions cr
       LEFT JOIN users u ON cr.author_id = u.id
       WHERE cr.id = ?`,
    )
    .bind(id)
    .first();

  if (!revision) {
    return c.json({ error: { message: "Revision not found", code: "NOT_FOUND" } }, 404);
  }

  return c.json({ data: revision });
});

// POST / - Create a revision (snapshot)
revisions.post("/", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const user = c.get("user");
  const body = await c.req.json();
  const { content_id, title, blocks_snapshot, meta_snapshot } = body;

  if (!content_id || !blocks_snapshot) {
    return c.json({ error: { message: "content_id and blocks_snapshot required", code: "VALIDATION" } }, 400);
  }

  // Get next revision number
  const lastRevision = await db
    .prepare("SELECT MAX(revision_number) as max_rev FROM content_revisions WHERE content_id = ?")
    .bind(content_id)
    .first<{ max_rev: number | null }>();

  const revisionNumber = (lastRevision?.max_rev || 0) + 1;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .prepare(
      "INSERT INTO content_revisions (id, content_id, title, blocks_snapshot, meta_snapshot, author_id, revision_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(id, content_id, title || null, blocks_snapshot, meta_snapshot || "{}", user?.id || null, revisionNumber, now)
    .run();

  // Enforce revision limit (default 50)
  const MAX_REVISIONS = 50;
  const totalCount = await db
    .prepare("SELECT COUNT(*) as count FROM content_revisions WHERE content_id = ?")
    .bind(content_id)
    .first<{ count: number }>();

  if ((totalCount?.count || 0) > MAX_REVISIONS) {
    // Delete oldest revisions beyond limit
    const excess = (totalCount?.count || 0) - MAX_REVISIONS;
    if (excess > 0) {
      await db
        .prepare(
          `DELETE FROM content_revisions WHERE content_id = ? AND revision_number IN (
            SELECT revision_number FROM content_revisions WHERE content_id = ? ORDER BY revision_number ASC LIMIT ?
          )`,
        )
        .bind(content_id, content_id, excess)
        .run();
    }
  }

  return c.json(
    {
      data: {
        id,
        content_id,
        revision_number: revisionNumber,
        created_at: now,
      },
    },
    201,
  );
});

// POST /:id/restore - Restore a revision
revisions.post("/:id/restore", async (c) => {
  const db = c.env.DB;
  if (!db) return c.json({ error: { message: "Database not configured", code: "DB_ERROR" } }, 503);

  const id = c.req.param("id");
  const user = c.get("user");

  const revision = await db
    .prepare("SELECT * FROM content_revisions WHERE id = ?")
    .bind(id)
    .first<{
      id: string;
      content_id: string;
      title: string;
      blocks_snapshot: string;
      meta_snapshot: string;
    }>();

  if (!revision) {
    return c.json({ error: { message: "Revision not found", code: "NOT_FOUND" } }, 404);
  }

  const now = new Date().toISOString();

  // Save current state as a revision before restoring
  const currentContent = await db
    .prepare("SELECT title FROM content_items WHERE id = ?")
    .bind(revision.content_id)
    .first<{ title: string }>();

  const currentBlocks = await db
    .prepare("SELECT * FROM content_blocks WHERE content_id = ? ORDER BY sort_order")
    .bind(revision.content_id)
    .all();

  // Snapshot current state
  const currentBlocksJson = JSON.stringify(currentBlocks.results);
  const lastRev = await db
    .prepare("SELECT MAX(revision_number) as max_rev FROM content_revisions WHERE content_id = ?")
    .bind(revision.content_id)
    .first<{ max_rev: number | null }>();
  const newRevNum = (lastRev?.max_rev || 0) + 1;

  await db
    .prepare(
      "INSERT INTO content_revisions (id, content_id, title, blocks_snapshot, meta_snapshot, author_id, revision_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), revision.content_id, currentContent?.title || "", currentBlocksJson, "{}", user?.id || null, newRevNum, now)
    .run();

  // Restore: delete current blocks, re-insert from revision
  await db.prepare("DELETE FROM content_blocks WHERE content_id = ?").bind(revision.content_id).run();

  const restoredBlocks = JSON.parse(revision.blocks_snapshot || "[]") as Array<Record<string, unknown>>;
  for (let i = 0; i < restoredBlocks.length; i++) {
    const block = restoredBlocks[i];
    await db
      .prepare(
        "INSERT INTO content_blocks (id, content_id, block_type, data, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        (block.id as string) || crypto.randomUUID(),
        revision.content_id,
        (block.block_type as string) || "text",
        JSON.stringify(block.data || {}),
        i,
        now,
        now,
      )
      .run();
  }

  // Update content title if it was in the revision
  if (revision.title) {
    await db
      .prepare("UPDATE content_items SET title = ?, updated_at = ? WHERE id = ?")
      .bind(revision.title, now, revision.content_id)
      .run();
  }

  return c.json({
    data: {
      restored: true,
      content_id: revision.content_id,
      revision_id: id,
    },
  });
});

export default revisions;
