# OpenPress Store & Marketplace Plan

**Category:** Architecture
**Status:** Draft
**Created:** 2026-03-30

---

## Vision

A self-hosted marketplace for OpenPress themes, plugins, components, and templates — running entirely on Cloudflare's free tier ($0 cost). Unlike WordPress.org's plugin repo, this marketplace lives inside each OpenPress instance, connects to a shared registry for listings, and handles installation, updates, licensing, and payments natively.

---

## Core Concepts

### What Gets Sold

| Type | Description | Storage | Price Model |
|------|-------------|---------|-------------|
| **Themes** | Full site designs (colors, fonts, layout, CSS vars) | DB + R2 (assets) | Free / Paid |
| **Plugins** | JS bundles that hook into the PluginRegistry | DB + R2 (bundle) | Free / Paid |
| **Components** | Reusable UI widgets/sections (HTML templates) | DB (template TEXT) | Free / Paid |
| **Starter Kits** | Bundled theme + components + sample content | Composite (refs) | Free / Paid |

### Who Participates

| Role | Capabilities |
|------|-------------|
| **Buyers** (any OpenPress user) | Browse, install free items, purchase paid items, leave reviews |
| **Authors** (registered developers) | Submit items, manage versions, view sales, receive payouts |
| **Curators** (admin/editor) | Review submissions, approve/reject, feature items, manage categories |
| **Admin** | Full control: pricing, payouts, policies, featured content |

---

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Local Instance (per OpenPress install)    │
│  - Installed items (DB)                             │
│  - Local registry cache (KV)                        │
│  - Plugin execution (PluginRegistry)                │
│  - Theme application (CSS vars)                     │
│  - Component rendering (template tags)              │
└─────────────────────────────────────────────────────┘
            ↕ API (pull listings, submit items)
┌─────────────────────────────────────────────────────┐
│  Layer 2: Shared Registry (openpress.pages.dev)     │
│  - Item listings (name, desc, screenshots, ratings) │
│  - Version metadata (changelog, compatibility)      │
│  - Author profiles                                  │
│  - Categories/tags                                  │
│  - Review/rating data                               │
└─────────────────────────────────────────────────────┘
            ↕ API (upload bundles, CDN serve)
┌─────────────────────────────────────────────────────┐
│  Layer 3: Storage (R2)                              │
│  - Item bundles (.zip with manifest.json)           │
│  - Screenshots/thumbnails                           │
│  - Theme assets (CSS, images, fonts)                │
│  - Plugin bundles (JS, config)                      │
└─────────────────────────────────────────────────────┘
```

**Key insight**: The registry and local instance share the same D1 database but different API namespaces. This avoids multi-tenant complexity while keeping everything on one Cloudflare account.

---

## Database Schema

### `schema/017_marketplace.sql`

```sql
-- Authors (developers who submit items)
CREATE TABLE marketplace_authors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  website_url TEXT,
  avatar_url TEXT,
  stripe_account_id TEXT,           -- for payouts (Stripe Connect)
  is_verified INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Marketplace items (themes, plugins, components, kits)
CREATE TABLE marketplace_items (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES marketplace_authors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('theme', 'plugin', 'component', 'starter_kit')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,                     -- short description (1 line)
  description TEXT,                 -- full description (markdown)
  version TEXT NOT NULL DEFAULT '1.0.0',
  license TEXT DEFAULT 'GPL-3.0',
  price_cents INTEGER DEFAULT 0,    -- 0 = free
  status TEXT DEFAULT 'draft' CHECK(status IN (
    'draft', 'pending', 'approved', 'rejected', 'suspended', 'archived'
  )),
  is_featured INTEGER DEFAULT 0,
  is_official INTEGER DEFAULT 0,    -- built-in / first-party
  download_count INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  sale_count INTEGER DEFAULT 0,
  avg_rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  compatibility TEXT DEFAULT '{}',  -- JSON: { "min_version": "1.0", "max_version": null }
  bundle_url TEXT,                  -- R2 key for .zip bundle
  bundle_hash TEXT,                 -- SHA-256 of bundle for integrity
  bundle_size INTEGER,              -- bytes
  screenshots TEXT DEFAULT '[]',    -- JSON array of R2 URLs
  tags TEXT DEFAULT '[]',           -- JSON array of strings
  category TEXT,
  requires_plugins TEXT DEFAULT '[]', -- JSON: plugin slugs this item depends on
  changelog TEXT DEFAULT '[]',      -- JSON: [{ "version": "1.1", "notes": "...", "date": "..." }]
  submitted_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(id),
  rejection_reason TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(slug, type)
);

