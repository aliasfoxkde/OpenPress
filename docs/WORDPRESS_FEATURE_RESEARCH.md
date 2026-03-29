# WordPress Complete Feature Research

**Purpose:** Comprehensive feature inventory for planning OpenPress (WordPress replacement)
**Last Updated:** 2026-03-29
**Status:** Research Complete

---

## Methodology

This document catalogs every feature WordPress provides, organized by category, with priority ratings for building a modern CMS replacement. Priority ratings:

- **ESSENTIAL** -- Must-have for launch. Without this, it is not a viable CMS.
- **IMPORTANT** -- Expected by users. Missing features create immediate complaints.
- **NICE-TO-HAVE** -- Valuable for power users or specific use cases, not blocking.

---

## 1. Content Management

### 1.1 Block Editor (Gutenberg)

WordPress's block editor is the primary content creation interface since WP 5.0 (2018). It uses a block-based paradigm where every piece of content is an individual block.

**Core Block Types (90+ built-in):**

| Category | Blocks |
|----------|--------|
| **Text** | Paragraph, Heading (H1-H6), List (ordered/unordered), Quote, Pullquote, Classic (legacy freeform), Preformatted, Verse (poetry), Code |
| **Media** | Image, Gallery, Audio, Video, Cover (full-width image with overlay text), Media & Text (side-by-side), File (downloadable) |
| **Design** | Buttons, Columns (multi-column layout), Group (nested block container), Separator, Spacer, Page Break |
| **Widgets** | Shortcode, Archives, Calendar, Categories List, Latest Posts, RSS, Search, Tag Cloud |
| **Embeds** | YouTube, Vimeo, Twitter/X, Facebook, Instagram, Spotify, SoundCloud, Flickr, Reddit, TED, WordPress.tv, Imgur, SlideShare, Scribd, Pinterest, Tumblr, Kickstarter, Amazon, Dailymotion, Speaker Deck, VideoPress, WordPress, plus generic Embed (any URL) |
| **Theme/Structure** | Navigation, Site Logo, Site Title, Tagline, Post Title, Post Content, Post Excerpt, Post Date, Post Author, Post Featured Image, Post Categories, Post Tags, Post Comments, Query Loop (dynamic post listing), Template Part |
| **Formatting** | Code (syntax display), Custom HTML, Footnotes |
| **Layout** | Grid (CSS Grid-based, newer), Row |

**Block Editor Capabilities:**

| Feature | Description | Priority |
|---------|-------------|----------|
| Block transforms | Convert one block type to another (e.g., paragraph to heading) | IMPORTANT |
| Reusable blocks | Save a block or group of blocks, reuse across pages | ESSENTIAL |
| Block patterns | Pre-designed layouts insertable as starting points | IMPORTANT |
| Template editing | Create custom templates for specific post types | IMPORTANT |
| Full Site Editing (FSE) | Edit header, footer, sidebar, and all theme parts via blocks | IMPORTANT |
| Global Styles | Site-wide typography, colors, spacing via theme.json | IMPORTANT |
| Block Variations | Alternate versions of blocks (e.g., different gallery layouts) | NICE-TO-HAVE |
| Block locking | Lock blocks to prevent editing/moving | IMPORTANT |
| Drag-and-drop reordering | Move blocks by dragging within the editor | ESSENTIAL |
| Inline formatting toolbar | Bold, italic, link, strikethrough, inline code, etc. on selected text | ESSENTIAL |
| Code editor mode | Switch to raw HTML/shortcode editing | IMPORTANT |
| List view | Hierarchical view of all blocks in the document for navigation | IMPORTANT |
| Copy/paste blocks | Copy blocks between posts/pages | ESSENTIAL |
| Block grouping | Select multiple blocks and group into a container | IMPORTANT |
| Undo/redo | Full undo/redo history for block operations | ESSENTIAL |
| Block search | Search and insert blocks by name | ESSENTIAL |
| Keyboard shortcuts | Extensive keyboard navigation and formatting | IMPORTANT |

### 1.2 Revisions / Versioning

| Feature | Description | Priority |
|---------|-------------|----------|
| Post revisions | Unlimited revisions stored in database (configurable limit) | ESSENTIAL |
| Revision diff | Compare any two revisions side-by-side with highlighted differences | ESSENTIAL |
| Revision restore | Restore any previous revision with one click | ESSENTIAL |
| Autosave | Real-time auto-saving every 60 seconds during editing | ESSENTIAL |
| Revision author tracking | Each revision tagged with the user who made it | IMPORTANT |
| Revision metadata | Timestamp, author, and change summary per revision | IMPORTANT |

### 1.3 Publishing Controls

