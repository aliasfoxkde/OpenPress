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
        const res = await api.get<{ data: Array<{ id: string; slug: string; title: string; excerpt?: string; featured_image_url?: string | null; published_at?: string }> }>("/content?limit=3");
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
                className="group border border-border rounded-xl p-6 bg-surface hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 glass-card"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-primary-50 text-lg group-hover:bg-primary-100 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-text-primary text-lg">
                    {feature.title}
                  </h3>
                </div>
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
      <section className="py-16 sm:py-24 bg-surface-secondary overflow-hidden">
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
              {/* Animated Architecture Diagram */}
              <div className="relative">
                {/* Connecting lines */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary-300/50 via-primary-400/30 to-primary-500/20 -translate-x-1/2" />

                {/* Layer 1: Browser */}
                <div className="relative flex justify-center mb-2">
                  <div className="group relative w-full max-w-sm">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-5 shadow-lg shadow-blue-500/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10 15.3 15.3 0 0 1 4 10z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">Browser / PWA</div>
                          <div className="text-xs text-text-tertiary">React 19 + TanStack Router</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">CSR</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Service Worker</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">Offline</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-400 animate-bounce">
                    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Layer 2: Edge API */}
                <div className="relative flex justify-center mb-2">
                  <div className="group relative w-full max-w-sm">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-violet-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-950/50 dark:to-violet-950/50 border border-primary-200/50 dark:border-primary-800/30 rounded-xl p-5 shadow-lg shadow-primary-500/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-10H4z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">Edge API</div>
                          <div className="text-xs text-text-tertiary">Cloudflare Workers + Hono</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">JWT Auth</span>
                        <span className="text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">REST API</span>
                        <span className="text-[10px] bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">RBAC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-400 animate-bounce">
                    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Layer 3: Data */}
                <div className="relative flex justify-center mb-2">
                  <div className="group relative w-full max-w-sm">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-5 shadow-lg shadow-amber-500/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14"/><path d="M21 5v14"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">Data Layer</div>
                          <div className="text-xs text-text-tertiary">Cloudflare Storage</div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">D1 SQLite</span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">R2 Storage</span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">KV Cache</span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">Vectorize</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center my-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-400 animate-bounce">
                    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Layer 4: Plugins */}
                <div className="relative flex justify-center">
                  <div className="group relative w-full max-w-sm">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl p-5 shadow-lg shadow-emerald-500/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">Plugin Runtime</div>
                          <div className="text-xs text-text-tertiary">Hooks &amp; Extensions</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Actions</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Filters</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Events</span>
                      </div>
                    </div>
                  </div>
                </div>
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
