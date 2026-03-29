import { Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  type: string;
  published_at?: string;
}

export function RootLayout() {
  const routerState = useRouterState();
  const isAdmin = routerState.location.pathname.startsWith("/admin");
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get<{ data: SearchResult[] }>(`/seo/search?q=${encodeURIComponent(q)}&limit=5`);
      setResults(res.data || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-bold text-primary-700">
              OpenPress
            </Link>
            <nav className="flex items-center gap-4">
              {!isAdmin && (
                <>
                  {/* Search */}
                  <div ref={searchRef} className="relative">
                    <button
                      onClick={() => setSearchOpen(!searchOpen)}
                      className="flex items-center gap-2 text-sm text-text-tertiary border border-border rounded-md px-3 py-1.5 hover:border-border-focus transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                      </svg>
                      <span className="hidden sm:inline">Search...</span>
                      <kbd className="hidden sm:inline text-xs bg-surface-secondary px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
                    </button>
                    {searchOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-lg shadow-lg z-50">
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search posts..."
                          autoFocus
                          className="w-full border-b border-border px-4 py-3 text-sm rounded-t-lg focus:outline-none"
                        />
                        <div className="max-h-64 overflow-y-auto">
                          {searching && (
                            <div className="px-4 py-3 text-xs text-text-tertiary">Searching...</div>
                          )}
                          {!searching && query.length >= 2 && results.length === 0 && (
                            <div className="px-4 py-3 text-xs text-text-tertiary">No results found.</div>
                          )}
                          {results.map((r) => (
                            <button
                              key={r.id}
                              onClick={() => {
                                setSearchOpen(false);
                                setQuery("");
                                void navigate({ to: `/blog/${r.slug}` });
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-surface-secondary transition-colors border-b border-border last:border-0"
                            >
                              <div className="text-sm font-medium text-text-primary">{r.title}</div>
                              {r.excerpt && (
                                <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{r.excerpt}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to="/" className={cn("text-sm text-text-secondary hover:text-text-primary transition-colors")}>
                    Home
                  </Link>
                  <Link to="/blog" className={cn("text-sm text-text-secondary hover:text-text-primary transition-colors")}>
                    Blog
                  </Link>
                  <Link to="/shop" className={cn("text-sm text-text-secondary hover:text-text-primary transition-colors")}>
                    Shop
                  </Link>
                  <Link to="/checkout" className={cn("text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1")}>
                    Cart
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                    </svg>
                  </Link>
                </>
              )}
              <Link
                to="/admin"
                className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors"
              >
                {isAdmin ? "View Site" : "Dashboard"}
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