| Feature | Description | Priority |
|---------|-------------|----------|
| Draft/pending review/published | Content status workflow | ESSENTIAL |
| Scheduled publishing | Set future date/time for automatic publication | ESSENTIAL |
| Private posts | Visible only to administrators and editors | IMPORTANT |
| Password-protected posts | Require password to view content | IMPORTANT |
| Sticky posts | Pin posts to top of archive pages | NICE-TO-HAVE |
| Pending review workflow | Contributors submit, editors review and publish | IMPORTANT |
| Bulk editing | Edit status, author, categories for multiple posts at once | IMPORTANT |
| Quick edit | Inline editing of post metadata without full editor | IMPORTANT |
| Preview | Live preview of draft before publishing (new tab/inline) | ESSENTIAL |
| Trash/restore | Soft-delete with 30-day retention, one-click restore | ESSENTIAL |
| Permalink editing | Customize URL slug per post | ESSENTIAL |
| Pingback/trackback | Notify other sites when linking to them (legacy, rarely used now) | NICE-TO-HAVE |
| Excerpt management | Manual or auto-generated excerpts for archive displays | IMPORTANT |
| Featured image | Representative image for posts, used in archives/social | ESSENTIAL |
| Post formats | Aside, gallery, link, image, quote, status, video, audio, chat | NICE-TO-HAVE |

### 1.4 Custom Post Types (CPT)

| Feature | Description | Priority |
|---------|-------------|----------|
| Built-in types | Post, Page, Attachment, Revision, Navigation Menu, Custom CSS | ESSENTIAL |
| Custom types | Register any content type via `register_post_type()` | ESSENTIAL |
| Custom fields/meta boxes | Add arbitrary metadata fields to any content type | ESSENTIAL |
| Custom status | Beyond draft/pending/published (via code or plugins) | NICE-TO-HAVE |
| Archive pages | Automatic archive generation for custom types | IMPORTANT |
| Permalinks for CPTs | Custom URL structures per content type | IMPORTANT |
| REST API exposure | Custom types available via API automatically | IMPORTANT |
| Capability mapping | Assign edit/delete/publish capabilities per type | IMPORTANT |

### 1.5 Taxonomy System

| Feature | Description | Priority |
|---------|-------------|----------|
| Built-in taxonomies | Categories (hierarchical), Tags (flat) | ESSENTIAL |
| Custom taxonomies | Register any taxonomy and attach to any post type | ESSENTIAL |
| Hierarchical support | Categories with parent/child nesting | ESSENTIAL |
| Term meta | Metadata attached to taxonomy terms (since WP 4.4) | IMPORTANT |
| Term ordering | Plugins enable drag-and-drop term ordering | NICE-TO-HAVE |
| Term descriptions | Rich text descriptions for categories/tags | IMPORTANT |
| Term archives | Automatic archive pages at `/category/name/` | IMPORTANT |

---

## 2. WYSIWYG / Visual Editing

### 2.1 Rich Text Capabilities

| Feature | Description | Priority |
|---------|-------------|----------|
| Bold, italic, underline | Basic inline formatting | ESSENTIAL |
| Strikethrough | Text decoration | ESSENTIAL |
| Links (inline) | Create/edit links with URL, title, target | ESSENTIAL |
| Headings (H1-H6) | Block-level heading formatting | ESSENTIAL |
| Ordered/unordered lists | List formatting with nesting | ESSENTIAL |
| Blockquote | Styled quote blocks | ESSENTIAL |
| Inline code | Monospace code styling | IMPORTANT |
| Text color | Inline text color changes | IMPORTANT |
| Text alignment | Left, center, right, justify | ESSENTIAL |
| Superscript/subscript | Text positioning | NICE-TO-HAVE |
| Clear formatting | Remove all inline formatting | ESSENTIAL |
| Paste handling | Smart paste from external sources (strip/retain formatting) | IMPORTANT |

### 2.2 Block Editor UX

| Feature | Description | Priority |
|---------|-------------|----------|
| Block inserter | Searchable panel of all available blocks | ESSENTIAL |
| Block toolbar | Context-sensitive toolbar above each block | ESSENTIAL |
| Block settings sidebar | Configuration panel for selected block | ESSENTIAL |
| Drag-and-drop | Move blocks by mouse drag | ESSENTIAL |
| Multi-select | Select multiple blocks for bulk operations | IMPORTANT |
| Keyboard navigation | Full keyboard control of block selection/movement | IMPORTANT |
| Block grouping | Container blocks for layout organization | IMPORTANT |
| Columns/grid layout | Multi-column content layouts | ESSENTIAL |
| Responsive controls | Per-viewport visibility and sizing | IMPORTANT |
| Custom HTML block | Insert arbitrary HTML/CSS/JS | IMPORTANT |
| Shortcode block | Render WordPress shortcodes | IMPORTANT |
| Copy/move blocks | Duplicate or relocate blocks | ESSENTIAL |

---

## 3. Media Management

### 3.1 Media Library

| Feature | Description | Priority |
|---------|-------------|----------|
| Grid view | Thumbnail grid of all media items | ESSENTIAL |
| List view | Detailed table with metadata columns | ESSENTIAL |
| Filtering by type | Show only images, video, audio, documents | ESSENTIAL |
| Filtering by date | Filter by upload month/year | IMPORTANT |
| Search | Search by filename or title | ESSENTIAL |
| Bulk select | Select multiple items for bulk actions | ESSENTIAL |
| Drag-and-drop upload | Drop files directly into library | ESSENTIAL |
| Bulk upload | Upload multiple files simultaneously | ESSENTIAL |
| Progress indicator | Upload progress bar per file | ESSENTIAL |
| Attachment details | Title, caption, alt text, description per item | ESSENTIAL |

