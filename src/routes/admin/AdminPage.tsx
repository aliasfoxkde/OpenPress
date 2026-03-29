import { Outlet, Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/cn";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: "📊" },
  { path: "/admin/content", label: "Content", icon: "📝" },
  { path: "/admin/media", label: "Media", icon: "🖼️" },
  { path: "/admin/users", label: "Users", icon: "👥" },
  { path: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function AdminPage() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden md:flex w-56 border-r border-border bg-surface-secondary flex-col">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
            Admin
          </h2>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {navItems.map((item) => (
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
      </aside>

      <div className="flex-1 flex flex-col">
        <div className="md:hidden border-b border-border px-4 py-2">
          <select
            value={currentPath}
            onChange={(e) => {
              window.location.href = e.target.value;
            }}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {navItems.map((item) => (
              <option key={item.path} value={item.path}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
