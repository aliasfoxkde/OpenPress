# OpenPress - Comprehensive Expansion Plan

**Version**: 2.0.0
**Last Updated**: 2026-03-29
**Status**: Active Development
**Based On**: Full audit + WordPress feature research (405 features) + modern CMS technical research

---

## Current State Summary

### What Exists (Phases 1-9)
- SPA frontend (React 19, TanStack Router, Tailwind CSS v4, Zustand)
- Edge API (Hono on Cloudflare Pages Functions)
- D1 database (17 tables), R2 media, KV cache
- JWT auth, content CRUD, media upload, taxonomies, settings
- Basic block editor (textarea-based, not WYSIWYG)
- E-commerce (products, cart, orders — no payments)
- Workers AI integration (generate, summarize, translate, embed)
- Plugin/theme system foundations
- PWA with service worker
- 20 passing tests, 5 test files

### Critical Gaps (from audit)
1. **No WYSIWYG editor** — blocks use raw `<textarea>`, not rich text
2. **No content versioning** — no revisions, no autosave, no diff
3. **No RBAC** — single admin role, no editor/author/contributor
4. **No payment integration** — cart/orders exist but no checkout flow
5. **No full-text search** — no search API
6. **No SEO tools** — no sitemap, no RSS, no Open Graph
7. **No multi-site** — single-tenant only
8. **No page builder** — no visual drag-and-drop layout
9. **No comment system** — no user interaction
10. **Security vulnerabilities** — SQL injection, weak hashing, no rate limiting, hardcoded secrets

---

## Expansion Phases

### Phase 10: WYSIWYG Block Editor
**Goal**: Replace textarea blocks with a proper visual editor

**Tasks**:
- [ ] 10.1 Install BlockNote (`@blocknote/core`, `@blocknote/react`)
- [ ] 10.2 Create TipTapBlockEditor component wrapping BlockNote
- [ ] 10.3 Map existing BlockType union to BlockNote custom block specs
- [ ] 10.4 Integrate slash menu for block insertion (/, heading, image, code, quote, list)
- [ ] 10.5 Add inline formatting toolbar (bold, italic, link, strikethrough, code)
- [ ] 10.6 Add block drag-and-drop reordering via built-in DnD
- [ ] 10.7 Wire BlockNote JSON output to content save API
- [ ] 10.8 Add block type switching (paragraph <-> heading <-> list)
- [ ] 10.9 Add image block with R2 upload integration
- [ ] 10.10 Add code block with language selector and syntax highlighting
- [ ] 10.11 Replace old BlockEditor component in ContentEditor
- [ ] 10.12 Update BlogPost block renderer to handle BlockNote JSON format

**Technical Approach**: BlockNote (TipTap/ProseMirror-based) provides Notion-like editing with built-in DnD, slash menu, and collaborative editing support.

---

### Phase 11: Content Versioning & Autosave
**Goal**: Full revision history with diff view and autosave

**Tasks**:
- [ ] 11.1 Create `content_revisions` D1 table (content_snapshot JSON, author_id, created_at)
- [ ] 11.2 Add revision save on every content update (before-save hook)
- [ ] 11.3 Add revision list endpoint (GET /api/content/:slug/revisions)
- [ ] 11.4 Add revision diff endpoint (GET /api/content/:slug/revisions/:id/diff)
- [ ] 11.5 Add revision restore endpoint (POST /api/content/:slug/revisions/:id/restore)
- [ ] 11.6 Add client-side autosave (debounced, every 30s during editing)
- [ ] 11.7 Build RevisionHistory UI component (sidebar panel in ContentEditor)
- [ ] 11.8 Build RevisionDiff viewer (side-by-side or unified diff)
- [ ] 11.9 Add "Restore this revision" button on each revision
- [ ] 11.10 Limit revisions per content item (configurable, default 50)

---

### Phase 12: Role-Based Access Control (RBAC)
**Goal**: WordPress-like role system (admin, editor, author, contributor, subscriber)

**Tasks**:
- [ ] 12.1 Add `role` column to users table (default: 'subscriber')
- [ ] 12.2 Define role capabilities map (admin=all, editor=publish+edit_others, author=publish_own, contributor=submit_draft, subscriber=read)
- [ ] 12.3 Create capability check middleware for Hono routes
- [ ] 12.4 Apply capability checks to all API routes (content, media, settings, users)
- [ ] 12.5 Add user management API (list users, update role, delete user)
- [ ] 12.6 Build AdminUsers page (user list, role assignment, delete)
- [ ] 12.7 Add "Pending Review" status workflow for contributors
- [ ] 12.8 Add author attribution to content (display author name on posts)
- [ ] 12.9 Restrict admin navigation based on role capabilities

