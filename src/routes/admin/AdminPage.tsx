import { useState, useEffect } from "react";
import { Outlet, Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth";
import type { UserRole } from "@shared/types";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  minRole: UserRole[];
}

const navItems: NavItem[] = [
  { path: "/admin", label: "Dashboard", icon: "📊", minRole: ["admin", "editor", "author", "contributor", "subscriber", "viewer"] },
  { path: "/admin/content", label: "Content", icon: "📝", minRole: ["admin", "editor", "author", "contributor"] },
  { path: "/admin/media", label: "Media", icon: "🖼️", minRole: ["admin", "editor", "author", "contributor"] },
  { path: "/admin/products", label: "Products", icon: "🛒", minRole: ["admin", "editor"] },
  { path: "/admin/orders", label: "Orders", icon: "📦", minRole: ["admin", "editor"] },
  { path: "/admin/comments", label: "Comments", icon: "💬", minRole: ["admin", "editor"] },
  { path: "/admin/ai", label: "AI Assistant", icon: "🤖", minRole: ["admin", "editor", "author"] },
  { path: "/admin/users", label: "Users", icon: "👥", minRole: ["admin"] },
  { path: "/admin/taxonomies", label: "Taxonomies", icon: "🏷️", minRole: ["admin", "editor"] },
  { path: "/admin/settings", label: "Settings", icon: "⚙️", minRole: ["admin"] },
  { path: "/admin/profile", label: "Profile", icon: "👤", minRole: ["admin", "editor", "author", "contributor", "subscriber", "viewer"] },
];

export function AdminPage() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const user = useAuthStore((s) => s.user);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const visibleItems = navItems.filter(
    (item) => !user || item.minRole.includes(user.role),
  );

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPath]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 border-r border-border bg-surface-secondary flex-col">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
            Admin
          </h2>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                currentPath === item.path
                  ? "bg-primary-100 text-primary-700 font-medium"
                  : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-text-tertiary">
              Role: <span className="capitalize font-medium text-text-secondary">{user.role}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface-secondary border-r border-border transform transition-transform duration-200 ease-out flex flex-col",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">Admin</h2>
          <button onClick={() => setDrawerOpen(false)} className="p-1 text-text-tertiary hover:text-text-primary" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                currentPath === item.path
                  ? "bg-primary-100 text-primary-700 font-medium"
                  : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="p-4 border-t border-border">
            <div className="text-xs text-text-tertiary">
              Role: <span className="capitalize font-medium text-text-secondary">{user.role}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="md:hidden border-b border-border px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h14M3 10h14M3 14h14" />
            </svg>
          </button>
          <span className="text-sm font-medium text-text-primary">
            {visibleItems.find((i) => i.path === currentPath)?.label || "Admin"}
          </span>
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
