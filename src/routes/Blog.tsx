import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useSEO } from "@/hooks/useSEO";

interface ContentItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  excerpt: string;
  featured_image_url: string | null;
  status: string;
  published_at: string;
  created_at: string;
  author_name?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function BlogPage() {
  useSEO({ title: "Blog", description: "Latest posts and updates", type: "website" });
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get<{ data: { id: string; name: string; slug: string; terms?: Category[] }[] }>("/taxonomies");
        for (const tax of res.data || []) {
          if (tax.name === "Category" || tax.slug === "category") {
            setCategories((tax.terms || []).map((t) => ({ id: t.id, name: t.name, slug: t.slug })));
          }
        }
      } catch {
        // taxonomies may not exist
      }
    }
    void loadCategories();
  }, []);

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12" });
        if (activeCategory) params.set("category", activeCategory);
        if (search) params.set("search", search);
        const res = await api.get<{ data: ContentItem[]; pagination?: { totalPages: number } }>(`/api/content?${params}`);
        setPosts(res.data || []);
        if (res.pagination) setTotalPages(res.pagination.totalPages);
      } catch {
        setError("Failed to load posts");
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(() => void loadPosts(), 300);
    return () => clearTimeout(timer);
  }, [page, activeCategory, search]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryClick(slug: string) {
    setActiveCategory(slug === activeCategory ? "" : slug);
    setPage(1);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Blog</h1>
            <p className="mt-2 text-text-secondary">Latest posts and updates</p>
          </div>
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RSS Feed"
            className="text-text-tertiary hover:text-primary-600 transition-colors"
            title="RSS Feed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a9 9 0 0 1 9 9 9 9 0 0 1-18 0" />
              <line x1="4" y1="11" x2="20" y2="11" />
            </svg>
          </a>
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryClick("")}
            className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
              !activeCategory
                ? "bg-primary-600 text-white"
                : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                activeCategory === cat.slug
                  ? "bg-primary-600 text-white"
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-6">
              <div className="w-48 h-32 bg-surface-secondary rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-surface-secondary rounded w-3/4" />
                <div className="h-4 bg-surface-secondary rounded w-full" />
                <div className="h-4 bg-surface-secondary rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary mb-4">{error}</p>
          <button
            onClick={() => { setPage(1); }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary text-lg">
            {search ? "No posts match your search." : activeCategory ? "No posts in this category." : "No posts yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex gap-6 rounded-xl p-4 hover:bg-surface-secondary transition-colors"
              >
                {post.featured_image_url ? (
                  <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-32 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl opacity-30">📄</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-2 text-text-secondary line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-sm text-text-tertiary">
                    {post.author_name && <span>{post.author_name}</span>}
                    {post.author_name && <span>&middot;</span>}
                    <time>
                      {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-12 flex justify-center items-center gap-1" aria-label="Pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-default transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (p === 1 || p === totalPages) return true;
                  if (p === page) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  if (p === 2 && page > 3) return true;
                  if (p === totalPages - 1 && page < totalPages - 2) return true;
                  return false;
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsisBefore = prev !== undefined && p - prev > 1;
                  return (
                    <span key={p} className="contents">
                      {showEllipsisBefore && (
                        <span className="px-1 text-text-tertiary text-sm">&hellip;</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                          p === page
                            ? "bg-primary-600 text-white font-medium"
                            : "text-text-secondary hover:bg-surface-secondary"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-default transition-colors"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
