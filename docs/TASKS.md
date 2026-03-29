# OpenPress - Task List

**Version**: 2.0.0
**Last Updated**: 2026-03-29

---

## Task Status

- [x] Completed
- [ ] Pending
- [~] In Progress

---

## Phases 1-9 [COMPLETED]

All original phases (Foundation, Core API, Admin UI, Extensibility, PWA, E-Commerce, AI, Storefront, Docs) are complete. See PROGRESS.md for details.

---

## Phase 10: WYSIWYG Block Editor [IN PROGRESS]

Replace textarea-based block editor with a proper WYSIWYG rich-text editor.

- [x] 10.1 Install BlockNote (`@blocknote/core`, `@blocknote/react`) and TipTap dependencies
- [x] 10.2 Create `RichTextEditor` component wrapping BlockNoteView
- [x] 10.3 Configure BlockNote with default UI extensions (Image, CodeBlock, Table, etc.)
- [x] 10.4 Add slash menu for block insertion (/, heading, image, code, quote, list, table)
- [x] 10.5 Add inline formatting bubble menu (bold, italic, link, strikethrough, inline code)
- [x] 10.6 Add block drag-and-drop reordering via BlockNote built-in DnD
- [x] 10.7 Map BlockNote JSON output to content save API format
- [x] 10.8 Add block type switching (paragraph -> heading -> bullet list)
- [x] 10.9 Add image block with R2 media upload integration
- [x] 10.10 Add code block with language selector
- [x] 10.11 Add table block support (insert, add/delete rows/columns)
- [x] 10.12 Add blockquote block with styling
- [x] 10.13 Add horizontal rule / separator block
- [x] 10.14 Replace old BlockEditor component in ContentEditor page
- [x] 10.15 Update BlogPost public page renderer to handle BlockNote JSON format
- [ ] 10.16 Add "source code" view toggle to see/edit raw HTML
- [ ] 10.17 Add keyboard shortcuts (Ctrl+B bold, Ctrl+I italic, Ctrl+K link, Ctrl+S save)

---

## Phase 11: Content Versioning & Autosave [IN PROGRESS]

Full revision history with diff view, restore, and automatic saving.

- [x] 11.1 Create `content_revisions` D1 table (id, content_id, title, blocks_snapshot, author_id, revision_number, created_at)
- [x] 11.2 Add revision save hook (snapshot before every content update)
- [x] 11.3 Add revision list API endpoint (GET /api/revisions?contentId=...)
- [x] 11.4 Add single revision API endpoint (GET /api/revisions/:id)
- [x] 11.6 Add revision restore API endpoint (POST /api/revisions/:id/restore)
- [x] 11.11 Add revision count limit per content item (configurable, default 50, prune oldest)
- [ ] 11.5 Add revision diff API endpoint (GET /api/content/:slug/revisions/:id1/diff/:id2)
- [ ] 11.7 Add client-side autosave (debounced 30s timer during editing, saves draft to D1)
- [ ] 11.8 Build RevisionHistory sidebar panel in ContentEditor
- [ ] 11.9 Build RevisionDiff viewer (unified diff or side-by-side comparison)
- [ ] 11.10 Add "Restore this revision" button on each revision entry
- [ ] 11.12 Show revision count badge in content list table

---

## Phase 12: Role-Based Access Control (RBAC) [IN PROGRESS]

WordPress-like role system with granular capabilities.

