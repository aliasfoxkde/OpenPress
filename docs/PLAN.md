# OpenPress - Project Plan

**Version**: 0.1.0
**Last Updated**: 2026-03-29
**Status**: Active Development

---

## Vision

OpenPress is a reimagining of WordPress as an open-source, edge-native web platform built on Cloudflare's global network. It combines a modern React frontend with serverless edge functions, SQLite at the edge via D1, R2 media storage, and Workers AI integration — all within Cloudflare's free tier ($0 cost).

## Architecture

```
Browser (React SPA)  →  Cloudflare Pages Functions (Hono)  →  D1 + R2 + KV + Workers AI
                                               ↕
                                     Plugin/Theme Runtime (JS Hooks)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vite 6 + React 19 + TanStack Router v1.120 | CSR-first SPA |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| State | Zustand v5 | Client state management |
| API | Hono v4 on Cloudflare Pages Functions | Edge API routes |
| Database | Cloudflare D1 (SQLite at edge) | Persistent storage |
| Media | Cloudflare R2 | Object storage (zero egress) |
| Cache | Cloudflare KV | Sub-ms key-value reads |
| AI | Cloudflare Workers AI | Content generation, embeddings |
| Auth | JWT (jose) + SHA-256 | Stateless edge authentication |
| Testing | Vitest 3 + happy-dom | Unit/integration tests |

---

## Implementation Phases

### Phase 1: Foundation
- Project scaffolding (Vite, React, TanStack Router, Tailwind)
- Cloudflare Pages Functions API with Hono
- D1 database schema (12 tables)
- Shared TypeScript types
- Vitest testing framework
- Documentation structure
- Initial deployment to Cloudflare Pages

### Phase 2: Core API
- Content CRUD API endpoints (pages, posts, custom types)
- JWT authentication system (register, login, refresh)
- Media upload API (R2-backed)
- Taxonomy and metadata API
- Settings API with KV cache

### Phase 3: Admin UI
- Frontend layout and navigation
- Login/register/profile flow
- Admin dashboard with live stats
- Block-based content editor
- Media manager with drag-drop upload
- Settings management

### Phase 4: Extensibility
- Plugin system (WordPress-inspired hooks/filters/actions)
- Theme system (CSS variable injection, component registry)

### Phase 5: PWA
- Service worker (cache-first static, network-first API)
- Web app manifest
- Offline support

### Phase 6: E-Commerce
- Products, variants, cart, orders schema
- Product CRUD API (admin + public)
- Shopping cart (session-based)
- Order creation with line items
- Schema migrated to D1

### Phase 7: AI Integration
- Workers AI endpoints (generate, summarize, suggest, translate, embed)
- AI admin page with tabbed interface
- Content suggestions (titles, excerpts, SEO meta, tags)
- Translation support (10 languages)
- Text embeddings for semantic search

### Phase 8: Public Storefront
- Product catalog page with price formatting
- Product detail page with variants and add-to-cart
- Blog listing with pagination
- Single post page with block rendering
- Navigation bar with Shop/Blog links

### Phase 9: Documentation & Polish
- Updated PLAN.md, TASKS.md, PROGRESS.md
- README with setup instructions

---

## Key Decisions

1. **CSR-first over SSR** — Cloudflare Pages Functions serve the SPA, API runs at edge
2. **JWT over Durable Objects** — Stateless auth, no server-side sessions, $0 cost
3. **Single package, not monorepo** — Cloudflare Pages Functions requires `functions/` at root
4. **Hono over itty-router** — Richer middleware ecosystem, better TypeScript support
5. **Workers AI for free** — Cloudflare provides free tier AI inference
6. **No Durable Objects** — Budget constraint, $0 cost requirement

---

## Deployment

- **Platform**: Cloudflare Pages
- **URL**: https://openpress.pages.dev
- **Database**: D1 (`openpress-db`, ID: `4f17765f-643b-4065-8ecc-74f9da77a8e9`)
- **Media**: R2 bucket (`openpress-media`)
- **Cache**: KV namespace (ID: `4ee12a2365fc48fc98c720b05b80447f`)
- **Deploy command**: `pnpm build && npx wrangler pages deploy dist --project-name=openpress`

---

## Constraints

- **$0 budget** — Everything on Cloudflare free tier
- **No Durable Objects** — Use JWT for auth, KV for caching
- **Edge-only** — No persistent server processes
- **SQLite at edge** — D1 limitations (no full-text search, limited joins)
