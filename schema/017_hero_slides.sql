-- Hero slides for configurable homepage hero section
CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT,
  background_image_url TEXT,
  background_gradient TEXT DEFAULT 'from-primary-950 via-primary-900 to-primary-800',
  primary_button_text TEXT,
  primary_button_url TEXT,
  secondary_button_text TEXT,
  secondary_button_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  animation_type TEXT DEFAULT 'slide' CHECK(animation_type IN ('slide', 'fade', 'bounce', 'zoom')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed default slides
INSERT INTO hero_slides (id, title, subtitle, content, background_gradient, primary_button_text, primary_button_url, secondary_button_text, secondary_button_url, sort_order, is_active, animation_type)
VALUES
  ('slide-1', 'The CMS,', 'Reimagined.', 'OpenPress is a modern, open-source content platform built on Cloudflare''s edge network. React themes, JS plugins, block editor, and AI-ready out of the box.', 'from-primary-950 via-primary-900 to-primary-800', 'Open Dashboard', '/admin', 'View on GitHub', 'https://github.com/aliasfoxkde/OpenPress', 0, 1, 'slide'),
  ('slide-2', 'Built for the Edge', 'Fast everywhere.', 'Unlike traditional CMS platforms, OpenPress runs on Cloudflare''s global network of 300+ data centers. Zero cold starts, sub-millisecond API responses.', 'from-violet-950 via-purple-900 to-indigo-800', 'Get Started', '/docs/tutorial', 'View Features', '/templates', 1, 1, 'fade'),
  ('slide-3', 'AI-Ready Platform', 'Future-proof.', 'Built for the AI era with Workers AI, Vectorize for semantic search, and a hook system AI agents can invoke. Free and open source.', 'from-slate-950 via-gray-900 to-zinc-800', 'Learn More', '/docs/api', 'View Source', 'https://github.com/aliasfoxkde/OpenPress', 2, 1, 'bounce');
