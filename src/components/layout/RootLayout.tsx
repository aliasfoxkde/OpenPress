import { Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, Suspense } from "react";
import { cn } from "@/lib/cn";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { CodeEditorPanel } from "@/components/editor/CodeEditorPanel";
import { useCartStore } from "@/stores/cart";
import { useAnalytics } from "@/lib/analytics";
import { useTheme } from "@/hooks/useTheme";
import { BackToTop } from "@/components/ui/BackToTop";

function RouteLoader() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {open ? (
        <>
          <path d="M5 5l10 10M15 5L5 15" />
        </>
      ) : (
        <>
          <path d="M3 6h14M3 10h14M3 14h14" />
        </>
      )}
    </svg>
  );
}

function OpenPressLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" opacity="0.1" />
      <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 10h12v2H10z" fill="currentColor" opacity="0.3" />
      <path d="M10 15h8v2H10z" fill="currentColor" opacity="0.25" />
      <path d="M10 20h10v2H10z" fill="currentColor" opacity="0.2" />
      <circle cx="23" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M23 18v4M21 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RootLayout() {
  const routerState = useRouterState();
  const isAdmin = routerState.location.pathname.startsWith("/admin");
  const cartItemCount = useCartStore((s) => s.itemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Analytics (page view tracking)
  useAnalytics();

  // Theme mode (auto/light/dark/liquid-glass)
  const { mode, cycleMode } = useTheme();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [routerState.location.pathname]);

  // Ctrl+Shift+E to toggle code editor
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "E") {
        e.preventDefault();
        setCodeEditorOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Scroll-based header shrink
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <ToastProvider>
    <CommandPalette />
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border bg-surface/95 shadow-sm"
            : "border-b border-border bg-surface shadow-none"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between transition-all duration-300",
            scrolled ? "h-14" : "h-16"
          )}>
            <Link to="/" className="flex items-center gap-2.5 group">
              <OpenPressLogo className={cn(
                "text-primary-600 transition-all duration-300 shrink-0",
                scrolled ? "w-6 h-6" : "w-8 h-8"
              )} />
              <span className={cn(
                "font-bold text-primary-700 transition-all duration-300 origin-left",
                scrolled ? "text-lg" : "text-2xl"
              )}>
                OpenPress
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-1.5 text-text-tertiary hover:text-text-primary transition-colors"
                aria-label="Toggle menu"
              >
                <HamburgerIcon open={mobileMenuOpen} />
              </button>

              {/* Search trigger */}
              <button
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true }));
                }}
                className="hidden sm:flex items-center gap-2 text-sm text-text-tertiary border border-border rounded-md px-3 py-1.5 hover:border-border-focus transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                <span className="hidden sm:inline">Search...</span>
                <kbd className="hidden sm:inline text-xs bg-surface-secondary px-1.5 py-0.5 rounded ml-2">⌘K</kbd>
              </button>

              <Link to="/" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                Home
              </Link>
              <Link to="/blog" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                Blog
              </Link>
              <Link to="/shop" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                Shop
              </Link>
              <Link to="/templates" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                Templates
              </Link>
              <Link to="/components" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                Components
              </Link>
              <Link to="/docs/api" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                API Docs
              </Link>
              <Link to="/docs/tutorial" className="hidden sm:block text-sm text-text-secondary hover:text-text-primary transition-colors">
                Tutorial
              </Link>
              <Link to="/checkout" className="hidden sm:flex text-sm text-text-secondary hover:text-text-primary transition-colors items-center gap-1 relative">
                Cart
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center leading-none px-1">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Link>
              {/* Mobile cart icon */}
              <Link to="/checkout" className="sm:hidden relative p-1.5 text-text-tertiary hover:text-text-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center leading-none px-1">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Link>
              {/* Code editor toggle (admin only) */}
              {isAdmin && (
                <button
                  onClick={() => setCodeEditorOpen(!codeEditorOpen)}
                  className={cn(
                    "flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md transition-colors",
                    codeEditorOpen
                      ? "bg-primary-100 text-primary-700 font-medium"
                      : "text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
                  )}
                  title="Custom Code Editor (Ctrl+Shift+E)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  <span className="hidden sm:inline">Code</span>
                </button>
              )}
              <button
                onClick={cycleMode}
                className="text-sm text-text-tertiary hover:text-text-primary transition-colors p-1.5"
                title={`Theme: ${mode === "auto" ? "Auto (System)" : mode === "liquid-glass" ? "Liquid Glass" : mode.charAt(0).toUpperCase() + mode.slice(1)}`}
              >
                {mode === "auto" ? (
                  /* Monitor icon — auto follows system */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
                  </svg>
                ) : mode === "light" ? (
                  /* Sun icon */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : mode === "dark" ? (
                  /* Moon icon */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                ) : (
                  /* Diamond/gem icon — Liquid Glass */
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20"/><path d="M10 3l-4 6 6 13"/><path d="M14 3l4 6-6 13"/>
                  </svg>
                )}
              </button>
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

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border bg-surface px-4 py-3 space-y-2">
          <button
            onClick={() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 text-sm text-text-tertiary w-full px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            Search...
          </button>
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Home
          </Link>
          <Link
            to="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Blog
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Shop
          </Link>
          <Link
            to="/templates"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Templates
          </Link>
          <Link
            to="/components"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Components
          </Link>
          <Link
            to="/docs/api"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            API Docs
          </Link>
          <Link
            to="/docs/tutorial"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Tutorial
          </Link>
          <Link
            to="/checkout"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm text-text-secondary hover:text-text-primary px-3 py-2 rounded-md hover:bg-surface-secondary"
          >
            Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ""}
          </Link>
        </div>
      )}

      <Suspense fallback={<RouteLoader />}>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </Suspense>

      {/* Footer (public pages only) */}
      {!isAdmin && (
        <footer className="border-t border-border bg-surface-secondary shrink-0">
          {/* Main footer content */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Column 1: Brand */}
              <div>
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <svg viewBox="0 0 32 32" className="w-8 h-8 text-primary-600" fill="none">
                    <rect x="2" y="2" width="28" height="28" rx="6" fill="currentColor" opacity="0.1" />
                    <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M10 10h12v2H10z" fill="currentColor" opacity="0.3" />
                    <path d="M10 15h8v2H10z" fill="currentColor" opacity="0.25" />
                    <path d="M10 20h10v2H10z" fill="currentColor" opacity="0.2" />
                    <circle cx="23" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M23 18v4M21 20h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="font-bold text-text-primary text-lg">OpenPress</span>
                </Link>
                <p className="text-sm text-text-secondary leading-relaxed">
                  A modern, open-source CMS built on Cloudflare's edge network. Fast, free, and infinitely extensible.
                </p>
              </div>

              {/* Column 2: Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Navigation</h3>
                <ul className="space-y-2.5">
                  <li><Link to="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Home</Link></li>
                  <li><Link to="/blog" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Blog</Link></li>
                  <li><Link to="/shop" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Shop</Link></li>
                  <li><Link to="/templates" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Templates</Link></li>
                  <li><Link to="/components" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Components</Link></li>
                  <li><Link to="/checkout" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Cart</Link></li>
                </ul>
              </div>

              {/* Column 3: Resources */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Resources</h3>
                <ul className="space-y-2.5">
                  <li><Link to="/docs/api" className="text-sm text-text-secondary hover:text-text-primary transition-colors">API Documentation</Link></li>
                  <li><Link to="/docs/tutorial" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Setup Tutorial</Link></li>
                  <li>
                    <a href="https://github.com/aliasfoxkde/OpenPress" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                      RSS Feed
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 4: Contact / Social */}
              <div>
                <h3 className="text-sm font-semibold text-text-primary mb-4">Connect</h3>
                <ul className="space-y-2.5">
                  <li>
                    <a href="https://github.com/aliasfoxkde/OpenPress" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-1.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.089-.745-2.089-.162-2.089-.162 0-1.186.013-2.689.003-3.074C7.793 5.07 7.5 5.557 7.5 5.557 1.128-.18 2.316-.562 3.5-.934.108.778.417 1.305.76 1.605-2.665.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="/feed.xml" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 11a9 9 0 0 1 9 9 9 9 0 0 1-18 0" /><line x1="4" y1="11" x2="20" y2="11" />
                      </svg>
                      RSS
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="bg-primary-900 border-t border-primary-800">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-xs text-primary-200">
                &copy; {new Date().getFullYear()} OpenPress. Open source, MIT license.
              </div>
              <div className="text-xs text-primary-300">
                This Application was Developed with TaskWizer AI technologies.
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
    <CodeEditorPanel open={codeEditorOpen} onClose={() => setCodeEditorOpen(false)} />
    <BackToTop />
    </ToastProvider>
  );
}
