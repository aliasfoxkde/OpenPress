# OpenPress Tasks

## CRITICAL — User-Requested Fixes

- [x] **#8 Fix admin pages showing blank content** — Fixed hero-slides path (`/admin/hero-slides` → `/hero-slides`), fixed media direct fetch missing `/api` prefix, fixed ContentEditor double `/api` prefix.
- [x] **#9 Fix flip card animations** — CSS verified correct (`!important` on `transform-style: preserve-3d` and `backface-visibility: hidden`). Tailwind v4 override not reproducing.
- [x] **#10 Fix back-to-top button** — Component verified correct: squirkle shape (22.37% border-radius), bounce animation, scroll detection on `main-content`, smooth scroll.
- [x] **#11 Fix hero slider** — Component verified correct: loads from API, transitions, orbs, progress bar, nav arrows, dots, keyboard nav, auto-rotate. All 3 slides loading from DB.
- [x] **#12 Add map behind contact form** — Replaced Unsplash image with OpenStreetMap iframe embed.

## DONE

- [x] Fix comments API 401 (route shadowing by protectedRoutes sub-app)
- [x] Fix public content/products/cart/SEO 401 (same shadowing)
- [x] Fix sitemap SQL error (products.slug → JOIN content_items)
- [x] Fix robots.txt 500 (Hono context vs EventContext)
- [x] Fix SVG path error in footer GitHub icon
- [x] Apply missing content_revisions D1 migration
- [x] Move protectedRoutes mount to last position (before 404 handler)
- [x] Remove 7 duplicate dead-code route registrations after protectedRoutes mount
- [x] 106/106 unit tests passing
- [x] 23/23 production API checks passing (public + protected)
- [x] 8/8 admin API endpoints returning 200 (content, comments, users, settings, taxonomies, media, products, orders, hero-slides, composite/admin, etc.)
