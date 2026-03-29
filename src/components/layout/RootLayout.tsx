import { Outlet, Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

export function RootLayout() {
  const routerState = useRouterState();
  const isAdmin = routerState.location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-surface sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-bold text-primary-700">
              OpenPress
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className={cn(
                  "text-sm text-text-secondary hover:text-text-primary transition-colors",
                )}
              >
                Home
              </Link>
              <Link
                to="/blog"
                className={cn(
                  "text-sm text-text-secondary hover:text-text-primary transition-colors",
                )}
              >
                Blog
              </Link>
              <Link
                to="/shop"
                className={cn(
                  "text-sm text-text-secondary hover:text-text-primary transition-colors",
                )}
              >
                Shop
              </Link>
              {!isAdmin && (
                <Link
                  to="/admin"
                  className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