### 3.2 Image Editing

| Feature | Description | Priority |
|---------|-------------|----------|
| Crop | Select area and crop image | IMPORTANT |
| Rotate | Rotate 90 degrees CW/CCW | IMPORTANT |
| Flip | Flip horizontal/vertical | IMPORTANT |
| Scale | Resize to specific dimensions | IMPORTANT |
| Thumbnail regeneration | Regenerate all image sizes after changes | IMPORTANT |

### 3.3 Image Processing

| Feature | Description | Priority |
|---------|-------------|----------|
| Auto-thumbnail generation | Multiple sizes created on upload (thumb, medium, large, full) | ESSENTIAL |
| Custom image sizes | Themes/plugins register additional sizes | ESSENTIAL |
| Responsive images | Automatic srcset and sizes attributes | ESSENTIAL |
| WebP support | Upload and serve WebP format (WP 5.8+) | IMPORTANT |
| Lazy loading | Native `loading="lazy"` on images (WP 5.5+) | ESSENTIAL |
| Fetchpriority | Priority hint on LCP images (WP 6.3+) | IMPORTANT |
| Image optimization | Compression on upload (plugin territory) | NICE-TO-HAVE |

### 3.4 Media Organization

| Feature | Description | Priority |
|---------|-------------|----------|
| Alt text | Accessibility text per image | ESSENTIAL |
| Captions | Display captions on inserted images | ESSENTIAL |
| Descriptions | Extended text metadata on media items | IMPORTANT |
| Gallery block | Grid/carousel display of multiple images | ESSENTIAL |
| Audio player | Built-in audio playback | IMPORTANT |
| Video player | Built-in video playback | IMPORTANT |
| Document uploads | PDF, DOC, XLS, etc. with download links | IMPORTANT |
| oEmbed | Auto-embed from 30+ external providers by URL | IMPORTANT |
| Media folders | Folder-based organization (plugin territory, WP lacks natively) | NICE-TO-HAVE |

---

## 4. Multi-site / Network (WordPress Multisite)

### 4.1 Network Architecture

| Feature | Description | Priority |
|---------|-------------|----------|
| Single installation | Multiple sites from one WP install and one database | IMPORTANT |
| Subdomain structure | site1.example.com | NICE-TO-HAVE |
| Subdirectory structure | example.com/site1 | NICE-TO-HAVE |
| Domain mapping | Custom domain per subsite (built-in since WP 4.5) | NICE-TO-HAVE |
| Shared database | Prefixed tables per site in one MySQL database | NICE-TO-HAVE |
| Shared user table | Users shared across all sites with single login | NICE-TO-HAVE |

### 4.2 Network Administration

| Feature | Description | Priority |
|---------|-------------|----------|
| Super Admin role | Network-wide administrator above site admins | NICE-TO-HAVE |
| Site creation/deletion | Create, archive, spam-mark, delete subsites | NICE-TO-HAVE |
| Network dashboard | Central admin for all sites | NICE-TO-HAVE |
| Plugin management | Network-activate (all sites) or per-site activation | NICE-TO-HAVE |
| Theme management | Install once, enable per site | NICE-TO-HAVE |
| User management | Add/remove users across all sites | NICE-TO-HAVE |
| Upload quotas | Per-site upload space limits | NICE-TO-HAVE |
| Site-specific settings | Each site has independent settings | NICE-TO-HAVE |
| Network-wide updates | Update core/plugins/themes once for all sites | NICE-TO-HAVE |

**Priority Note:** Multisite is NICE-TO-HAVE for OpenPress launch. WordPress itself runs ~8% of installations as multisite. It is valuable for enterprise but not essential for a first release targeting individual site owners.

---

## 5. Site Deployment and Management

### 5.1 Updates and Installation

| Feature | Description | Priority |
|---------|-------------|----------|
| One-click core updates | Update WordPress from dashboard | ESSENTIAL |
| Auto-updates (minor) | Security/maintenance releases auto-apply | ESSENTIAL |
| Plugin installation | Install from repository or upload ZIP | ESSENTIAL |
| Plugin updates | Update plugins from dashboard | ESSENTIAL |
| Plugin auto-updates | Opt-in automatic plugin updates | IMPORTANT |
| Theme installation | Install from repository or upload ZIP | ESSENTIAL |
| Theme updates | Update themes from dashboard | IMPORTANT |

### 5.2 Theme System

| Feature | Description | Priority |
|---------|-------------|----------|
| Theme customizer | Live preview of theme changes (colors, fonts, layout) | ESSENTIAL |
| Custom CSS | Additional CSS without editing theme files | ESSENTIAL |
| Template hierarchy | Deterministic template selection for each page type | ESSENTIAL |
| Child themes | Override parent theme without modifying it | ESSENTIAL |
| Block themes (FSE) | Themes built entirely with blocks and theme.json | IMPORTANT |
| Classic themes | Traditional PHP-based themes | N/A for OpenPress |
| theme.json | Centralized theme configuration (colors, typography, spacing) | IMPORTANT |
| Template parts | Reusable header/footer/sidebar templates | ESSENTIAL |