CREATE INDEX idx_items_author ON marketplace_items(author_id);
CREATE INDEX idx_items_type_status ON marketplace_items(type, status);
CREATE INDEX idx_items_featured ON marketplace_items(is_featured) WHERE is_featured = 1;
CREATE INDEX idx_items_category ON marketplace_items(category);

-- Item versions (full version history)
CREATE TABLE marketplace_versions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  bundle_url TEXT NOT NULL,
  bundle_hash TEXT NOT NULL,
  bundle_size INTEGER NOT NULL,
  changelog TEXT,
  min_compatible_version TEXT,
  is_latest INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_id, version)
);

-- Categories
CREATE TABLE marketplace_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tags (normalized)
CREATE TABLE marketplace_tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  item_count INTEGER DEFAULT 0
);

-- Item ↔ Tag junction
CREATE TABLE marketplace_item_tags (
  item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES marketplace_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Reviews
CREATE TABLE marketplace_reviews (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_verified_purchase INTEGER DEFAULT 0,  -- did they actually buy/install it?
  is_helpful_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_id, user_id)  -- one review per user per item
);

CREATE INDEX idx_reviews_item ON marketplace_reviews(item_id);
CREATE INDEX idx_reviews_user ON marketplace_reviews(user_id);

-- Purchases / Licenses
CREATE TABLE marketplace_purchases (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id),   -- link to existing order system
  license_key TEXT UNIQUE,               -- for paid items
  price_paid_cents INTEGER NOT NULL,
  seller_earnings_cents INTEGER NOT NULL, -- after platform fee
  platform_fee_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'refunded', 'revoked', 'expired')),
  expires_at TEXT,                        -- for subscription licenses (future)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE INDEX idx_purchases_item ON marketplace_purchases(item_id);

-- Local installations (tracks what's installed on THIS instance)
CREATE TABLE marketplace_installed (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  installed_by TEXT NOT NULL REFERENCES users(id),
  installed_version TEXT NOT NULL,
  install_path TEXT,                     -- where it's mounted (e.g., "plugins/my-plugin")
  is_active INTEGER DEFAULT 1,
  installed_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(item_id)                        -- one install per item
);

-- Submissions (audit trail for curation)
CREATE TABLE marketplace_submissions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('submit', 'approve', 'reject', 'suspend', 'archive')),
  reviewer_id TEXT REFERENCES users(id),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Payout requests (author withdrawal)