- [x] 12.1 Add `role` column to users table (values: admin, editor, author, contributor, subscriber)
- [x] 12.2 Define capability map: admin (all), editor (publish_any, edit_any, delete_any, manage_media), author (publish_own, edit_own, upload_media), contributor (submit_draft, edit_own), subscriber (read)
- [x] 12.3 Create `requireCapability(cap)` Hono middleware for route protection
- [x] 12.4 Apply capability checks to all API routes (content CRUD, media, settings, users, products, orders)
- [x] 12.5 Add user management API endpoints (GET /api/users, PUT /api/users/:id/role, DELETE /api/users/:id)
- [x] 12.6 Build AdminUsers page (user list table, role dropdown, delete button)
- [x] 12.7 Add "Pending Review" workflow (contributors submit, editors review/publish)
- [x] 12.8 Add author_name display on public blog posts
- [x] 12.9 Restrict admin navigation items based on current user role
- [x] 12.10 Add "My Content" filter (show only current user's content for authors/contributors)
- [ ] 12.11 Add user profile page (name, email, password change, avatar)

---

## Phase 13: Security Hardening [IN PROGRESS]

Fix all critical security vulnerabilities from audit.

- [x] 13.1 Parameterize all SQL queries with validated inputs and allowlisted columns
- [x] 13.2 Move JWT secret to env var (getJwtSecret with fallback)
- [x] 13.3 Add rate limiting middleware (KV-based, per-IP)
- [x] 13.4 Add security headers middleware (CSP, X-Frame-Options, X-Content-Type-Options, etc.)
- [x] 13.5 Restrict CORS configuration (allowlisted origins, no wildcard)
- [x] 13.6 Add file upload validation (type whitelist, size limits, filename sanitization)
- [x] 13.7 Upgrade password hashing from SHA-256 to PBKDF2 (100k iterations)
- [x] 13.8 Add email format validation on registration
- [x] 13.9 Add password strength validation (uppercase, lowercase, number required)
- [ ] 13.10 Add CSRF protection for state-changing requests
- [ ] 13.11 Add request body size limits (1MB for JSON, 10MB for file uploads)
- [ ] 13.12 Add timing-safe string comparison for token verification
- [ ] 13.13 Add security-focused integration tests (SQL injection attempts, XSS payloads, auth bypass)

---

## Phase 14: Stripe Payment Integration [IN PROGRESS]

Full checkout flow from cart to payment confirmation.

- [x] 14.1 Add Stripe env vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET) to wrangler.toml
- [x] 14.2 Create checkout session endpoint (POST /api/checkout/create)
- [x] 14.3 Create Stripe webhook handler (POST /api/webhooks/stripe) with HMAC verification
- [x] 14.4 Handle checkout.session.completed event (mark order as paid)
- [x] 14.5 Handle payment_intent.payment_failed event
- [x] 14.6 Add stripe_session_id and stripe_payment_id columns to orders table
- [x] 14.7 Build Checkout page (cart review -> Stripe redirect)
- [x] 14.8 Build Order Success page (confirmation with order details)
- [ ] 14.9 Build Order Cancel page (return to cart)
- [x] 14.10 Add order receipt endpoint (GET /api/orders/:id/receipt)
- [x] 14.11 Add checkout routes to TanStack Router

---

## Phase 15: SEO & Content Discovery [IN PROGRESS]

Essential SEO tools and full-text search.

- [x] 15.1 Create XML sitemap endpoint (GET /api/seo/sitemap.xml) listing all published content
- [x] 15.2 Create RSS 2.0 feed endpoint (GET /api/seo/feed.xml) with latest 20 posts
- [x] 15.3 Add Open Graph meta tags component (og:title, og:description, og:image, og:url, og:type)
- [x] 15.4 Add Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image)
- [x] 15.5 Add canonical URL to all public pages
- [ ] 15.6 Add meta description field to content items (D1 column + API + editor UI)
- [x] 15.7 Create robots.txt endpoint (GET /api/seo/robots.txt)
- [ ] 15.8 Build SEO preview panel in ContentEditor (social card preview with og:image)
- [ ] 15.9 Create FTS5 virtual table for content search (title, content, excerpt)
- [x] 15.10 Add search API endpoint (GET /api/seo/search?q=...) with relevance ranking
- [x] 15.11 Build search UI component (global search bar in header with ⌘K shortcut)
- [ ] 15.12 Add JSON-LD structured data to public pages (Article, Product, BreadcrumbList schemas)