### 5.3 Site Building

| Feature | Description | Priority |
|---------|-------------|----------|
| Navigation menus | Multi-level drag-and-drop menu builder | ESSENTIAL |
| Menu locations | Register multiple menu areas (header, footer, sidebar) | ESSENTIAL |
| Widgets | Content blocks in sidebars/footers (legacy + block widgets) | IMPORTANT |
| Block-based widget editor | Gutenberg-style editing for widget areas | IMPORTANT |
| Customizer | Live preview for site identity, colors, homepage, menus | ESSENTIAL |
| Site editor | Full visual editing of all theme templates | IMPORTANT |

### 5.4 Site Health and Maintenance

| Feature | Description | Priority |
|---------|-------------|----------|
| Site health check | Security and performance diagnostics | IMPORTANT |
| Import/export | Import/export content via WXR format | IMPORTANT |
| Database backup | Not built-in (plugin territory) | NICE-TO-HAVE |
| Privacy policy page | Auto-generated privacy policy template | NICE-TO-HAVE |
| Discussion settings | Comment moderation, avatar, pingback settings | IMPORTANT |

---

## 6. User Management

### 6.1 Roles and Capabilities

**Built-in Roles (6):**

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Super Admin** | Multisite network admin | All admin capabilities + network management |
| **Administrator** | Full site control | All capabilities for a single site |
| **Editor** | Content manager | Create/edit/delete ANY content, moderate comments |
| **Author** | Content creator | Create/edit/delete OWN content, upload files |
| **Contributor** | Draft writer | Write/edit OWN drafts, cannot publish or upload |
| **Subscriber** | Reader | Read posts, manage own profile only |

**Granular Capabilities (~70 built-in):**

| Area | Capabilities |
|------|-------------|
| Posts | `edit_posts`, `edit_others_posts`, `edit_private_posts`, `edit_published_posts`, `publish_posts`, `delete_posts`, `delete_others_posts`, `delete_private_posts`, `delete_published_posts`, `read_private_posts` |
| Pages | Same pattern as posts: `edit_pages`, `edit_others_pages`, `publish_pages`, `delete_pages`, etc. |
| Media | `upload_files` |
| Categories/Tags | `manage_categories` |
| Comments | `moderate_comments` |
| Users | `create_users`, `edit_users`, `delete_users`, `list_users`, `promote_users`, `remove_users` |
| Plugins | `activate_plugins`, `edit_plugins`, `install_plugins`, `update_plugins`, `delete_plugins` |
| Themes | `switch_themes`, `edit_themes`, `install_themes`, `update_themes`, `delete_themes` |
| Settings | `manage_options`, `edit_dashboard`, `customize`, `export`, `import` |

| Feature | Description | Priority |
|---------|-------------|----------|
| Custom roles | Create roles with specific capability sets | IMPORTANT |
| Custom capabilities | Add/remove individual capabilities | IMPORTANT |
| Capability checking | `current_user_can()` / `user_can()` for permission checks | ESSENTIAL |
| Role assignment per site | Different roles on different sites (multisite) | NICE-TO-HAVE |

### 6.2 User Features

| Feature | Description | Priority |
|---------|-------------|----------|
| User profiles | Avatar (Gravatar), bio, website, social links | ESSENTIAL |
| Author archives | Automatic `/author/name/` pages listing all posts | IMPORTANT |
| Registration settings | Open/closed/invite-only registration | IMPORTANT |
| Password reset | Email-based password recovery | ESSENTIAL |
| Email verification | Confirm email on registration (plugin territory) | IMPORTANT |
| Two-factor authentication | TOTP, SMS, hardware keys (plugin territory, being added to core) | IMPORTANT |
| Session management | View and destroy active sessions | IMPORTANT |
| Application passwords | Generate tokens for REST API access | IMPORTANT |
| User meta | Arbitrary metadata per user | ESSENTIAL |
| Gravatar integration | Globally recognized avatars | NICE-TO-HAVE |
| User search/filter | Admin user list with search and role filtering | ESSENTIAL |

---

## 7. SEO and Marketing

### 7.1 URL and Content Structure

| Feature | Description | Priority |
|---------|-------------|----------|
| Permalink structure | Configurable URL patterns (post name, date, category, custom) | ESSENTIAL |
| Slug editing | Per-post URL customization | ESSENTIAL |
| Category/tag URLs | `/category/name/`, `/tag/name/` | ESSENTIAL |
| URL rewriting | Full rewrite API for custom URL structures | IMPORTANT |
| Canonical URLs | Rel canonical on posts/pages | IMPORTANT |
| Redirect management | Plugin territory but critical for SEO | NICE-TO-HAVE |

### 7.2 Search Engine Integration

