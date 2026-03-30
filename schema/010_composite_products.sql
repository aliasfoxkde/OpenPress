-- Phase 21: Composite Products
-- Customer-configurable products with components (slots), scenarios, and compatibility rules

-- Add composite product type to products table
ALTER TABLE products ADD COLUMN product_type TEXT NOT NULL DEFAULT 'simple'
  CHECK(product_type IN ('simple', 'composite', 'variable', 'digital'));

-- Composite product metadata
CREATE TABLE IF NOT EXISTS composite_products (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  base_price INTEGER DEFAULT 0,
  min_price INTEGER,
  max_price INTEGER,
  price_display TEXT DEFAULT 'range' CHECK(price_display IN ('range', 'from', 'hidden')),
  layout TEXT DEFAULT 'accordion' CHECK(layout IN ('accordion', 'wizard', 'tabs', 'grid')),
  shop_page_thumbnail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Component slots (e.g., "Choose your CPU")
CREATE TABLE IF NOT EXISTS composite_components (
  id TEXT PRIMARY KEY,
  composite_id TEXT NOT NULL REFERENCES composite_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_required INTEGER NOT NULL DEFAULT 1,
  selection_type TEXT DEFAULT 'single' CHECK(selection_type IN ('single', 'multi')),
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER DEFAULT 1,
  display_mode TEXT DEFAULT 'thumbnail' CHECK(display_mode IN ('thumbnail', 'dropdown', 'swatch', 'radio')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Options per component (references existing products)
CREATE TABLE IF NOT EXISTS composite_component_options (
  id TEXT PRIMARY KEY,
  component_id TEXT NOT NULL REFERENCES composite_components(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  is_default INTEGER DEFAULT 0,
  price_override INTEGER,
  price_override_type TEXT CHECK(price_override_type IN ('fixed', 'discount', 'markup')),
  price_override_value INTEGER,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(component_id, product_id)
);

-- Scenarios (pre-defined configurations like "Gaming Build", "Office Build")
CREATE TABLE IF NOT EXISTS composite_scenarios (
  id TEXT PRIMARY KEY,
  composite_id TEXT NOT NULL REFERENCES composite_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  is_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Scenario defaults (which option per component)
CREATE TABLE IF NOT EXISTS composite_scenario_defaults (
  id TEXT PRIMARY KEY,
  scenario_id TEXT NOT NULL REFERENCES composite_scenarios(id) ON DELETE CASCADE,
  component_id TEXT NOT NULL REFERENCES composite_components(id) ON DELETE CASCADE,
  option_id TEXT REFERENCES products(id),
  is_hidden INTEGER DEFAULT 0,
  UNIQUE(scenario_id, component_id)
);

-- Compatibility rules (e.g., AMD CPU incompatible with Intel motherboard)
CREATE TABLE IF NOT EXISTS composite_compat_rules (
  id TEXT PRIMARY KEY,
  composite_id TEXT NOT NULL REFERENCES composite_products(id) ON DELETE CASCADE,
  component_id TEXT NOT NULL REFERENCES composite_components(id),
  option_id TEXT NOT NULL REFERENCES products(id),
  incompatible_component_id TEXT NOT NULL REFERENCES composite_components(id),
  incompatible_option_id TEXT NOT NULL REFERENCES products(id),
  message TEXT
);

-- Extend cart/order for configuration
ALTER TABLE cart_items ADD COLUMN configuration TEXT;
ALTER TABLE order_items ADD COLUMN configuration TEXT;