---

## Phase 16: Multi-Site / Multi-Tenant [PENDING]

Host multiple independent sites on a single OpenPress instance.

- [ ] 16.1 Create `tenants` D1 table (id, name, domain, owner_id, plan, settings_json, status, created_at, updated_at)
- [ ] 16.2 Add `tenant_id` column to all existing tables (content_items, users, media, products, orders, etc.)
- [ ] 16.3 Add indexes on tenant_id for all tables
- [ ] 16.4 Write schema migration (003_multitenant.sql)
- [ ] 16.5 Create tenant resolution middleware (hostname-based: {tenant}.openpress.pages.dev)
- [ ] 16.6 Namespace R2 keys with tenant_id prefix ({tenantId}/media/{file})
- [ ] 16.7 Namespace KV keys with tenant_id prefix ({tenantId}:cache:{key})
- [ ] 16.8 Build site management API (POST /api/sites, GET /api/sites, DELETE /api/sites/:id)
- [ ] 16.9 Build site creation form (name, subdomain, plan selection)
- [ ] 16.10 Build site list/switcher UI for platform admins
- [ ] 16.11 Add tenant isolation to all existing queries (WHERE tenant_id = ?)
- [ ] 16.12 Add site-specific settings override (name, description, logo, theme, language)
- [ ] 16.13 Add custom domain support (CNAME verification endpoint)
- [ ] 16.14 Build site dashboard (overview, traffic, storage usage)
- [ ] 16.15 Add plan-based limits (content items, media storage, products)

---

## Phase 17: Visual Page Builder [PENDING]

Drag-and-drop visual page building (Webflow-like).

- [ ] 17.1 Install @craftjs/core for page builder framework
- [ ] 17.2 Create component registry (Hero, Features, CTA, Testimonials, Pricing, FAQ, Gallery, Footer, Header, Spacer)
- [ ] 17.3 Define component schemas with configurable props (text, image, colors, spacing, alignment)
- [ ] 17.4 Build canvas component with drop zones and visual grid
- [ ] 17.5 Build component tree sidebar (hierarchical view of placed components)
- [ ] 17.6 Build property editor sidebar (form inputs for selected component props)
- [ ] 17.7 Serialize component tree to JSON for D1 storage
- [ ] 17.8 Deserialize and render stored layouts on public pages
- [ ] 17.9 Add responsive preview toggle (desktop, tablet, mobile viewports)
- [ ] 17.10 Add template library (5 starter page templates: Landing, Blog, Store, Portfolio, About)
- [ ] 17.11 Add page builder route (/admin/pages/new, /admin/pages/:id/edit) and navigation
- [ ] 17.12 Add undo/redo for page builder operations
- [ ] 17.13 Add "Save as Template" functionality
- [ ] 17.14 Add section-level edit mode (click section to edit inline)
- [ ] 17.15 Add global style editor (site-wide fonts, colors, spacing)

---

## Phase 18: Content Features [PENDING]

Essential content management features to match WordPress capabilities.

- [ ] 18.1 Add scheduled publishing (Workers Cron Trigger checks for content with published_at <= now)
- [ ] 18.2 Add featured image selector to content editor (media library picker)
- [ ] 18.3 Create comments D1 table (id, content_id, author_name, author_email, body, status, parent_id, created_at)
- [ ] 18.4 Add comments API (POST /api/content/:slug/comments, GET /api/comments for admin)
- [ ] 18.5 Build comment moderation UI in admin (approve/reply/spam/delete)
- [ ] 18.6 Add custom post types (dynamic content types with custom fields via D1)
- [ ] 18.7 Build custom post type manager UI (/admin/types)
- [ ] 18.8 Add bulk actions to content list (checkbox select, bulk delete, bulk status change)
- [ ] 18.9 Add quick edit to content list (inline edit title/status without full editor)
- [ ] 18.10 Add tag input component with autocomplete
- [ ] 18.11 Add category tree management UI (nested categories)
- [ ] 18.12 Add content preview (generate shareable preview link for unpublished drafts)
- [ ] 18.13 Add trash/restore with 30-day auto-cleanup (Workers Cron)
- [ ] 18.14 Add content import/export (JSON format, WordPress XML import)
- [ ] 18.15 Add sticky posts (pin to top of blog listing)
- [ ] 18.16 Add password-protected posts
- [ ] 18.17 Add page templates (full-width, sidebar, landing page layouts)