| Feature | Description | Priority |
|---------|-------------|----------|
| XML sitemap | Auto-generated at `/wp-sitemap.xml` (WP 5.5+) | ESSENTIAL |
| Robots.txt | Auto-generated with sensible defaults | ESSENTIAL |
| Meta title/description | Via SEO plugins (Yoast, Rank Math) -- not in core | ESSENTIAL (via plugin) |
| Open Graph tags | Via SEO plugins -- not in core | IMPORTANT (via plugin) |
| Schema.org markup | Via themes/plugins -- not in core | IMPORTANT (via plugin) |
| Breadcrumbs | Via SEO plugins or themes | IMPORTANT |

### 7.3 Content Distribution

| Feature | Description | Priority |
|---------|-------------|----------|
| RSS feeds | Auto-generated RSS 2.0, RSS 0.92, Atom feeds | IMPORTANT |
| RSS per category/tag | Individual feeds for each taxonomy term | NICE-TO-HAVE |
| Ping services | Notify aggregators on new content (e.g., Ping-O-Matic) | NICE-TO-HAVE |
| oEmbed | Both provider and consumer -- embed WP content elsewhere | IMPORTANT |
| REST API discovery | `</wp-json/>` link in HTML head | NICE-TO-HAVE |

### 7.4 Engagement

| Feature | Description | Priority |
|---------|-------------|----------|
| Comment system | Threaded comments with moderation | IMPORTANT |
| Comment moderation | Hold for review, keyword blacklist, link limit | IMPORTANT |
| Comment spam filtering | Akismet integration, manual spam/markham | IMPORTANT |
| Comment notifications | Email on new comments | IMPORTANT |
| Email subscriptions | Via plugins (Jetpack, Mailchimp, etc.) | NICE-TO-HAVE |
| Social sharing | Via plugins or block patterns | NICE-TO-HAVE |
| Gravatar on comments | User avatars from email hash | NICE-TO-HAVE |

---

## 8. E-commerce (WooCommerce Feature Set)

WooCommerce is the dominant WP e-commerce plugin (28% of all online stores). This section maps its full feature set.

### 8.1 Product Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Product types | Simple, variable, grouped, external/affiliate, downloadable, virtual | ESSENTIAL |
| Product variations | Size, color, style attributes with per-variation pricing/stock | ESSENTIAL |
| Product categories/tags | Hierarchical categories, flat tags | ESSENTIAL |
| Product attributes | Global and per-product custom attributes | IMPORTANT |
| Product images | Gallery with zoom, main image | ESSENTIAL |
| Product short/long description | Brief + extended content | ESSENTIAL |
| Sale pricing | Regular price, sale price, sale scheduling | ESSENTIAL |
| Featured products | Highlight specific products | IMPORTANT |
| Related products | Auto-suggest related items | IMPORTANT |
| Cross-sells/upsells | "You may also like" / "Frequently bought together" | IMPORTANT |
| Product reviews | Star ratings + text reviews from verified buyers | IMPORTANT |
| Product search | Search by name, SKU, description | ESSENTIAL |

### 8.2 Shopping Cart and Checkout

| Feature | Description | Priority |
|---------|-------------|----------|
| Shopping cart | Add/remove/quantity, persistent cart (DB or session) | ESSENTIAL |
| Guest checkout | Purchase without creating account | ESSENTIAL |
| Account creation | Optional account during checkout | IMPORTANT |
| Checkout fields | Configurable billing/shipping fields | IMPORTANT |
| Multiple shipping addresses | Ship to different address from billing | NICE-TO-HAVE |
| Order summary | Cart contents, totals, shipping preview on checkout | ESSENTIAL |
| Coupon/discount system | Percentage, fixed cart, fixed item, free shipping coupons | IMPORTANT |
| Coupon restrictions | By product, category, email, usage limit, expiry | IMPORTANT |

### 8.3 Payment and Shipping

| Feature | Description | Priority |
|---------|-------------|----------|
| Stripe integration | Credit/debit card payments | ESSENTIAL |
| PayPal integration | PayPal checkout | IMPORTANT |
| Bank transfer (BACS) | Manual bank payment instructions | NICE-TO-HAVE |
| Cash on delivery (COD) | Pay on delivery | NICE-TO-HAVE |
| 100+ additional gateways | Via extensions (Square, Amazon Pay, etc.) | NICE-TO-HAVE |
| Flat rate shipping | Fixed price per order/item | ESSENTIAL |
| Free shipping | Conditional free shipping (coupon, minimum order) | ESSENTIAL |
| Real-time carrier rates | Live rates from USPS, UPS, FedEx, etc. | IMPORTANT |
| Shipping zones | Different rates by geographic region | IMPORTANT |
| Tax calculation | Automated tax rates, tax classes, geo-based tax | ESSENTIAL |
| Tax reporting | Tax collected reports by period/region | IMPORTANT |

