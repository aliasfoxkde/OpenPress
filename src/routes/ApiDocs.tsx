import { useState, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface Endpoint {
  method: Method;
  path: string;
  description: string;
  auth: boolean;
  category: string;
  params?: Array<{ name: string; type: string; required: boolean; description: string }>;
  body?: string;
  response?: string;
}

const endpoints: Endpoint[] = [
  // Auth
  { method: "POST", path: "/auth/login", description: "Authenticate user and receive JWT token", auth: false, category: "Authentication", body: '{\n  "email": "user@example.com",\n  "password": "password123"\n}', response: '{\n  "data": {\n    "token": "eyJhbGciOiJIUzI1NiIs...",\n    "user": {\n      "id": "uuid",\n      "email": "user@example.com",\n      "role": "admin"\n    }\n  }\n}' },
  { method: "POST", path: "/auth/register", description: "Register a new user account", auth: false, category: "Authentication", body: '{\n  "email": "user@example.com",\n  "password": "password123",\n  "name": "John Doe"\n}', response: '{\n  "data": {\n    "token": "eyJhbGciOiJIUzI1NiIs...",\n    "user": {\n      "id": "uuid",\n      "email": "user@example.com",\n      "role": "subscriber"\n    }\n  }\n}' },
  { method: "GET", path: "/auth/me", description: "Get current authenticated user profile", auth: true, category: "Authentication", response: '{\n  "data": {\n    "id": "uuid",\n    "email": "user@example.com",\n    "name": "John Doe",\n    "role": "admin",\n    "created_at": "2026-01-01T00:00:00Z"\n  }\n}' },

  // Content
  { method: "GET", path: "/content", description: "List published content with pagination", auth: false, category: "Content", params: [{ name: "limit", type: "number", required: false, description: "Items per page (max 100)" }, { name: "offset", type: "number", required: false, description: "Pagination offset" }, { name: "status", type: "string", required: false, description: "Filter by status" }, { name: "type", type: "string", required: false, description: "Filter by content type" }], response: '{\n  "data": [\n    {\n      "id": "uuid",\n      "title": "My Post",\n      "slug": "my-post",\n      "status": "published",\n      "excerpt": "..."\n    }\n  ],\n  "meta": { "total": 42, "limit": 10, "offset": 0 }\n}' },
  { method: "GET", path: "/content/:slug", description: "Get a single content item by slug", auth: false, category: "Content", response: '{\n  "data": {\n    "id": "uuid",\n    "title": "My Post",\n    "slug": "my-post",\n    "content": "<p>HTML content...</p>",\n    "status": "published",\n    "author_name": "John Doe"\n  }\n}' },
  { method: "POST", path: "/content", description: "Create a new content item", auth: true, category: "Content", body: '{\n  "title": "My Post",\n  "content": "<p>Hello world</p>",\n  "type": "post",\n  "status": "draft"\n}', response: '{\n  "data": {\n    "id": "uuid",\n    "title": "My Post",\n    "slug": "my-post",\n    "status": "draft"\n  }\n}' },
  { method: "PUT", path: "/content/:id", description: "Update an existing content item", auth: true, category: "Content", body: '{\n  "title": "Updated Title",\n  "content": "<p>Updated content</p>"\n}' },
  { method: "DELETE", path: "/content/:id", description: "Move content to trash", auth: true, category: "Content" },

  // Media
  { method: "GET", path: "/media", description: "List uploaded media files", auth: true, category: "Media", params: [{ name: "limit", type: "number", required: false, description: "Items per page" }, { name: "type", type: "string", required: false, description: "Filter by MIME type" }] },
  { method: "POST", path: "/media/upload", description: "Upload a media file (multipart/form-data)", auth: true, category: "Media", body: 'Content-Type: multipart/form-data\n\nfile: (binary)\nalt_text: "Description" (optional)' },
  { method: "DELETE", path: "/media/:id", description: "Delete a media file", auth: true, category: "Media" },

  // Taxonomies
  { method: "GET", path: "/taxonomies", description: "List all categories and tags", auth: false, category: "Taxonomies", params: [{ name: "type", type: "string", required: false, description: 'Filter by type: "category" or "tag"' }] },
  { method: "POST", path: "/taxonomies", description: "Create a category or tag", auth: true, category: "Taxonomies", body: '{\n  "name": "Technology",\n  "slug": "technology",\n  "type": "category"\n}' },
  { method: "DELETE", path: "/taxonomies/:id", description: "Delete a taxonomy term", auth: true, category: "Taxonomies" },

  // Products
  { method: "GET", path: "/products", description: "List all published products", auth: false, category: "Products", params: [{ name: "limit", type: "number", required: false, description: "Items per page" }, { name: "category", type: "string", required: false, description: "Filter by category slug" }] },
  { method: "GET", path: "/products/:slug", description: "Get a single product by slug", auth: false, category: "Products" },
  { method: "POST", path: "/products", description: "Create a new product", auth: true, category: "Products", body: '{\n  "title": "Premium Theme",\n  "price": 29.99,\n  "content": "<p>Description...</p>",\n  "status": "published"\n}' },
  { method: "PUT", path: "/products/:id", description: "Update a product", auth: true, category: "Products" },
  { method: "DELETE", path: "/products/:id", description: "Delete a product", auth: true, category: "Products" },

  // Orders & Cart
  { method: "GET", path: "/orders", description: "List all orders (admin) or user orders", auth: true, category: "Orders" },
  { method: "GET", path: "/orders/:id", description: "Get a specific order with line items", auth: true, category: "Orders" },
  { method: "POST", path: "/cart/add", description: "Add item to cart (session-based)", auth: false, category: "Cart", body: '{\n  "product_id": "uuid",\n  "quantity": 1\n}', response: '{\n  "data": {\n    "items": [{ "product_id": "uuid", "quantity": 1 }],\n    "total": 29.99\n  }\n}' },
  { method: "GET", path: "/cart", description: "Get current cart contents", auth: false, category: "Cart" },
  { method: "POST", path: "/checkout/create", description: "Create a Stripe checkout session", auth: false, category: "Orders", body: '{\n  "email": "buyer@example.com",\n  "success_url": "/order/success",\n  "cancel_url": "/order/cancel"\n}', response: '{\n  "data": {\n    "checkout_url": "https://checkout.stripe.com/..."\n  }\n}' },

  // Settings
  { method: "GET", path: "/settings", description: "Get all site settings", auth: true, category: "Settings" },
  { method: "PUT", path: "/settings", description: "Update site settings", auth: true, category: "Settings", body: '{\n  "site_title": "My Blog",\n  "site_description": "A great blog",\n  "posts_per_page": 10\n}' },

  // Users
  { method: "GET", path: "/users", description: "List all users (admin only)", auth: true, category: "Users" },
  { method: "PUT", path: "/users/:id", description: "Update a user (admin or self)", auth: true, category: "Users", body: '{\n  "name": "Jane Doe",\n  "role": "editor"\n}' },
  { method: "DELETE", path: "/users/:id", description: "Delete a user (admin only)", auth: true, category: "Users" },

  // Hero Slides
  { method: "GET", path: "/hero-slides", description: "Get all active hero slides (public)", auth: false, category: "Hero Slides", response: '{\n  "data": [\n    {\n      "id": "uuid",\n      "title": "The CMS,",\n      "subtitle": "Reimagined.",\n      "animation_type": "slide"\n    }\n  ]\n}' },
  { method: "GET", path: "/admin/hero-slides", description: "List all slides including inactive (admin)", auth: true, category: "Hero Slides" },
  { method: "POST", path: "/admin/hero-slides", description: "Create a new hero slide", auth: true, category: "Hero Slides", body: '{\n  "title": "Welcome",\n  "subtitle": "To OpenPress",\n  "background_gradient": "from-indigo-950 via-indigo-900 to-indigo-800",\n  "animation_type": "slide",\n  "is_active": 1\n}' },
  { method: "PUT", path: "/admin/hero-slides/:id", description: "Update a hero slide", auth: true, category: "Hero Slides" },
  { method: "DELETE", path: "/admin/hero-slides/:id", description: "Delete a hero slide", auth: true, category: "Hero Slides" },

  // SEO
  { method: "GET", path: "/seo/sitemap", description: "Generate XML sitemap", auth: false, category: "SEO" },
  { method: "GET", path: "/seo/rss", description: "Generate RSS feed", auth: false, category: "SEO" },
  { method: "GET", path: "/seo/robots", description: "Generate robots.txt", auth: false, category: "SEO" },
  { method: "GET", path: "/search", description: "Full-text search across content", auth: false, category: "SEO", params: [{ name: "q", type: "string", required: true, description: "Search query" }] },

  // Comments
  { method: "GET", path: "/comments/:contentId", description: "Get comments for a content item", auth: false, category: "Comments" },
  { method: "POST", path: "/comments/:contentId", description: "Post a comment", auth: true, category: "Comments", body: '{\n  "content": "Great article!"\n}' },

  // AI
  { method: "POST", path: "/ai/generate", description: "Generate content with AI (Workers AI)", auth: true, category: "AI", body: '{\n  "prompt": "Write a blog post about...",\n  "type": "content"\n}' },
];

const categories = [...new Set(endpoints.map((e) => e.category))];

const methodColors: Record<Method, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function ApiDocs() {
  useSEO({ title: "API Documentation", description: "OpenPress REST API reference", type: "website" });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return endpoints.filter((ep) => {
      const matchesSearch = !search || ep.path.toLowerCase().includes(search.toLowerCase()) || ep.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !activeCategory || ep.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const toggleExpand = (key: string) => {
    setExpanded((prev) => (prev === key ? null : key));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text-primary">API Reference</h1>
          <p className="mt-2 text-text-secondary">
            Complete REST API documentation for OpenPress. All endpoints accept and return JSON.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search endpoints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!activeCategory ? "bg-primary-600 text-white" : "bg-surface border border-border text-text-secondary hover:bg-surface-secondary"}`}
              >
                All ({endpoints.length})
              </button>
              {categories.map((cat) => {
                const count = endpoints.filter((e) => e.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? "bg-primary-600 text-white" : "bg-surface border border-border text-text-secondary hover:bg-surface-secondary"}`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Auth info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 text-sm">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
          </svg>
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">Authentication</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Protected endpoints require a JWT token in the <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-xs font-mono">Authorization: Bearer &lt;token&gt;</code> header. Log in via <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-xs font-mono">POST /api/auth/login</code> to receive your token.
            </p>
          </div>
        </div>
      </div>

      {/* Endpoints list */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="space-y-2">
          {filtered.map((ep) => {
            const key = `${ep.method}-${ep.path}`;
            const isOpen = expanded === key;
            return (
              <div key={key} className="border border-border rounded-lg overflow-hidden bg-surface">
                <button
                  onClick={() => toggleExpand(key)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-secondary transition-colors"
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-bold min-w-[56px] text-center ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-text-primary flex-1 truncate">{ep.path}</code>
                  {ep.auth && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      AUTH
                    </span>
                  )}
                  <span className="text-xs text-text-tertiary hidden sm:block max-w-xs truncate">{ep.description}</span>
                  <svg className={`w-4 h-4 text-text-tertiary transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="border-t border-border p-4 space-y-4 bg-surface-secondary/50">
                    <p className="text-sm text-text-secondary">{ep.description}</p>

                    {ep.params && ep.params.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Parameters</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-text-tertiary border-b border-border">
                                <th className="pb-2 pr-4 font-medium">Name</th>
                                <th className="pb-2 pr-4 font-medium">Type</th>
                                <th className="pb-2 pr-4 font-medium">Required</th>
                                <th className="pb-2 font-medium">Description</th>
                              </tr>
                            </thead>
                            <tbody className="text-text-secondary">
                              {ep.params.map((p) => (
                                <tr key={p.name}>
                                  <td className="py-1.5 pr-4 font-mono text-xs text-primary-600">{p.name}</td>
                                  <td className="py-1.5 pr-4 text-xs">{p.type}</td>
                                  <td className="py-1.5 pr-4">{p.required ? <span className="text-red-500">Yes</span> : <span className="text-text-tertiary">No</span>}</td>
                                  <td className="py-1.5 text-xs">{p.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {ep.body && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Request Body</h4>
                          <button onClick={() => copyCode(ep.body!)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Copy</button>
                        </div>
                        <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{ep.body}</pre>
                      </div>
                    )}

                    {ep.response && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Response</h4>
                          <button onClick={() => copyCode(ep.response!)} className="text-xs text-primary-600 hover:text-primary-700 font-medium">Copy</button>
                        </div>
                        <pre className="p-3 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap">{ep.response}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-tertiary">No endpoints match your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
