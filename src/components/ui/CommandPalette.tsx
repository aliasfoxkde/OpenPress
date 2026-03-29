import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { api } from "@/lib/api";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  action: () => void;
  icon?: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isAdmin = routerState.location.pathname.startsWith("/admin");

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setResults(getStaticCommands());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search when query changes
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults(getStaticCommands());
      setSelectedIndex(0);
      return;
    }
    const q = query.toLowerCase();
    const timer = setTimeout(() => void doSearch(q), 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  async function doSearch(q: string) {
    setSearching(true);
    try {
      const res = await api.get<{ data: Array<{ id: string; slug: string; title: string; type: string; excerpt?: string }> }>(
        `/seo/search?q=${encodeURIComponent(q)}&limit=5`
      );
      const searchResults: CommandItem[] = (res.data || []).map((r) => ({
        id: `search-${r.id}`,
        label: r.title,
        group: "Search Results",
        action: () => { setOpen(false); void navigate({ to: `/blog/${r.slug}` }); },
        icon: "📄",
      }));
      const filtered = getStaticCommands().filter(
        (cmd) => cmd.label.toLowerCase().includes(q) || cmd.group.toLowerCase().includes(q)
      );
      setResults([...filtered, ...searchResults]);
    } catch {
      setResults(getStaticCommands().filter(
        (cmd) => cmd.label.toLowerCase().includes(q) || cmd.group.toLowerCase().includes(q)
      ));
    } finally {
      setSearching(false);
    }
  }

  function getStaticCommands(): CommandItem[] {
    const close = () => setOpen(false);
    if (isAdmin) {
      return [
        { id: "nav-dashboard", label: "Go to Dashboard", group: "Navigation", action: () => { close(); void navigate({ to: "/admin" }); }, icon: "📊" },
        { id: "nav-content", label: "Go to Content", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/content" }); }, icon: "📝" },
        { id: "nav-media", label: "Go to Media", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/media" }); }, icon: "🖼️" },
        { id: "nav-products", label: "Go to Products", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/products" }); }, icon: "🛒" },
        { id: "nav-orders", label: "Go to Orders", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/orders" }); }, icon: "📦" },
        { id: "nav-comments", label: "Go to Comments", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/comments" }); }, icon: "💬" },
        { id: "nav-users", label: "Go to Users", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/users" }); }, icon: "👥" },
        { id: "nav-settings", label: "Go to Settings", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/settings" }); }, icon: "⚙️" },
        { id: "nav-profile", label: "Go to Profile", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/profile" }); }, icon: "👤" },
        { id: "nav-ai", label: "Go to AI Assistant", group: "Navigation", action: () => { close(); void navigate({ to: "/admin/ai" }); }, icon: "🤖" },
        { id: "action-new-post", label: "New Post", group: "Actions", action: () => { close(); void navigate({ to: "/admin/content/edit" }); }, icon: "➕" },
        { id: "action-view-site", label: "View Site", group: "Actions", action: () => { close(); void navigate({ to: "/" }); }, icon: "🌐" },
      ];
    }
    return [
      { id: "nav-home", label: "Go to Home", group: "Navigation", action: () => { close(); void navigate({ to: "/" }); }, icon: "🏠" },
      { id: "nav-blog", label: "Go to Blog", group: "Navigation", action: () => { close(); void navigate({ to: "/blog" }); }, icon: "📰" },
      { id: "nav-shop", label: "Go to Shop", group: "Navigation", action: () => { close(); void navigate({ to: "/shop" }); }, icon: "🛍️" },
      { id: "nav-checkout", label: "Go to Cart", group: "Navigation", action: () => { close(); void navigate({ to: "/checkout" }); }, icon: "🛒" },
      { id: "action-dashboard", label: "Go to Dashboard", group: "Actions", action: () => { close(); void navigate({ to: "/admin" }); }, icon: "📊" },
    ];
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      results[selectedIndex].action();
    }
  }

  function handleSelect(item: CommandItem) {
    item.action();
  }

  // Group results
  const groups = new Map<string, CommandItem[]>();
  for (const item of results) {
    const existing = groups.get(item.group) || [];
    existing.push(item);
    groups.set(item.group, existing);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary shrink-0">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAdmin ? "Search commands and content..." : "Search posts..."}
            className="flex-1 py-3.5 text-sm bg-transparent focus:outline-none text-text-primary placeholder:text-text-tertiary"
          />
          <kbd className="text-[10px] text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-2">
          {searching && (
            <div className="px-4 py-6 text-center text-xs text-text-tertiary">Searching...</div>
          )}
          {!searching && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-6 text-center text-xs text-text-tertiary">No results found.</div>
          )}
          {!searching && results.length === 0 && query.trim().length < 2 && (
            <div className="px-4 py-2 text-xs text-text-tertiary">Type to search...</div>
          )}
          {Array.from(groups.entries()).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                {group}
              </div>
              {items.map((item) => {
                const globalIndex = results.indexOf(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                      globalIndex === selectedIndex
                        ? "bg-primary-100 text-primary-800"
                        : "text-text-primary hover:bg-surface-secondary"
                    }`}
                  >
                    {item.icon && <span className="text-base">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center gap-4 text-[10px] text-text-tertiary">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
