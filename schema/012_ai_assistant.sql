-- Phase 23: AI Assistant Enhancement
-- Website support widget, RAG/knowledge base, voice, customization

-- AI assistant configuration
CREATE TABLE IF NOT EXISTS ai_assistant_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  is_enabled INTEGER DEFAULT 0,
  name TEXT DEFAULT 'OpenPress Assistant',
  greeting TEXT DEFAULT 'Hi! How can I help you?',
  avatar_url TEXT,
  system_prompt TEXT DEFAULT 'You are a helpful website assistant.',
  model TEXT DEFAULT '@cf/meta/llama-3.1-8b-instruct',
  max_tokens INTEGER DEFAULT 1024,
  temperature REAL DEFAULT 0.7,
  widget_position TEXT DEFAULT 'bottom-right' CHECK(widget_position IN ('bottom-right', 'bottom-left')),
  widget_primary_color TEXT DEFAULT '#6366f1',
  widget_bg_color TEXT DEFAULT '#ffffff',
  widget_text_color TEXT DEFAULT '#1f2937',
  voice_enabled INTEGER DEFAULT 0,
  voice_language TEXT DEFAULT 'en-US',
  auto_open INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Knowledge documents for RAG
CREATE TABLE IF NOT EXISTS ai_knowledge (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'text' CHECK(source_type IN ('text', 'url', 'file')),
  source_url TEXT,
  file_key TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Chat history for analytics
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_chat_session ON ai_chat_history(session_id);
