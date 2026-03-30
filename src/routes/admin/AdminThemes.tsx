import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

interface CustomTheme {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  colors: {
    primary: string;
    primaryAccent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  borderRadius: string;
  spacing: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_THEME: CustomTheme = {
  id: "default",
  name: "Default",
  description: "OpenPress default theme",
  version: "1.0.0",
  author: "OpenPress",
  colors: {
    primary: "#4F46E5",
    primaryAccent: "#7C3AED",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#0F172A",
    textSecondary: "#64748B",
    border: "#E2E8F0",
  },
  fonts: {
    heading: "system-ui, -apple-system, sans-serif",
    body: "system-ui, -apple-system, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
  borderRadius: "8px",
  spacing: "4px",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const STORAGE_KEY = "openpress-custom-themes";
const ACTIVE_KEY = "openpress-active-theme";

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

function loadThemes(): CustomTheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [DEFAULT_THEME];
  } catch {
    return [DEFAULT_THEME];
  }
}

function saveThemes(themes: CustomTheme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
}

function loadActiveId(): string {
  return localStorage.getItem(ACTIVE_KEY) || "default";
}

export function AdminThemes() {
  const toast = useToast();
  const [themes, setThemes] = useState<CustomTheme[]>(loadThemes);
  const [activeId, setActiveId] = useState(loadActiveId);
  const [editing, setEditing] = useState<CustomTheme | null>(null);
  const [preview, setPreview] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const activeTheme = themes.find((t) => t.id === activeId) || themes[0];

  useEffect(() => {
    saveThemes(themes);
  }, [themes]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId);
    applyTheme(activeTheme);
  }, [activeId, themes]);

  function applyTheme(theme: CustomTheme) {
    const root = document.documentElement;
    root.style.setProperty("--theme-primary", theme.colors.primary);
    root.style.setProperty("--theme-primary-accent", theme.colors.primaryAccent);
    root.style.setProperty("--theme-bg", theme.colors.background);
    root.style.setProperty("--theme-surface", theme.colors.surface);
    root.style.setProperty("--theme-text", theme.colors.text);
    root.style.setProperty("--theme-text-secondary", theme.colors.textSecondary);
    root.style.setProperty("--theme-border", theme.colors.border);
    root.style.setProperty("--theme-radius", theme.borderRadius);
    root.style.setProperty("--theme-heading-font", theme.fonts.heading);
    root.style.setProperty("--theme-body-font", theme.fonts.body);
    root.style.setProperty("--theme-mono-font", theme.fonts.mono);
  }