CREATE TABLE marketplace_payouts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES marketplace_authors(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
```

---

## API Endpoints

### Public (no auth)

```
GET  /marketplace                        — browse items (paginated, filterable)
GET  /marketplace/featured               — featured items
GET  /marketplace/:type/:slug             — item detail page
GET  /marketplace/:type/:slug/versions    — version history
GET  /marketplace/categories             — list categories
GET  /marketplace/search?q=...           — search items
GET  /marketplace/authors/:id            — author profile
```

### Protected (JWT)

```
# Purchases
POST   /marketplace/:type/:slug/purchase   — buy an item
GET    /marketplace/purchases               — my purchases
GET    /marketplace/purchases/:id           — purchase detail

# Reviews
POST   /marketplace/:type/:slug/reviews     — submit review
PUT    /marketplace/reviews/:id             — update review
DELETE /marketplace/reviews/:id             — delete review
POST   /marketplace/reviews/:id/helpful    — mark helpful

# Installation
POST   /marketplace/:type/:slug/install     — install item
POST   /marketplace/:type/:slug/update      — update to latest version
DELETE /marketplace/:type/:slug/uninstall   — remove item
GET    /marketplace/installed               — list installed items
GET    /marketplace/installed/updates       — check for available updates
```

### Author (requires author profile)

```
POST   /marketplace/author/profile          — create author profile
PUT    /marketplace/author/profile          — update profile
GET    /marketplace/author/dashboard        — sales stats, earnings
GET    /marketplace/author/items            — my items
POST   /marketplace/author/items            — submit new item
PUT    /marketplace/author/items/:id        — update item
DELETE /marketplace/author/items/:id        — remove item (if no purchases)
POST   /marketplace/author/items/:id/versions — upload new version
POST   /marketplace/author/payouts          — request payout
GET    /marketplace/author/payouts          — payout history
```

### Admin (curator)

```
GET    /marketplace/admin/submissions       — pending reviews queue
POST   /marketplace/admin/submissions/:id/approve — approve
POST   /marketplace/admin/submissions/:id/reject  — reject
GET    /marketplace/admin/items             — all items (admin view)
PUT    /marketplace/admin/items/:id         — edit any item
DELETE /marketplace/admin/items/:id         — remove any item
PUT    /marketplace/admin/items/:id/feature — toggle featured
GET    /marketplace/admin/categories        — manage categories
POST   /marketplace/admin/categories        — create category
PUT    /marketplace/admin/categories/:id    — update category
DELETE /marketplace/admin/categories/:id    — delete category
GET    /marketplace/admin/payouts           — all payout requests
POST   /marketplace/admin/payouts/:id/process — process payout
GET    /marketplace/admin/stats             — marketplace stats
PUT    /marketplace/admin/settings          — marketplace settings
```

---

## Item Bundle Format

Every item is a `.zip` uploaded to R2 with this structure:

```
my-theme.zip
├── manifest.json          — REQUIRED: metadata
├── README.md              — REQUIRED: documentation
├── screenshot.png         — REQUIRED: 1200x800 preview
├── thumbnail.png          — OPTIONAL: 400x300
│
├── [For themes:]
│   ├── theme.css          — CSS custom properties + overrides
│   ├── preview.html       — standalone preview page
│   └── assets/            — images, fonts, etc.
│
├── [For plugins:]
│   ├── plugin.js          — main bundle (ES module or IIFE)
│   ├── plugin.js.map      — source map
│   └── config.json        — plugin settings schema
│
├── [For components:]
│   ├── template.html      — HTML template with {{ variables }}
│   └── preview.html       — rendered preview
│
└── [For starter kits:]
    ├── theme.json         — theme config
    ├── components.json    — component references
    └── content/           — sample content JSON
```

### `manifest.json` Schema

```json
{
  "id": "my-theme",
  "name": "Ocean Breeze",
  "type": "theme",
  "version": "1.2.0",
  "description": "A calm, blue-toned theme for professional sites",
  "author": "Jane Developer",
  "license": "GPL-3.0",
  "openpress_min_version": "1.0.0",
  "tags": ["blue", "professional", "clean"],
  "category": "themes",
  "entry": "theme.css",
  "settings": {
    "colors": {
      "type": "object",
      "properties": {
        "primary": { "type": "string", "default": "#1e40af" },
        "accent": { "type": "string", "default": "#3b82f6" }
      }
    }
  }
}
```

---

## Contribution Workflow

### For Open-Source Contributors

```
1. Fork OpenPress repo
2. Create item in /marketplace-contributions/
   ├── themes/my-theme/
   ├── plugins/my-plugin/
   └── components/my-component/
3. Open PR with manifest.json + bundle
4. CI validates:
   - manifest.json schema ✓
   - bundle integrity (hash match) ✓
   - no malicious code (basic scan) ✓
   - compatibility check ✓
5. Curator reviews PR
6. On merge: auto-publish to marketplace
```

### For Third-Party Authors (no repo access)

```
1. Register author profile on openpress.pages.dev
2. Build item locally using OpenPress CLI (future)
3. Package as .zip with manifest.json
4. Upload via Admin → Author Dashboard
5. Item enters "pending" status
6. Curator reviews:
   - Code quality
   - Security scan
   - Compatibility
   - Screenshots accuracy
7. Approved → published to marketplace
8. Users can browse, install, purchase
```

### Update Process

```
1. Author uploads new version (.zip)
2. New entry in marketplace_versions
3. Previous versions preserved
4. Installed users see "Update available" notification
5. User clicks "Update" → downloads new version
6. Plugin/component hot-reloads, theme updates CSS vars
7. Auto-rollback if post-update validation fails
```

---

## Payment & Revenue Model

### Platform Fee Structure

| Item Price | Platform Fee | Author Gets |
|-----------|-------------|-------------|
| Free | $0 | 100% |
| $1–$49 | 15% | 85% |
| $50–$199 | 12% | 88% |
| $200+ | 10% | 90% |

**Rationale**: Lower fees on premium items incentivize high-quality work. Free items cost nothing to list.

### Payment Flow

```
Buyer clicks "Purchase"
  → Creates order via existing /checkout/create-session
  → Stripe Checkout processes payment
  → Webhook confirms payment
  → marketplace_purchases record created
  → License key generated (for paid items)
  → Item auto-installed on buyer's instance
  → Author earnings recorded (not paid yet)
  → Author requests payout when balance > $25
  → Admin processes payout (Stripe Connect transfer)
```

### Free Items

```
Buyer clicks "Install"
  → No payment required
  → marketplace_installed record created
  → Item files fetched from R2
  → Installed locally
```

---

## Frontend Pages

### Public Store Pages

| Page | Route | Description |
|------|-------|-------------|
| Marketplace Home | `/marketplace` | Featured items, categories, search |
| Browse by Type | `/marketplace/themes`, `/plugins`, `/components` | Filtered listings |
| Item Detail | `/marketplace/:type/:slug` | Screenshots, description, reviews, install |
| Author Profile | `/marketplace/author/:id` | Author bio, items, ratings |
| My Purchases | `/marketplace/purchases` | Purchase history, license keys |

### Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Author Dashboard | `/admin/marketplace/author` | Sales, earnings, submit items |
| My Items | `/admin/marketplace/author/items` | Manage submissions |
| Submission Review | `/admin/marketplace/reviews` | Curator queue (admin/editor) |
| All Items | `/admin/marketplace/items` | Admin management |
| Categories | `/admin/marketplace/categories` | Category CRUD |
| Payouts | `/admin/marketplace/payouts` | Process payout requests |
| Settings | `/admin/marketplace/settings` | Fees, policies, featured |
| Installed | `/admin/marketplace/installed` | Local install management |

---

## Security Considerations

### Bundle Validation

1. **Hash verification**: SHA-256 of every bundle stored and verified on download
2. **Size limits**: 10MB for themes, 5MB for plugins, 2MB for components, 50MB for starter kits
3. **File whitelist**: Only allowed extensions (`.css`, `.js`, `.html`, `.json`, `.png`, `.jpg`, `.svg`, `.woff2`)
4. **Code scanning**: Basic regex scan for `eval()`, `fetch()`, `import()`, `require()` in plugin JS
5. **Sandboxed execution**: Plugins run in an isolated scope, no access to env vars or direct DB

### Plugin Isolation

```typescript
// Plugins execute in a sandboxed context
const sandboxedPlugin = new Function(
  'exports', 'require', 'module', '__filename', '__dirname',
  `'use strict'; ${pluginCode}`
);

// No access to: process, env, fetch, WebSocket, Worker
// Allowed: DOM manipulation, PluginRegistry hooks, localStorage
```

### Review Process

- Every paid item requires curator approval before publishing
- Free items can auto-publish but get flagged for review
- Security scan runs automatically on every upload
- Authors with 5+ approved items get "trusted" status (faster reviews)

---

## Implementation Phases

### Phase 28: Marketplace Foundation
- Schema (017_marketplace.sql)
- API: public browse, categories, search
- Frontend: marketplace home, browse pages, item detail
- Bundle upload to R2, manifest validation

### Phase 29: Author System & Submissions
- Author profile registration
- Item submission flow
- Version management
- Curator review queue
- Admin review pages

### Phase 30: Installation & Updates
- Install/uninstall from marketplace
- Local installation tracking
- Update checking and notification
- Auto-update toggle
- Plugin activation/deactivation

### Phase 31: Payments & Licensing
- Purchase flow (integrate with existing Stripe)
- License key generation
- Purchase history
- Revenue tracking
- Payout requests

### Phase 32: Reviews & Community
- Star rating system
- Written reviews
- Helpful votes
- Author ratings
- Review moderation

### Phase 33: Advanced Features
- Starter kits (bundled items)
- Theme live preview (iframe)
- Plugin settings UI (auto-generated from config schema)
- Marketplace search with filters
- Analytics dashboard for authors
- CLI tool for packaging items

---

## Open Questions

1. **Multi-instance vs single**: Should each OpenPress instance have its own marketplace, or should all instances share one global registry? Current plan: single shared registry (same D1/R2) with local install tracking.

2. **Code review automation**: How deep should automated security scanning go? Basic regex scan for Phase 28, consider AST analysis later.

3. **Plugin API surface**: What hooks should plugins have access to? Need to define a stable plugin API contract.

4. **Theme live preview**: iframe sandbox with full CSS isolation, or simple screenshot carousel? iframe is better but more complex.

5. **Offline marketplace**: Should items be installable without internet (bundle cached locally)? Probably not — Cloudflare Workers require connectivity.

6. **Migration from existing components**: Should the current `reusable_components` table be migrated into the marketplace, or kept separate? Recommend: keep separate — marketplace items are distributed/curated, local components are custom.

---

## File Structure (New Files)

```
functions/api/lib/marketplace.ts     — API routes
schema/017_marketplace.sql           — Database schema
src/routes/MarketplaceHome.tsx       — Public storefront
src/routes/MarketplaceBrowse.tsx     — Browse by type
src/routes/MarketplaceItem.tsx       — Item detail page
src/routes/admin/MarketplaceAuthor.tsx  — Author dashboard
src/routes/admin/MarketplaceReviews.tsx — Curator queue
src/routes/admin/MarketplaceAdmin.tsx   — Admin management
src/routes/admin/MarketplaceInstalled.tsx — Installed items
src/lib/marketplace/validator.ts     — Bundle validation
src/lib/marketplace/installer.ts     — Install/uninstall logic
src/lib/marketplace/updater.ts       — Update checking
src/components/marketplace/          — Shared UI components
```
