import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useSEO } from "@/hooks/useSEO";
import { HeroSlideshow } from "@/components/HeroSlideshow";

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
    <div className="flex flex-col">
      {/* Hero Slideshow */}
      <HeroSlideshow />

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
                className="flip-card h-56 cursor-pointer"
              >
                <div className="flip-card-inner">
                  {/* Front face */}
                  <div className="flip-card-front border border-border rounded-xl p-6 bg-surface hover:border-primary-300 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 glass-card flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-primary-50 text-lg">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-text-primary text-lg">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-auto pt-3 text-xs text-primary-500 font-medium">Hover to learn more →</div>
                  </div>
                  {/* Back face */}
                  <div className="flip-card-back border border-primary-200 rounded-xl p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/50 dark:to-primary-900/30 flex flex-col justify-center">
                    <div className="text-2xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-text-primary text-lg mb-2">{feature.title}</h3>
                    <ul className="space-y-1.5 flex-1">
                      {feature.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-sm text-text-secondary">
                          <svg className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-300/50 to-transparent dark:via-primary-700/30" />

      {/* Recent Posts */}
      {!postsLoading && recentPosts.length > 0 && (
        <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-950/20">
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

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent dark:via-blue-700/30" />

      {/* Architecture Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50/50 to-slate-50 dark:from-blue-950/20 dark:to-slate-900 overflow-hidden">
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

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent dark:via-amber-700/30" />

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <span>⭐</span> Testimonials
            </div>
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Loved by developers
            </h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              See what people are saying about OpenPress.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18-3.47L5 12.9l1.18-6.88L2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">{t.name}</div>
                    <div className="text-xs text-text-tertiary">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent dark:via-emerald-700/30" />

      {/* Showcase Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-emerald-50/30 dark:from-slate-800/50 dark:to-emerald-950/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <span>🚀</span> Use Cases
            </div>
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              See it in action
            </h2>
            <p className="mt-4 text-text-secondary max-w-xl mx-auto">
              From blogs to storefronts, OpenPress handles it all with a modern, edge-native architecture.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-xl border border-border overflow-hidden bg-surface hover:shadow-lg transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-blue-500/10 to-primary-500/10 flex items-center justify-center">
                <div className="text-5xl">📰</div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Blog & Content</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Rich block editor, categories, tags, SEO, comments, and RSS. Everything you need for a professional blog.
                </p>
                <Link to="/blog" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  View Blog &rarr;
                </Link>
              </div>
            </div>
            <div className="group rounded-xl border border-border overflow-hidden bg-surface hover:shadow-lg transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center">
                <div className="text-5xl">🛍️</div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">E-Commerce Store</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Products, variants, cart, Stripe checkout, coupons, and order management. Launch your store in minutes.
                </p>
                <Link to="/shop" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Browse Store &rarr;
                </Link>
              </div>
            </div>
            <div className="group rounded-xl border border-border overflow-hidden bg-surface hover:shadow-lg transition-all duration-300">
              <div className="aspect-video bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
                <div className="text-5xl">🎨</div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Themes & Templates</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Composable React themes, component registry, and reusable widgets. Customize every pixel.
                </p>
                <Link to="/templates" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Explore Templates &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent dark:via-purple-700/30" />

      {/* Contact Us Section */}
      <section className="relative py-16 sm:py-24 bg-surface-secondary">
        {/* Map background */}
        <div className="absolute inset-0 opacity-[0.15]">
          <iframe
            title="Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-122.5,37.7,-122.3,37.8&layer=mapnik"
            className="w-full h-full border-0 grayscale"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-secondary via-surface-secondary/90 to-surface-secondary" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-start">
            <div>
              <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
                Get in touch
              </h2>
              <p className="mt-4 text-text-secondary text-lg leading-relaxed">
                Have questions, feedback, or want to contribute? We'd love to hear from you.
              </p>
              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-1.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.089-.745-2.089-.162-2.089-.162 0-1.186.013-2.689.003-3.074C7.793 5.07 7.5 5.557 7.5 5.557 1.128-.18 2.316-.562 3.5-.934.108.778.417 1.305.76 1.605-2.665.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">GitHub</h3>
                    <a href="https://github.com/aliasfoxkde/OpenPress" target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-primary-600 hover:text-primary-700">
                      github.com/aliasfoxkde/OpenPress &rarr;
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-50 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Community</h3>
                    <p className="mt-1 text-sm text-text-secondary">Open an issue or start a discussion on GitHub.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="border border-border rounded-xl bg-surface p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Send us a message</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);
                    const name = formData.get("name");
                    const email = formData.get("email");
                    const message = formData.get("message");
                    window.location.href = `mailto:hello@openpress.dev?subject=Contact from ${name}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Your name"
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-text-secondary mb-1">Message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={4}
                      placeholder="How can we help?"
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium text-sm shadow-sm"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-300/50 to-transparent dark:via-primary-700/30" />

      {/* Mobile App Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-purple-50/30 dark:from-slate-800/50 dark:to-purple-950/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <span>📱</span> Mobile Ready
            </div>
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">
              Your website, your app
            </h2>
            <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto">
              Turn your OpenPress site into a native iOS and Android app with
              Capacitor — push notifications, offline support, and app store
              distribution, completely free.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone mockups */}
            <div className="flex justify-center items-end gap-4 sm:gap-6">
              {/* Android phone */}
              <div className="relative w-40 sm:w-48">
                <div className="bg-gray-900 rounded-[2rem] p-2 shadow-2xl">
                  <div className="bg-white rounded-[1.5rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-primary-600 px-3 py-1.5 flex items-center justify-between text-white text-[10px]">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="13" x2="23" y2="11"/></svg>
                      </div>
                    </div>
                    {/* App content */}
                    <div className="p-3">
                      <div className="h-2 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-1.5 bg-gray-100 rounded w-5/6 mb-3" />
                      <div className="bg-primary-50 rounded-lg p-2 mb-2">
                        <div className="h-1.5 bg-primary-200 rounded w-3/4 mb-1" />
                        <div className="h-1.5 bg-primary-100 rounded w-full" />
                      </div>
                      <div className="h-12 bg-gray-100 rounded-lg mb-2" />
                      <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-1.5 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                </div>
                {/* Android badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-3 py-1 text-xs font-medium text-text-primary border border-border">
                  Android
                </div>
              </div>

              {/* iOS phone */}
              <div className="relative w-44 sm:w-52 -mb-4">
                <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl ring-1 ring-gray-700">
                  <div className="bg-white rounded-[2rem] overflow-hidden">
                    {/* Notch */}
                    <div className="bg-primary-600 relative pt-2">
                      <div className="mx-auto w-16 h-4 bg-gray-900 rounded-b-xl" />
                      <div className="px-4 py-1.5 flex items-center justify-between text-white text-[10px]">
                        <span className="font-medium">9:41</span>
                        <div className="flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>
                          <svg width="16" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="13" x2="23" y2="11"/></svg>
                        </div>
                      </div>
                    </div>
                    {/* App content */}
                    <div className="p-3">
                      <div className="h-2 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-1.5 bg-gray-100 rounded w-5/6 mb-3" />
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        <div className="bg-primary-50 rounded-lg p-2">
                          <div className="w-5 h-5 bg-primary-200 rounded mb-1" />
                          <div className="h-1 bg-primary-100 rounded w-full" />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="w-5 h-5 bg-gray-200 rounded mb-1" />
                          <div className="h-1 bg-gray-100 rounded w-full" />
                        </div>
                      </div>
                      <div className="h-10 bg-gray-100 rounded-lg mb-2" />
                      <div className="h-1.5 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-1.5 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                </div>
                {/* iOS badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-3 py-1 text-xs font-medium text-text-primary border border-border">
                  iOS
                </div>
              </div>
            </div>

            {/* Features list */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">One command deploy</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Run a single Capacitor command to generate native iOS and Android projects from your existing site. No extra code needed.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">
                  🔔
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Push notifications</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Engage your audience with real-time push notifications. Support for Firebase Cloud Messaging (Android) and APNs (iOS).
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-lg">
                  📡
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Offline support</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Your app works even without internet. Service workers cache content so readers can browse your latest posts anywhere.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg">
                  🏪
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">App Store ready</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Distribute on Google Play and the Apple App Store. Capacitor handles native builds — you just upload and publish.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
                  💰
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Completely free</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    OpenPress is free. Capacitor is free. Cloudflare is free. Build and ship your app with zero infrastructure costs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <a
              href="https://capacitorjs.com/docs/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-all font-semibold text-sm shadow-lg shadow-primary-600/25"
            >
              Get started with Capacitor
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </a>
            <p className="mt-3 text-sm text-text-tertiary">
              Open source &middot; MIT License &middot; Works with any OpenPress site
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent dark:via-primary-600/30" />

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
    highlights: ["300+ edge locations", "Zero cold starts", "Sub-ms latency", "Auto-scaling"],
  },
  {
    icon: "🧩",
    title: "Plugin System",
    description:
      "JavaScript hooks and filters inspired by WordPress — but modern, fully typed, and sandboxed for security.",
    highlights: ["Actions & filters", "Sandboxed execution", "TypeScript types", "NPM distributable"],
  },
  {
    icon: "🎨",
    title: "React Themes",
    description:
      "Composable React themes with a component registry. Distribute as NPM packages, not ZIP files.",
    highlights: ["Component registry", "NPM packages", "Hot-swappable", "Customizable"],
  },
  {
    icon: "📝",
    title: "Block Editor",
    description:
      "A modern block-based content editor. Drag, drop, and compose rich content with a Gutenberg-like experience.",
    highlights: ["Drag & drop blocks", "Rich media support", "Collaborative editing", "Auto-save"],
  },
  {
    icon: "🔐",
    title: "API-First",
    description:
      "Every feature exposed via REST API. JWT authentication, full CRUD operations, and OpenAPI documentation.",
    highlights: ["REST API", "JWT auth", "RBAC roles", "Rate limiting"],
  },
  {
    icon: "🤖",
    title: "AI-Ready",
    description:
      "Built for the AI era with Workers AI, Vectorize for semantic search, and a hook system AI agents can invoke.",
    highlights: ["Workers AI", "Vectorize search", "AI hooks", "Content generation"],
  },
];

const highlights = [
  "Zero cold starts — runs on V8 isolates, not containers",
  "D1 SQLite database replicated to every edge location",
  "R2 object storage with zero egress fees",
  "KV cache for sub-millisecond reads",
  "Free tier covers most small-to-medium sites",
  "PWA-ready with offline support and push notifications",
  "Completely free!",
];

const testimonials = [
  {
    name: "Alex Chen",
    initial: "A",
    role: "Full-Stack Developer",
    quote: "OpenPress replaced our WordPress install perfectly. The edge performance is incredible — pages load in under 100ms globally. And it costs us nothing to run.",
  },
  {
    name: "Sarah Miller",
    initial: "S",
    role: "Content Creator",
    quote: "The block editor is intuitive and fast. I love that I can manage my blog, store, and audience all from one dashboard. The AI features are a game-changer for content creation.",
  },
  {
    name: "James Park",
    initial: "J",
    role: "Startup Founder",
    quote: "We launched our entire e-commerce store in under an hour. Zero infrastructure costs, zero vendor lock-in, and the Stripe integration was seamless.",
  },
];
