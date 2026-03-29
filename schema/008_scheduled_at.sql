-- OpenPress Schema Migration 008
-- Add scheduled_at column for content scheduling

ALTER TABLE content_items ADD COLUMN scheduled_at TEXT;

-- Index for efficient scheduled content queries
CREATE INDEX IF NOT EXISTS idx_content_scheduled ON content_items(scheduled_at) WHERE status = 'scheduled';
