# OpenPress

A reimagining of WordPress for the modern web — edge-native, JS-first, Cloudflare-native, AI-ready, and open source.

**Live Demo**: [https://openpress.pages.dev](https://openpress.pages.dev)

---

## What is OpenPress?

OpenPress is a modern content management system and web application platform that runs entirely on Cloudflare's global edge network. It combines:

- **React 19 SPA** with TanStack Router for the frontend
- **Hono** edge functions for the API
- **D1 SQLite** at the edge for data
- **R2** for media storage (zero egress fees)
- **KV** for sub-millisecond caching
- **Workers AI** for content generation and translation

All on Cloudflare's **free tier** ($0 cost).

---

## Features

| Feature | Description |
|---------|-------------|
| Block Editor | Drag-and-drop content blocks (text, heading, image, quote, code, list) |
| Plugin System | WordPress-inspired hooks, filters, and actions in TypeScript |
| Theme System | CSS variable injection with component registry |
| JWT Auth | Stateless edge authentication (no Durable Objects) |
| Media Manager | R2-backed uploads with drag-drop |
| AI Assistant | Generate, summarize, suggest, translate content via Workers AI |
| E-Commerce | Products, variants, cart, orders |
| PWA | Service worker, offline support, installable |
| Public Storefront | Shop catalog, product detail, blog, single posts |
| Taxonomies | Categories, tags, custom taxonomies |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 6, React 19, TanStack Router v1.120, Tailwind CSS v4, Zustand v5 |
| API | Hono v4 on Cloudflare Pages Functions |
| Database | Cloudflare D1 (SQLite at edge) |
| Storage | Cloudflare R2 (S3-compatible, zero egress) |
| Cache | Cloudflare KV |
| AI | Cloudflare Workers AI |
| Auth | JWT (jose) + SHA-256 |
| Testing | Vitest 3 + happy-dom |

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare account (free tier works)

### Setup

```bash
# Clone
git clone https://github.com/aliasfoxkde/OpenPress.git
cd OpenPress

# Install dependencies
pnpm install

# Copy environment config
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with your Cloudflare resource IDs

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=openpress
```

### Database Setup

```bash
# Create D1 database
npx wrangler d1 create openpress-db

# Run migrations
npx wrangler d1 execute openpress-db --remote --file=./schema/001_initial.sql
npx wrangler d1 execute openpress-db --remote --file=./schema/002_ecommerce.sql

# Create R2 bucket
npx wrangler r2 bucket create openpress-media

# Create KV namespace
npx wrangler kv namespace create CACHE
```

Update `wrangler.toml` with the created resource IDs.

---

## Project Structure

```
OpenPress/
├── functions/              # Cloudflare Pages Functions (API)
│   └── api/
│       ├── [[route]].ts    # Main API entry point
│       └── lib/
│           ├── ai.ts       # Workers AI endpoints
│           ├── auth.ts     # JWT authentication
│           ├── content.ts  # Content CRUD
│           ├── media.ts    # R2 media uploads
│           ├── orders.ts   # Cart and orders
│           ├── products.ts # Product CRUD
│           ├── settings.ts # Key-value settings
│           ├── taxonomies.ts # Taxonomy management
│           └── types.ts    # Shared TypeScript types
├── schema/                 # D1 SQL migrations
│   ├── 001_initial.sql     # Core CMS tables
│   └── 002_ecommerce.sql   # E-commerce tables
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── lib/                # Utilities (api, plugins, themes, cn)
│   ├── routes/             # Page components
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── Blog.tsx        # Blog listing
│   │   ├── BlogPost.tsx    # Single post
│   │   ├── Storefront.tsx  # Product catalog
│   │   ├── ProductDetail.tsx # Product detail
│   │   └── ...
│   ├── stores/             # Zustand stores
│   └── router.tsx          # TanStack Router config
├── tests/                  # Vitest tests
├── public/                 # Static assets (sw.js, manifest.json)
└── docs/                   # Documentation
```

---

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/site` | Site info (cached) |
| GET | `/api/content` | Published content list |
| GET | `/api/content/:slug` | Single published content |
| GET | `/api/products` | Active product catalog |
| GET | `/api/products/:id` | Product detail with variants |
| * | `/api/cart/*` | Cart operations (session-based) |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |

### Protected (Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| * | `/api/content/*` | Content CRUD |
| * | `/api/media/*` | Media upload/management |
| * | `/api/taxonomies/*` | Taxonomy management |
| * | `/api/settings/*` | Settings management |
| * | `/api/products/*` | Product management |
| * | `/api/orders/*` | Order management |
| * | `/api/ai/*` | AI generate, summarize, suggest, translate, embed |

---

## License

MIT

---

This Application was Developed with TaskWizer AI technologies.