---

### Phase 13: Security Hardening
**Goal**: Fix all critical security vulnerabilities from audit

**Tasks**:
- [ ] 13.1 Parameterize all SQL queries (eliminate string concatenation)
- [ ] 13.2 Move JWT secret to Cloudflare secret (wrangler secret put)
- [ ] 13.3 Add rate limiting middleware (KV-based, per-IP, per-endpoint)
- [ ] 13.4 Add input validation with Zod schemas on all endpoints
- [ ] 13.5 Add CORS configuration (restrict origins)
- [ ] 13.6 Add security headers middleware (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] 13.7 Add file upload validation (type whitelist, size limits, filename sanitization)
- [ ] 13.8 Improve password hashing (scrypt via Web Crypto API)
- [ ] 13.9 Add password strength validation on registration
- [ ] 13.10 Add CSRF protection for state-changing requests

---

### Phase 14: Stripe Payment Integration
**Goal**: Full checkout flow from cart to payment

**Tasks**:
- [ ] 14.1 Add Stripe env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] 14.2 Create checkout session endpoint (POST /api/checkout/create)
- [ ] 14.3 Create Stripe webhook handler (POST /api/webhooks/stripe)
- [ ] 14.4 Add webhook HMAC verification using Web Crypto API
- [ ] 14.5 Add stripe_session_id and stripe_payment_id to orders table
- [ ] 14.6 Handle checkout.session.completed event (mark order as paid)
- [ ] 14.7 Handle payment_intent.succeeded event
- [ ] 14.8 Build checkout flow UI (redirect to Stripe, success/cancel pages)
- [ ] 14.9 Build order confirmation page
- [ ] 14.10 Add order receipt email via Cloudflare Email Workers

---

### Phase 15: SEO & Content Discovery
**Goal**: Essential SEO tools for content visibility

**Tasks**:
- [ ] 15.1 Create XML sitemap endpoint (GET /sitemap.xml) with all published content
- [ ] 15.2 Create RSS feed endpoint (GET /feed.xml) with latest 20 posts
- [ ] 15.3 Add Open Graph meta tags to public pages (og:title, og:description, og:image, og:url)
- [ ] 15.4 Add Twitter Card meta tags
- [ ] 15.5 Add canonical URL to each page
- [ ] 15.6 Add meta description field to content items
- [ ] 15.7 Build robots.txt endpoint (GET /robots.txt)
- [ ] 15.8 Add SEO preview in ContentEditor (social card preview)
- [ ] 15.9 Implement D1 FTS5 full-text search (virtual table, search API)
- [ ] 15.10 Build search UI component (global search bar, results page)

---

### Phase 16: Multi-Site / Multi-Tenant
**Goal**: Host multiple sites on a single OpenPress instance

**Tasks**:
- [ ] 16.1 Create `tenants` table (id, name, domain, owner_id, plan, settings_json, created_at)
- [ ] 16.2 Add `tenant_id` column to all existing tables
- [ ] 16.3 Add indexes on tenant_id for all tables
- [ ] 16.4 Create tenant resolution middleware (hostname-based)
- [ ] 16.5 Namespace R2 keys with tenant_id prefix
- [ ] 16.6 Namespace KV keys with tenant_id prefix
- [ ] 16.7 Build site management API (create site, list sites, delete site)
- [ ] 16.8 Build site management UI (site list, create site form)
- [ ] 16.9 Add tenant isolation to all existing queries
- [ ] 16.10 Build site switching UI for platform admins
- [ ] 16.11 Add site-specific settings (name, description, logo, theme)
- [ ] 16.12 Add custom domain support (CNAME verification)

---

### Phase 17: Visual Page Builder
**Goal**: Drag-and-drop visual page building (Webflow-like)

**Tasks**:
- [ ] 17.1 Install @craftjs/core for page builder framework
- [ ] 17.2 Create component registry (Hero, Features, CTA, Testimonials, Footer, etc.)
- [ ] 17.3 Define component schemas with configurable props
- [ ] 17.4 Build canvas component with drop zones
- [ ] 17.5 Build component tree sidebar
- [ ] 17.6 Build property editor sidebar for selected component
- [ ] 17.7 Serialize component tree to JSON for storage
- [ ] 17.8 Render stored page layout on public pages
- [ ] 17.9 Add responsive preview (desktop, tablet, mobile)
- [ ] 17.10 Add template library (starter page templates)
- [ ] 17.11 Add page builder route and admin navigation
- [ ] 17.12 Add undo/redo for page builder operations

