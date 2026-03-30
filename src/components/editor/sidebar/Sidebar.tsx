import { useState, useEffect } from "react";

interface SidebarProps {
  children: React.ReactNode;
}

interface SidebarContextValue {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  collapsed: boolean;
}

export const SidebarContext = React.createContext<SidebarContextValue>({
  activePanel: null,
  setActivePanel: () => {},
  collapsed: false,
});

import React from "react";

const panels = [
  { id: "document", label: "Document", icon: "📄" },
  { id: "featured-image", label: "Featured Image", icon: "🖼️" },
  { id: "taxonomy", label: "Categories & Tags", icon: "🏷️" },
  { id: "seo", label: "SEO", icon: "🔍" },
  { id: "ai", label: "AI Assistant", icon: "🤖" },
] as const;

export function Sidebar({ children }: SidebarProps) {
  const [activePanel, setActivePanel] = useState<string | null>("document");
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("admin-editor-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("admin-editor-sidebar-collapsed", String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  return (
    <SidebarContext.Provider value={{ activePanel, setActivePanel, collapsed }}>
      <aside
        className={`shrink-0 border-l border-border bg-surface flex flex-col transition-all duration-200 ${
          collapsed ? "w-12" : "w-72"
        }`}
      >
        {/* Panel tabs */}
        <div className="flex flex-col gap-0.5 p-1 border-b border-border">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(activePanel === panel.id ? null : panel.id)}
              title={panel.label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                activePanel === panel.id
                  ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-text-secondary hover:bg-surface-secondary"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className="text-sm flex-shrink-0">{panel.icon}</span>
              {!collapsed && <span>{panel.label}</span>}
            </button>
          ))}
        </div>

        {/* Active panel content */}
        {!collapsed && activePanel && (
          <div className="flex-1 overflow-y-auto p-3">
            {children}
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="shrink-0 border-t border-border px-2 py-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-center"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
      </aside>
    </SidebarContext.Provider>
  );
}