  function handleCreate() {
    const newTheme: CustomTheme = {
      ...DEFAULT_THEME,
      id: `custom-${Date.now()}`,
      name: `Custom Theme ${themes.length}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setThemes([...themes, newTheme]);
    setEditing(newTheme);
    setActiveId(newTheme.id);
  }

  function handleSave(updated: CustomTheme) {
    setThemes(themes.map((t) => (t.id === updated.id ? { ...updated, updated_at: new Date().toISOString() } : t)));
    setEditing(null);
    toast("Theme saved", "success");
  }

  function handleDelete(id: string) {
    if (id === "default") return;
    setThemes(themes.filter((t) => t.id !== id));
    if (activeId === id) setActiveId("default");
  }

  function handleDuplicate(theme: CustomTheme) {
    const dup: CustomTheme = {
      ...theme,
      id: `custom-${Date.now()}`,
      name: `${theme.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setThemes([...themes, dup]);
    toast("Theme duplicated", "success");
  }

  function handleExport(theme: CustomTheme) {
    const blob = new Blob([JSON.stringify(theme, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, "-")}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Theme exported", "success");
  }

  function handleExportZip() {
    // Export all themes as a JSON bundle (ZIP requires a library, using JSON for now)
    const bundle = { version: "1.0.0", exported_at: new Date().toISOString(), themes };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openpress-themes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("All themes exported", "success");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (Array.isArray(data)) {
          // Single theme file
          const imported = data.map((t: CustomTheme) => ({ ...t, id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
          setThemes([...themes, ...imported]);
          toast(`Imported ${imported.length} theme(s)`, "success");
        } else if (data.themes && Array.isArray(data.themes)) {
          // Theme bundle
          const imported = data.themes.map((t: CustomTheme) => ({ ...t, id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }));
          setThemes([...themes, ...imported]);
          toast(`Imported ${imported.length} theme(s) from bundle`, "success");
        } else {
          // Single theme object
          const theme = { ...data, id: `custom-${Date.now()}` } as CustomTheme;
          setThemes([...themes, theme]);
          toast("Theme imported", "success");
        }
      } catch {
        toast("Invalid theme file", "error");
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  }

  function handleReset() {
    const root = document.documentElement;
    ["--theme-primary", "--theme-primary-accent", "--theme-bg", "--theme-surface", "--theme-text", "--theme-text-secondary", "--theme-border", "--theme-radius", "--theme-heading-font", "--theme-body-font", "--theme-mono-font"].forEach((v) => root.style.removeProperty(v));
    setActiveId("default");
    toast("Theme reset to default", "success");
  }

  const colorFields: { key: keyof CustomTheme["colors"]; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "primaryAccent", label: "Accent" },
    { key: "background", label: "Background" },
    { key: "surface", label: "Surface" },
    { key: "text", label: "Text" },
    { key: "textSecondary", label: "Text Secondary" },
    { key: "border", label: "Border" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Themes</h1>
        <div className="flex gap-2">
          <button onClick={handleCreate} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
            New Theme
          </button>
          <button onClick={handleExportZip} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
            Export All
          </button>
          <button onClick={() => importRef.current?.click()} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
            Import
          </button>
          <input ref={importRef} type="file" accept=".json,.zip" onChange={handleImport} className="hidden" />
          <button onClick={handleReset} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
            Reset
          </button>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              activeId === theme.id ? "border-primary-500 ring-2 ring-primary-200" : "border-border hover:border-primary-300"
            }`}
            onClick={() => { setActiveId(theme.id); if (!preview) setPreview(true); }}
          >
            {/* Color preview */}
            <div className="flex gap-1 mb-3">
              {Object.values(theme.colors).map((color, i) => (
                <div key={i} className="h-6 flex-1 rounded" style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-text-primary">{theme.name}</div>
                <div className="text-xs text-text-tertiary">{theme.description}</div>
              </div>
              {activeId === theme.id && (
                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">Active</span>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(theme); }}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDuplicate(theme); }} className="text-xs text-text-secondary hover:text-text-primary">
                Duplicate
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleExport(theme); }} className="text-xs text-text-secondary hover:text-text-primary">
                Export
              </button>
              {theme.id !== "default" && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(theme.id); }} className="text-xs text-red-500 hover:text-red-600">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview */}
      {preview && activeTheme && (
        <div className="border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-text-primary">Live Preview</h2>
            <button onClick={() => setPreview(false)} className="text-xs text-text-tertiary hover:text-text-primary">
              Close
            </button>
          </div>
          <div className="rounded-lg border border-border overflow-hidden" style={{ backgroundColor: activeTheme.colors.background }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${activeTheme.colors.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: activeTheme.colors.primary }} />
                <span className="font-bold" style={{ color: activeTheme.colors.primary, fontFamily: activeTheme.fonts.heading }}>
                  {activeTheme.name}
                </span>
              </div>
            </div>
            <div className="p-4" style={{ backgroundColor: activeTheme.colors.surface }}>
              <h3 style={{ color: activeTheme.colors.text, fontFamily: activeTheme.fonts.heading, borderRadius: activeTheme.borderRadius }}>
                Sample Heading
              </h3>
              <p className="mt-2 text-sm" style={{ color: activeTheme.colors.textSecondary, fontFamily: activeTheme.fonts.body }}>
                This is a preview of your theme. Colors, fonts, and spacing are applied in real-time.
              </p>
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1.5 rounded text-sm text-white" style={{ backgroundColor: activeTheme.colors.primary, borderRadius: activeTheme.borderRadius }}>
                  Primary Button
                </button>
                <button className="px-3 py-1.5 rounded text-sm border" style={{ borderColor: activeTheme.colors.border, color: activeTheme.colors.text, borderRadius: activeTheme.borderRadius }}>
                  Secondary
                </button>
              </div>
              <div className="mt-3 p-3 rounded" style={{ border: `1px solid ${activeTheme.colors.border}`, borderRadius: activeTheme.borderRadius }}>
                <code className="text-xs" style={{ color: activeTheme.colors.primary, fontFamily: activeTheme.fonts.mono }}>
                  console.log("Theme preview");
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4 glass-elevated">
            <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-text-primary">Edit Theme</h2>
              <button onClick={() => setEditing(null)} className="text-text-tertiary hover:text-text-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Theme Name</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Description</label>
                <input
                  type="text"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Colors</label>
                <div className="grid grid-cols-2 gap-3">
                  {colorFields.map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-text-tertiary">{label}</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={editing.colors[key]}
                          onChange={(e) => setEditing({ ...editing, colors: { ...editing.colors, [key]: e.target.value } })}
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={editing.colors[key]}
                          onChange={(e) => setEditing({ ...editing, colors: { ...editing.colors, [key]: e.target.value } })}
                          className="flex-1 rounded border border-border px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Typography</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-text-tertiary">Heading Font</label>
                    <input
                      type="text"
                      value={editing.fonts.heading}
                      onChange={(e) => setEditing({ ...editing, fonts: { ...editing.fonts, heading: e.target.value } })}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                      placeholder="system-ui, sans-serif"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary">Body Font</label>
                    <input
                      type="text"
                      value={editing.fonts.body}
                      onChange={(e) => setEditing({ ...editing, fonts: { ...editing.fonts, body: e.target.value } })}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                      placeholder="system-ui, sans-serif"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary">Monospace Font</label>
                    <input
                      type="text"
                      value={editing.fonts.mono}
                      onChange={(e) => setEditing({ ...editing, fonts: { ...editing.fonts, mono: e.target.value } })}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                      placeholder="monospace"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Appearance</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-tertiary">Border Radius</label>
                    <select
                      value={editing.borderRadius}
                      onChange={(e) => setEditing({ ...editing, borderRadius: e.target.value })}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus bg-surface"
                    >
                      <option value="0px">None (sharp)</option>
                      <option value="4px">Small</option>
                      <option value="8px">Medium</option>
                      <option value="12px">Large</option>
                      <option value="16px">Extra Large</option>
                      <option value="9999px">Pill</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-tertiary">Spacing Scale</label>
                    <select
                      value={editing.spacing}
                      onChange={(e) => setEditing({ ...editing, spacing: e.target.value })}
                      className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus bg-surface"
                    >
                      <option value="2px">Compact</option>
                      <option value="4px">Default</option>
                      <option value="6px">Comfortable</option>
                      <option value="8px">Spacious</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleSave(editing)} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors">
                  Save Theme
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
