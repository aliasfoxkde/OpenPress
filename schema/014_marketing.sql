-- Phase 25: Marketing (Coupons & Campaigns)
-- Loyalty coupons, discount campaigns, promotional tools

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed', 'free_shipping')),
  value INTEGER NOT NULL,
  min_order INTEGER DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  starts_at TEXT,
  expires_at TEXT,
  applies_to TEXT DEFAULT 'all',
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('sale', 'flash', 'seasonal', 'clearance', 'custom')),
  description TEXT,
  banner_image_url TEXT,
  starts_at TEXT,
  ends_at TEXT,
  coupon_id TEXT REFERENCES coupons(id),
  applies_to TEXT DEFAULT 'all',
  is_active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Extend orders for coupon support
ALTER TABLE orders ADD COLUMN coupon_id TEXT REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN discount INTEGER DEFAULT 0;