### 8.4 Order Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Order status workflow | Pending, processing, on-hold, completed, cancelled, refunded, failed | ESSENTIAL |
| Order notes | Internal and customer-facing notes on orders | IMPORTANT |
| Refunds | Full and partial refunds via dashboard | ESSENTIAL |
| Order emails | Confirmation, processing, completed, refunded, failed emails | ESSENTIAL |
| Invoice generation | Printable invoices and packing slips | IMPORTANT |
| Order search/filter | Search by status, date, customer, product | ESSENTIAL |
| Bulk order actions | Change status for multiple orders | IMPORTANT |

### 8.5 Store Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Inventory tracking | Stock quantity, low-stock alerts, out-of-stock status | ESSENTIAL |
| Stock management | Hold stock during checkout, restore on cancellation | IMPORTANT |
| Customer accounts | Order history, saved addresses, account dashboard | ESSENTIAL |
| Analytics/reporting | Sales, orders, products, categories, coupons, taxes, downloads | IMPORTANT |
| Dashboard widgets | Sales summary, recent orders, top products | IMPORTANT |
| Export tools | Export orders, products, customers to CSV | IMPORTANT |
| Import tools | Bulk import products from CSV | IMPORTANT |
| Wishlist | Save products for later (via extension) | NICE-TO-HAVE |
| Product bundles | Group products at discounted price (via extension) | NICE-TO-HAVE |
| Subscriptions | Recurring payments (via extension) | NICE-TO-HAVE |
| Multi-currency | Display prices in multiple currencies (via extension) | NICE-TO-HAVE |
| REST API | Full CRUD for products, orders, customers via API | IMPORTANT |
| Webhooks | Real-time event notifications to external services | IMPORTANT |

---

## 9. Developer Features

### 9.1 REST API

| Feature | Description | Priority |
|---------|-------------|----------|
| Core endpoints | Posts, pages, categories, tags, comments, media, users, taxonomies, types, settings | ESSENTIAL |
| CRUD operations | GET (list/single), POST (create), PUT/PATCH (update), DELETE | ESSENTIAL |
| JSON responses | All data in JSON format | ESSENTIAL |
| Authentication | Cookie nonce, Application Passwords, OAuth 1.0a | ESSENTIAL |
| Custom endpoints | `register_rest_route()` for plugin endpoints | ESSENTIAL |
| Custom fields/meta | Register and expose meta via API | IMPORTANT |
| Embed support | `?_embed` includes related resources in response | NICE-TO-HAVE |
| Pagination | `per_page`, `page` parameters | ESSENTIAL |
| Filtering/searching | Search, orderby, order, filter by taxonomy/author/status | ESSENTIAL |
| Batch requests | Multiple operations in single HTTP request (WP 5.6+) | IMPORTANT |
| Schema discovery | Self-documenting at `/wp-json/` | IMPORTANT |
| Versioning | Namespace versioning (e.g., `wp/v2/`, `myplugin/v1/`) | ESSENTIAL |

### 9.2 Plugin Architecture

| Feature | Description | Priority |
|---------|-------------|----------|
| Action hooks | `add_action()` / `do_action()` -- execute code at specific points | ESSENTIAL |
| Filter hooks | `add_filter()` / `apply_filters()` -- modify data in transit | ESSENTIAL |
| Hook priority | Control execution order via priority numbers | ESSENTIAL |
| Hook removal | `remove_action()` / `remove_filter()` | ESSENTIAL |
| Activation hooks | `register_activation_hook()` -- run setup on plugin enable | ESSENTIAL |
| Deactivation hooks | `register_deactivation_hook()` -- run cleanup | ESSENTIAL |
| Shortcode system | `add_shortcode()` -- macro-like tags for dynamic content | ESSENTIAL |
| Shortcode nesting | Shortcodes within shortcodes via `do_shortcode()` | IMPORTANT |
| Widget API | Register custom dashboard/front-end widgets | IMPORTANT |
| Settings API | `register_setting()`, `add_settings_section()`, `add_settings_field()` | IMPORTANT |
| Options API | `get_option()`, `update_option()`, `delete_option()` | ESSENTIAL |
| Transients API | `set_transient()`, `get_transient()` -- cached data with expiration | IMPORTANT |
| Cron API | `wp_schedule_event()` -- scheduled task execution | IMPORTANT |
| Rewrite API | Custom URL rewrite rules | IMPORTANT |
| HTTP API | `wp_remote_get()`, `wp_remote_post()` -- standardized HTTP client | IMPORTANT |
| Filesystem API | `WP_Filesystem` -- abstracted file operations | NICE-TO-HAVE |
| Metadata API | `get_metadata()`, `update_metadata()` -- for posts, users, terms, comments | ESSENTIAL |
| Mail API | `wp_mail()` -- email sending abstraction | IMPORTANT |

### 9.3 Theme Development

