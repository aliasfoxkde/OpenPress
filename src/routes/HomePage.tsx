import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useSEO } from "@/hooks/useSEO";

export function HomePage() {
  useSEO({ title: "Home", description: "A modern, edge-native CMS", type: "website" });
  const [recentPosts, setRecentPosts] = useState<Array<{ id: string; slug: string; title: string; excerpt?: string; featured_image_url?: string | null; published_at?: string }>>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await api.get<{ data: Array<{ id: string; slug: string; title: string; excerpt?: string; featured_image_url?: string | null; published_at?: string }> }>("/api/content?limit=3");
        setRecentPosts(res.data || []);
      } catch {
        // posts section is optional
      } finally {
        setPostsLoading(false);
      }
    }
    void loadRecent();
  }, []);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Open Source &middot; Edge-Native &middot; AI-Ready
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
              <span className="block">The CMS,</span>
              <span className="block bg-gradient-to-r from-primary-200 to-white bg-clip-text text-transparent">
                Reimagined.
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto leading-relaxed">
              OpenPress is a modern, open-source content platform built on
              Cloudflare's edge network. React themes, JS plugins, block
              editor, and AI-ready out of the box.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/admin"
                className="bg-white text-primary-900 px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all font-semibold text-base shadow-lg shadow-primary-900/50"
              >
                Open Dashboard &rarr;
              </a>
              <a
                href="https://github.com/aliasfoxkde/OpenPress"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/20 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all font-semibold text-base backdrop-blur-sm"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 sm:py-24 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Everything you need
            </h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              A complete content management system with modern architecture and
              zero vendor lock-in.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group border border-border rounded-xl p-6 bg-surface hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-50 text-lg mb-4 group-hover:bg-primary-100 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-text-primary text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      {!postsLoading && recentPosts.length > 0 && (
        <section className="py-16 sm:py-24 bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Latest Posts</h2>
              <Link
                to="/blog"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group rounded-xl border border-border overflow-hidden bg-surface hover:shadow-lg transition-all duration-300"
                >
                  {post.featured_image_url ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.featured_image_url}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                      <span className="text-3xl opacity-30">📰</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-text-secondary line-clamp-2">{post.excerpt}</p>
                    )}
                    {post.published_at && (
                      <time className="mt-3 block text-xs text-text-tertiary">
                        {new Date(post.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </time>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Architecture Section */}
      <section className="py-16 sm:py-24 bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
                Built for the edge
              </h2>
              <p className="mt-4 text-text-secondary text-lg leading-relaxed">
                Unlike traditional CMS platforms that run on a single server,
                OpenPress runs on Cloudflare's global network of 300+ data
                centers. Your content is served from the nearest edge location
                to every visitor.
              </p>
              <ul className="mt-8 space-y-4">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-primary-500 mt-0.5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-text-secondary">{h}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-mono text-sm text-text-tertiary mb-4">
                  System Architecture
                </h3>
                <pre className="text-xs sm:text-sm text-text-secondary leading-relaxed overflow-x-auto">
{`┌─────────────────────────────┐
│   Browser / PWA (React)     │
│   CSR + Service Worker       │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│   Edge API (Workers)         │
│   Hono Router + JWT Auth     │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│   Data Layer                 │
│   D1 + R2 + KV + Vectorize   │
└──────────┬──────────────────┘
           │
┌──────────▼──────────────────┐
│   Plugin Runtime + Hooks     │
│   Actions / Filters / Events │
└─────────────────────────────┘`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-primary-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to build something amazing?
          </h2>
          <p className="mt-4 text-primary-200 text-lg max-w-xl mx-auto">
            OpenPress is free, open source, and runs entirely on Cloudflare's
            free tier. Get started in minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/admin"
              className="bg-white text-primary-900 px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all font-semibold"
            >
              Launch Dashboard
            </a>
            <a
              href="https://github.com/aliasfoxkde/OpenPress"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/20 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all font-semibold"
            >
              Contribute on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [

  {
    icon: "⚡",
    title: "Edge-Native",
    description:
      "Runs on Cloudflare's global network of 300+ edge locations. Sub-millisecond API responses, zero cold starts.",
  },
  {
    icon: "🧩",
    title: "Plugin System",
    description:
      "JavaScript hooks and filters inspired by WordPress — but modern, fully typed, and sandboxed for security.",
  },
  {
    icon: "🎨",
    title: "React Themes",
    description:
      "Composable React themes with a component registry. Distribute as NPM packages, not ZIP files.",
  },
  {
    icon: "📝",
    title: "Block Editor",
    description:
      "A modern block-based content editor. Drag, drop, and compose rich content with a Gutenberg-like experience.",
  },
  {
    icon: "🔐",
    title: "API-First",
    description:
      "Every feature exposed via REST API. JWT authentication, full CRUD operations, and OpenAPI documentation.",
  },
  {
    icon: "🤖",
    title: "AI-Ready",
    description:
      "Built for the AI era with Workers AI, Vectorize for semantic search, and a hook system AI agents can invoke.",
  },
];

const highlights = [
  "Zero cold starts — runs on V8 isolates, not containers",
  "D1 SQLite database replicated to every edge location",
  "R2 object storage with zero egress fees",
  "KV cache for sub-millisecond reads",
  "Free tier covers most small-to-medium sites",
  "PWA-ready with offline support and push notifications",
];
