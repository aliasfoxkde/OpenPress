import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";

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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function BlogPage() {
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState("");

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
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12" });
        if (activeCategory) params.set("category", activeCategory);
        const res = await api.get(`/api/content?${params}`);
        setPosts(res.data || []);
        if (res.pagination) setTotalPages(res.pagination.totalPages);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, [page, activeCategory]);

  function handleCategoryClick(slug: string) {
    setActiveCategory(slug === activeCategory ? "" : slug);
    setPage(1);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Blog</h1>
        <p className="mt-2 text-text-secondary">Latest posts and updates</p>
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
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary text-lg">
            {activeCategory ? "No posts in this category." : "No posts yet."}
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
                  <time className="mt-2 block text-sm text-text-tertiary">
                    {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