| Feature | Description | Priority |
|---------|-------------|----------|
| Template hierarchy | Deterministic template file resolution (single.php, page.php, archive.php, etc.) | ESSENTIAL |
| Template tags | `the_title()`, `the_content()`, `the_permalink()`, etc. | ESSENTIAL |
| Template parts | `get_template_part()` -- reusable template components | ESSENTIAL |
| Child themes | Override parent theme templates and functions | ESSENTIAL |
| Theme supports | `add_theme_support()` -- declare features (thumbnails, menus, etc.) | ESSENTIAL |
| Customizer API | `customize_register()` -- add theme options to live preview | IMPORTANT |
| Nav menu API | `register_nav_menu()`, `wp_nav_menu()` -- dynamic menus | ESSENTIAL |
| Sidebar/widget API | `register_sidebar()`, `dynamic_sidebar()` | IMPORTANT |
| Enqueue API | `wp_enqueue_script()`, `wp_enqueue_style()` -- asset management | ESSENTIAL |
| theme.json | Centralized theme configuration for block themes | IMPORTANT |

### 9.4 Developer Tools

| Feature | Description | Priority |
|---------|-------------|----------|
| WP-CLI | Command-line interface for all WP operations | ESSENTIAL |
| Script debug mode | `SCRIPT_DEBUG` -- unminified assets for debugging | IMPORTANT |
| Database debug | `WP_DEBUG`, `WP_DEBUG_LOG`, `WP_DEBUG_DISPLAY` | ESSENTIAL |
| Query monitoring | `$wpdb->queries` -- log all database queries | IMPORTANT |
| Hook inspection | See all registered hooks and their callbacks | NICE-TO-HAVE |
| REST API inspector | Browse endpoints at `/wp-json/` | NICE-TO-HAVE |

---

## 10. Security

### 10.1 Authentication

| Feature | Description | Priority |
|---------|-------------|----------|
| Secure password hashing | phass-based password hashing with salt | ESSENTIAL |
| Password strength meter | Enforce strong passwords | ESSENTIAL |
| Two-factor authentication | TOTP, email, hardware keys (plugin, moving to core) | IMPORTANT |
| Application passwords | Scoped tokens for API access | IMPORTANT |
| Session tokens | Secure session management with destroy capability | ESSENTIAL |
| Login attempt limiting | Rate limit failed logins (plugin territory) | IMPORTANT |
| Security keys/salts | Cryptographic salts in wp-config.php for cookie encryption | ESSENTIAL |

### 10.2 Application Security