---

## Phase 19: Developer Platform [PENDING]

API completeness, extensibility, and developer experience.

- [ ] 19.1 Create OpenAPI 3.0 specification for all endpoints (YAML file)
- [ ] 19.2 Add Swagger UI route (/api/docs) for interactive API documentation
- [ ] 19.3 Add API versioning (all routes under /api/v1/)
- [ ] 19.4 Build webhook system (webhooks table, event subscriptions, delivery with retry)
- [ ] 19.5 Add webhook management UI (/admin/webhooks)
- [ ] 19.6 Add shortcode parser (parse [gallery ids="1,2,3"] syntax in content blocks)
- [ ] 19.7 Expand plugin API (register routes, add admin pages, register hooks, add shortcodes)
- [ ] 19.8 Build plugin marketplace UI (/admin/plugins with install/uninstall/activate)
- [ ] 19.9 Build theme selector UI (/admin/appearance with live preview)
- [ ] 19.10 Build analytics dashboard (Cloudflare Analytics API integration, page views, top pages)
- [ ] 19.11 Add email notification system (Cloudflare Email Workers for welcome, order confirm, comments)
- [ ] 19.12 Add settings import/export (JSON config migration between sites)
- [ ] 19.13 Add REST API discovery endpoint (GET /api with links to all resources)
- [ ] 19.14 Add API key management for external access (separate from JWT auth)

---

## Phase 20: Performance & Polish [PENDING]

Edge optimization, UI polish, and production readiness.

- [ ] 20.1 Implement KV cache for published content (stale-while-revalidate, 5-min TTL)
- [ ] 20.2 Add cache purging on content/media/settings updates
- [ ] 20.3 Add lazy loading for images (native loading=lazy + intersection observer for below-fold)
- [ ] 20.4 Optimize bundle size (route-based code splitting, tree shaking)
- [ ] 20.5 Add loading skeletons to all pages (content list, product list, blog list)
- [ ] 20.6 Add error boundaries to all route components
- [ ] 20.7 Build proper 404 Not Found page with navigation links
- [ ] 20.8 Improve mobile responsiveness across all admin pages
- [ ] 20.9 Add keyboard shortcuts panel in admin (Ctrl+K command palette)
- [ ] 20.10 Add dark mode support (respect prefers-color-scheme, add toggle)
- [ ] 20.11 Add toast notification component for success/error feedback
- [ ] 20.12 Add confirm dialog component (replace all native confirm() calls)
- [ ] 20.13 Increase test coverage to 80%+ for API routes
- [ ] 20.14 Add React component tests for critical UI components
- [ ] 20.15 Add E2E smoke tests for core user flows (register, login, create content, publish)
- [ ] 20.16 Add Lighthouse CI audit (performance, accessibility, SEO scores)

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

**Execution Order**: 13 -> 10 -> 11 -> 12 -> 15 -> 14 -> 18 -> 20 -> 16 -> 17 -> 19

---

## Progress Summary

- **Original Phases (1-9)**: Complete
- **Expansion Phases (10-20)**: 11 phases, ~170 tasks
- **Current Priority**: Phase 13 (Security Hardening) - 9/13 done
- **Tests**: 20 passing
- **API Routes**: 30+ endpoints
- **Database Tables**: 17
