-- Phase 26: Reusable Components / Widgets
-- Dashboard section for reusable UI parts insertable via template tags

-- Reusable components/widgets
CREATE TABLE IF NOT EXISTS reusable_components (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('widget', 'section', 'block', 'embed')),
  category TEXT DEFAULT 'general',
  description TEXT,
  template TEXT NOT NULL,
  config_schema TEXT DEFAULT '{}',
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