| Feature | Description | Priority |
|---------|-------------|----------|
| CSRF protection | Nonces (cryptographic tokens) on all forms and actions | ESSENTIAL |
| XSS prevention | Output escaping functions: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()` | ESSENTIAL |
| SQL injection prevention | Prepared queries via `$wpdb->prepare()` | ESSENTIAL |
| Data sanitization | `sanitize_text_field()`, `sanitize_email()`, etc. | ESSENTIAL |
| Data validation | `is_email()`, `wp_check_invalid_utf8()`, etc. | ESSENTIAL |
| REST API security | Capability checks, permission callbacks on all endpoints | ESSENTIAL |
| File editor disable option | `DISALLOW_FILE_EDIT` to prevent in-dashboard code editing | IMPORTANT |

### 10.3 Infrastructure Security

| Feature | Description | Priority |
|---------|-------------|----------|
| HTTPS enforcement | `FORCE_SSL_ADMIN` for admin area | ESSENTIAL |
| Automatic updates | Security patches auto-applied | ESSENTIAL |
| Security headers | Via server configuration or plugins | IMPORTANT |
| File permissions | Documented permission guidelines (755/644) | IMPORTANT |
| Authentication cookies | Secure, HttpOnly cookies with proper path scoping | ESSENTIAL |
| XML-RPC control | Ability to disable XML-RPC (attack vector) | NICE-TO-HAVE |
| CORS headers | Configurable cross-origin policies for API | IMPORTANT |

---

## 11. Performance

### 11.1 Core Performance Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Lazy loading (images) | Native `loading="lazy"` on all images (WP 5.5+) | ESSENTIAL |
| Lazy loading (iframes) | Native lazy loading on embeds (WP 6.0+) | IMPORTANT |
| Responsive images | Automatic `srcset` and `sizes` attributes | ESSENTIAL |
| Fetchpriority hint | `fetchpriority="high"` on LCP image (WP 6.3+) | IMPORTANT |
| Script defer/async | `wp_register_script()` supports loading strategies (WP 6.3+) | IMPORTANT |
| DNS prefetch | Auto-generated for emoji and oEmbed domains | NICE-TO-HAVE |
| Block CSS loading | Only CSS for used blocks is enqueued (WP 5.8+) | IMPORTANT |
| Autoloaded options optimization | Better management of autoloaded DB options (WP 6.6+) | IMPORTANT |

### 11.2 Caching

| Feature | Description | Priority |
|---------|-------------|----------|
| Object cache | `WP_Object_Cache` for query result caching | ESSENTIAL |
| Transient API | Time-expired cache with `set_transient()`/`get_transient()` | ESSENTIAL |
| Page caching | Via plugins (WP Super Cache, W3 Total Cache) or server | ESSENTIAL |
| Browser caching | Cache-control headers for static assets | IMPORTANT |
| CDN integration | Easy CDN setup (Cloudflare, etc.) | IMPORTANT |
| GZIP compression | Server-level, WordPress-compatible | IMPORTANT |
| Persistent object cache | Redis/Memcached integration via drop-in | IMPORTANT |

### 11.3 Optimization

| Feature | Description | Priority |
|---------|-------------|----------|
| Image optimization | Compression on upload (plugin territory) | IMPORTANT |
| Database optimization | Post revision cleanup, transient cleanup, spam comment removal | IMPORTANT |
| Heartbeat API | Efficient auto-save and session management | NICE-TO-HAVE |
| Speculative loading | Prefetch/pre-render links for faster navigation | NICE-TO-HAVE |

---

## 12. Internationalization (i18n)

### 12.1 Core i18n

| Feature | Description | Priority |
|---------|-------------|----------|
| Translation system | GNU GetText: `__()`, `_e()`, `_x()`, `_n()`, `esc_html__()` | ESSENTIAL |
| Text domains | Per-plugin/theme translation namespaces | ESSENTIAL |
| Language packs | Auto-downloaded from translate.wordpress.org | IMPORTANT |
| .pot/.po/.mo files | Standard translation file workflow | ESSENTIAL |
| Site language | Set site language in Settings > General | ESSENTIAL |
| Admin language | Per-user admin language preference | IMPORTANT |
| Date/time localization | Localized date/time formatting | ESSENTIAL |
| Number formatting | Localized decimal separators, thousand separators | IMPORTANT |
| Currency localization | Via e-commerce plugins | IMPORTANT |

### 12.2 RTL and Multi-language

| Feature | Description | Priority |
|---------|-------------|----------|
| RTL support | Automatic rtl.css loading for RTL languages | ESSENTIAL |
| `is_rtl()` function | Conditional logic for RTL layouts | ESSENTIAL |
| RTL in block editor | Built-in RTL awareness in Gutenberg | IMPORTANT |
| Multilingual content | Via plugins (WPML, Polylang, TranslatePress) | IMPORTANT |
| Translation management | GlotPress community translation platform | NICE-TO-HAVE |
| 200+ languages | Core translated into 200+ locales | IMPORTANT |

---

## Feature Count Summary

| Category | Essential | Important | Nice-to-Have | Total |
|----------|-----------|-----------|--------------|-------|
| 1. Content Management | 28 | 20 | 6 | 54 |
| 2. WYSIWYG / Visual Editing | 20 | 10 | 2 | 32 |
| 3. Media Management | 20 | 12 | 4 | 36 |
| 4. Multi-site / Network | 0 | 0 | 15 | 15 |
| 5. Site Deployment & Mgmt | 25 | 12 | 3 | 40 |
| 6. User Management | 16 | 10 | 3 | 29 |
| 7. SEO & Marketing | 12 | 14 | 8 | 34 |
| 8. E-commerce (WooCommerce) | 25 | 18 | 10 | 53 |
| 9. Developer Features | 30 | 14 | 5 | 49 |
| 10. Security | 14 | 6 | 2 | 22 |
| 11. Performance | 11 | 10 | 3 | 24 |
| 12. Internationalization | 9 | 6 | 2 | 17 |
| **TOTALS** | **210** | **132** | **63** | **405** |

---

## OpenPress Gap Analysis (Quick Reference)

Features that OpenPress currently has (per TASKS.md Phases 1-8):

- Content CRUD (posts, pages, custom types) -- Phase 2
- JWT authentication -- Phase 2
- Media upload (R2-backed) -- Phase 2
- Taxonomy/metadata API -- Phase 2
- Block-based content editor -- Phase 3
- Media manager UI -- Phase 3
- Plugin system (hooks/filters/actions) -- Phase 4
- Theme system (CSS vars, component registry) -- Phase 4
- PWA/offline support -- Phase 5
- E-commerce (products, cart, orders) -- Phase 6
- AI integration -- Phase 7
- Public storefront -- Phase 8

Features NOT YET implemented (from Future Enhancements in TASKS.md):

- Stripe/payment integration for checkout
- Full-text search (D1 FTS5)
- Email notifications
- Image transformation
- Multi-site support
- GraphQL API layer
- WebSocket real-time editing
- SEO sitemap generator
- RSS feed generation
- Content versioning/diff
- Role-based access control (editor, author, subscriber)
- Analytics dashboard
- CDN cache purging UI

---

## Sources

- [WordPress.org Documentation](https://wordpress.org/documentation/)
- [WordPress Developer Handbook](https://developer.wordpress.org/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [WordPress Plugin Handbook](https://developer.wordpress.org/plugins/)
- [WordPress Theme Developer Handbook](https://developer.wordpress.org/themes/)
- [Make WordPress Core](https://make.wordpress.org/core/)
- [Gutenberg Block Editor Documentation](https://developer.wordpress.org/block-editor/)
- [WooCommerce Documentation](https://woocommerce.com/documentation/)
- [WordPress Security Documentation](https://developer.wordpress.org/apis/security/)
- [WordPress i18n Documentation](https://developer.wordpress.org/plugins/internationalization/)
- [WordPress Performance Team](https://make.wordpress.org/performance/)
