-- Phase 22: Multi-Gateway Payment Processing
-- Support for PayPal, Square, Manual, and Custom payment methods

-- Payment provider configuration
CREATE TABLE IF NOT EXISTS payment_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('stripe', 'paypal', 'square', 'manual', 'custom')),
  is_enabled INTEGER DEFAULT 0,
  config TEXT DEFAULT '{}',
  settings TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payment transactions log
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  provider TEXT NOT NULL,
  provider_transaction_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  metadata TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Extend orders for multi-provider
ALTER TABLE orders ADD COLUMN payment_provider_id TEXT REFERENCES payment_providers(id);