---

### Phase 18: Content Features
**Goal**: Essential content management features

**Tasks**:
- [ ] 18.1 Add scheduled publishing (cron-like check via Workers Cron Triggers)
- [ ] 18.2 Add featured image support to content items
- [ ] 18.3 Add comment system (comments table, API, moderation UI)
- [ ] 18.4 Add custom post types (dynamic content types with custom fields)
- [ ] 18.5 Add bulk actions on content list (bulk delete, bulk status change)
- [ ] 18.6 Add content categories and tags UI (tag input, category tree)
- [ ] 18.7 Add content preview (shareable preview link for drafts)
- [ ] 18.8 Add trash/restore with 30-day retention
- [ ] 18.9 Add content import/export (JSON format)
- [ ] 18.10 Add sticky posts (pin to top of archive)

---

### Phase 19: Developer Platform
**Goal**: API completeness and developer experience

**Tasks**:
- [ ] 19.1 Create OpenAPI 3.0 spec for all endpoints
- [ ] 19.2 Add API versioning (v1 prefix on all routes)
- [ ] 19.3 Build webhook system (event subscriptions, delivery, retry)
- [ ] 19.4 Add shortcode system (parse [shortcode] syntax in content)
- [ ] 19.5 Expand plugin API (register routes, add admin pages, hooks)
- [ ] 19.6 Add plugin install/uninstall UI
- [ ] 19.7 Add theme selector UI with live preview
- [ ] 19.8 Build analytics dashboard (Cloudflare Analytics API integration)
- [ ] 19.9 Add email notification system (Cloudflare Email Workers)
- [ ] 19.10 Add settings import/export (JSON config migration)

---

### Phase 20: Performance & Polish
**Goal**: Edge optimization and production readiness

**Tasks**:
- [ ] 20.1 Implement KV cache for published content (stale-while-revalidate)
- [ ] 20.2 Add cache purging on content/media/settings update
- [ ] 20.3 Add lazy loading for images (native + intersection observer)
- [ ] 20.4 Optimize bundle size (code splitting, tree shaking)
- [ ] 20.5 Add loading skeletons to all pages
- [ ] 20.6 Add error boundaries to all route components
- [ ] 20.7 Add 404 page
- [ ] 20.8 Improve mobile responsiveness across all admin pages
- [ ] 20.9 Add keyboard shortcuts throughout admin
- [ ] 20.10 Increase test coverage to 80%+ for all modules

---

## Implementation Priority

| Priority | Phase | Impact | Effort |
|----------|-------|--------|--------|
| **P0** | 13: Security Hardening | Critical | Medium |
| **P1** | 10: WYSIWYG Editor | High | Medium |
| **P1** | 11: Content Versioning | High | Medium |
| **P1** | 12: RBAC | High | Medium |
| **P2** | 15: SEO & Search | High | Low |
| **P2** | 14: Stripe Payments | High | Medium |
| **P3** | 18: Content Features | Medium | Medium |
| **P3** | 20: Performance | Medium | Medium |
| **P4** | 16: Multi-Site | Medium | High |
| **P4** | 17: Page Builder | Medium | High |
| **P5** | 19: Developer Platform | Medium | High |

**Execution Order**: 13 → 10 → 11 → 12 → 15 → 14 → 18 → 20 → 16 → 17 → 19

---

## Success Metrics

- [ ] 100% parameterized queries (0 SQL injection vulnerabilities)
- [ ] WYSIWYG editor with 10+ block types and drag-and-drop
- [ ] Content versioning with diff view and one-click restore
- [ ] 5 user roles with granular capability checks
- [ ] Full Stripe checkout flow
- [ ] XML sitemap, RSS feed, Open Graph tags
- [ ] Full-text search across all content
- [ ] Multi-tenant site hosting
- [ ] Visual page builder with 12+ components
- [ ] 80%+ test coverage
- [ ] Sub-200ms API response time (KV cache hit)

---

## Research References

- `docs/WORDPRESS_FEATURE_RESEARCH.md` — 405 WordPress features cataloged with priorities
- `docs/TECHNICAL_RESEARCH.md` — Editor comparison, Cloudflare patterns, Stripe integration
