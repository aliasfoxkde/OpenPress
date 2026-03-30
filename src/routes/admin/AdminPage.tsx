import { useState, useEffect, useCallback } from "react";
import { Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/stores/auth";
import type { UserRole } from "@shared/types";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  minRole: UserRole[];
}

const mainNavItems: NavItem[] = [
  { path: "/admin", label: "Dashboard", icon: "📊", minRole: ["admin", "editor", "author", "contributor", "subscriber", "viewer"] },
  { path: "/admin/content", label: "Content", icon: "📝", minRole: ["admin", "editor", "author", "contributor"] },
  { path: "/admin/media", label: "Media", icon: "🖼️", minRole: ["admin", "editor", "author", "contributor"] },
  { path: "/admin/products", label: "Products", icon: "🛒", minRole: ["admin", "editor"] },
  { path: "/admin/composite", label: "Composites", icon: "🧩", minRole: ["admin", "editor"] },
  { path: "/admin/orders", label: "Orders", icon: "📦", minRole: ["admin", "editor"] },
  { path: "/admin/payments", label: "Payments", icon: "💳", minRole: ["admin"] },
  { path: "/admin/marketing", label: "Marketing", icon: "📣", minRole: ["admin", "editor"] },
  { path: "/admin/comments", label: "Comments", icon: "💬", minRole: ["admin", "editor"] },
  { path: "/admin/ai", label: "AI Assistant", icon: "🤖", minRole: ["admin", "editor", "author"] },
  { path: "/admin/social", label: "Social", icon: "🔗", minRole: ["admin"] },
  { path: "/admin/components", label: "Components", icon: "🧱", minRole: ["admin", "editor"] },
  { path: "/admin/navigation", label: "Navigation", icon: "🧭", minRole: ["admin"] },
  { path: "/admin/users", label: "Users", icon: "👥", minRole: ["admin"] },
  { path: "/admin/taxonomies", label: "Taxonomies", icon: "🏷️", minRole: ["admin", "editor"] },
  { path: "/admin/themes", label: "Themes", icon: "🎨", minRole: ["admin"] },
  { path: "/admin/hero-slides", label: "Hero Slides", icon: "🎬", minRole: ["admin"] },
];

const bottomNavItems: NavItem[] = [
  { path: "/admin/settings", label: "Settings", icon: "⚙️", minRole: ["admin"] },
  { path: "/admin/profile", label: "Profile", icon: "👤", minRole: ["admin", "editor", "author", "contributor", "subscriber", "viewer"] },
];

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={cn("transition-transform duration-200", collapsed ? "rotate-180" : "")}
    >
      <path d="M15 10H5M10 5l-5 5 5 5" />
    </svg>
  );
}

export function AdminPage() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("admin-sidebar-collapsed") === "true"; } catch { return false; }
  });

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [currentPath]);

  const handleLogout = useCallback(() => {
    logout();
    void navigate({ to: "/login" });
  }, [logout, navigate]);

  const visibleMain = mainNavItems.filter((item) => !user || item.minRole.includes(user.role));
  const visibleBottom = bottomNavItems.filter((item) => !user || item.minRole.includes(user.role));

  const navLinkClass = (itemPath: string) =>
    cn(
      "flex items-center gap-3 rounded-md text-sm transition-colors relative",
      collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
      currentPath === itemPath
        ? "bg-primary-100 text-primary-700 font-medium"
        : "text-text-secondary hover:bg-surface-tertiary hover:text-text-primary",
    );

  // ─── Auth guard ────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">Sign in required</h2>
          <p className="text-sm text-text-secondary mb-4">Please log in to access the admin dashboard.</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ─── Desktop sidebar ─────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-surface-secondary transition-all duration-200 shrink-0 overflow-hidden group",
          collapsed ? "w-14" : "w-56",
        )}
      >
        {/* Sidebar header with collapse toggle */}
        <div className="flex items-center justify-between p-2 shrink-0">
          {!collapsed && (
            <h2 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-2 truncate">
              Admin
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors",
              collapsed && "mx-auto",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>

        {/* Main nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {visibleMain.map((item) => (
            <Link key={item.path} to={item.path} className={navLinkClass(item.path)} title={collapsed ? item.label : undefined}>
              <span className="text-base shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom section: settings, profile, logout */}
        <div className="shrink-0 border-t border-border">
          {/* User info */}
          <div className={cn("flex items-center gap-2 px-3 py-2", collapsed && "justify-center px-2")}>
            <div className="w-7 h-7 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-text-primary truncate">{user.name || user.email}</div>
                <div className="text-[10px] text-text-tertiary capitalize">{user.role}</div>
              </div>
            )}
          </div>

          {/* Bottom nav links */}
          <div className="px-2 pb-1 space-y-0.5">
            {visibleBottom.map((item) => (
              <Link key={item.path} to={item.path} className={navLinkClass(item.path)} title={collapsed ? item.label : undefined}>
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-3 rounded-md text-sm transition-colors text-red-500 hover:bg-red-50 hover:text-red-600",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2",
              )}
              title={collapsed ? "Sign out" : undefined}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {!collapsed && <span>Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile drawer overlay ────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setDrawerOpen(false)} />
      )}

      {/* ─── Mobile drawer ───────────────────────────────── */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface-secondary border-r border-border transform transition-transform duration-200 ease-out flex flex-col",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">Admin</h2>
          <button onClick={() => setDrawerOpen(false)} className="p-1 text-text-tertiary hover:text-text-primary" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {visibleMain.map((item) => (
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
        {/* Mobile bottom section */}
        <div className="shrink-0 border-t border-border px-2 pb-2 space-y-0.5">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
              {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-text-primary truncate">{user.name || user.email}</div>
              <div className="text-[10px] text-text-tertiary capitalize">{user.role}</div>
            </div>
          </div>
          {visibleBottom.map((item) => (
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-red-500 hover:bg-red-50 hover:text-red-600 w-full"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main content ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden border-b border-border px-4 py-2 flex items-center gap-3 shrink-0">
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
            {visibleMain.find((i) => i.path === currentPath)?.label || visibleBottom.find((i) => i.path === currentPath)?.label || "Admin"}
          </span>
        </div>
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
