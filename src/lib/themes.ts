/**
 * OpenPress Theme System
 * React themes with configurable layouts, colors, and fonts
 */

export interface ThemeConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  layouts: string[];
  colors: Record<string, string>;
  fonts?: Record<string, string>;
  components?: Record<string, React.ComponentType>;
}

type ThemeListener = (theme: ThemeConfig) => void;

class ThemeManager {
  private themes: Map<string, ThemeConfig> = new Map();
  private active: ThemeConfig | null = null;
  private listeners: Set<ThemeListener> = new Set();

  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.id, theme);
    // Auto-activate first theme if none active
    if (!this.active) {
      this.activate(theme.id);
    }
  }

  unregisterTheme(id: string): void {
    this.themes.delete(id);
    if (this.active?.id === id) {
      const remaining = Array.from(this.themes.values());
      this.active = remaining[0] || null;
      if (this.active) this.notify();
    }
  }

  activate(id: string): boolean {
    const theme = this.themes.get(id);
    if (!theme) return false;
    this.active = theme;
    this.applyCSS(theme);
    this.notify();
    return true;
  }

  getActive(): ThemeConfig | null {
    return this.active;
  }

  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }

  subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private applyCSS(theme: ThemeConfig): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.colors)) {
      root.style.setProperty(`--theme-${key}`, value);
    }
    if (theme.fonts) {
      for (const [key, value] of Object.entries(theme.fonts)) {
        root.style.setProperty(`--theme-font-${key}`, value);
      }
    }
  }

  private notify(): void {
    if (this.active) {
      for (const listener of this.listeners) {
        listener(this.active);
      }
    }
  }
}

// ── Default theme ──────────────────────────────────────────────────

const defaultTheme: ThemeConfig = {
  id: "default",
  name: "Default Theme",
  version: "1.0.0",
  description: "Clean, modern default theme",
  layouts: ["default", "full-width", "sidebar"],
  colors: {
    primary: "#4F46E5",
    secondary: "#7C3AED",
    accent: "#06B6D4",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#0F172A",
    "text-secondary": "#64748B",
    border: "#E2E8F0",
  },
  fonts: {
    sans: "Inter, system-ui, sans-serif",
    mono: "JetBrains Mono, monospace",
  },
};

// ── Singleton ──────────────────────────────────────────────────────

export const themes = new ThemeManager();
themes.registerTheme(defaultTheme);
export default themes;
