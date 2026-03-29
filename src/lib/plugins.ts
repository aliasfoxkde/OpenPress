/**
 * OpenPress Plugin System
 * WordPress-inspired hook/filter system in TypeScript
 */

type Callback = (...args: unknown[]) => unknown;

interface HookEntry {
  callback: Callback;
  priority: number;
}

class PluginRegistry {
  private actions: Map<string, HookEntry[]> = new Map();
  private filters: Map<string, HookEntry[]> = new Map();
  private plugins: Map<string, PluginMeta> = new Map();

  // ── Actions (fire-and-forget) ──────────────────────────────────────

  addAction(hook: string, callback: Callback, priority = 10): void {
    const entries = this.actions.get(hook) || [];
    entries.push({ callback, priority });
    entries.sort((a, b) => a.priority - b.priority);
    this.actions.set(hook, entries);
  }

  removeAction(hook: string, callback: Callback): void {
    const entries = this.actions.get(hook);
    if (entries) {
      this.actions.set(
        hook,
        entries.filter((e) => e.callback !== callback),
      );
    }
  }

  async doAction(hook: string, ...args: unknown[]): Promise<void> {
    const entries = this.actions.get(hook) || [];
    for (const entry of entries) {
      try {
        await entry.callback(...args);
      } catch (err) {
        console.error(`[PluginSystem] Action "${hook}" error:`, err);
      }
    }
  }

  // ── Filters (transform data) ──────────────────────────────────────

  addFilter(hook: string, callback: Callback, priority = 10): void {
    const entries = this.filters.get(hook) || [];
    entries.push({ callback, priority });
    entries.sort((a, b) => a.priority - b.priority);
    this.filters.set(hook, entries);
  }

  removeFilter(hook: string, callback: Callback): void {
    const entries = this.filters.get(hook);
    if (entries) {
      this.filters.set(
        hook,
        entries.filter((e) => e.callback !== callback),
      );
    }
  }

  async applyFilters<T>(hook: string, value: T, ...args: unknown[]): Promise<T> {
    const entries = this.filters.get(hook) || [];
    let result = value;
    for (const entry of entries) {
      try {
        result = (await entry.callback(result, ...args)) as T;
      } catch (err) {
        console.error(`[PluginSystem] Filter "${hook}" error:`, err);
      }
    }
    return result;
  }

  // ── Plugin registration ───────────────────────────────────────────

  registerPlugin(plugin: PluginMeta): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginSystem] Plugin "${plugin.id}" already registered`);
      return;
    }
    this.plugins.set(plugin.id, plugin);
    plugin.init(this);
  }

  unregisterPlugin(id: string): void {
    const plugin = this.plugins.get(id);
    if (plugin?.destroy) plugin.destroy(this);
    this.plugins.delete(id);
  }

  getPlugins(): PluginMeta[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): PluginMeta | undefined {
    return this.plugins.get(id);
  }
}

// ── Types ──────────────────────────────────────────────────────────

export interface PluginMeta {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  init: (registry: PluginRegistry) => void;
  destroy?: (registry: PluginRegistry) => void;
}

// ── Singleton ──────────────────────────────────────────────────────

export const plugins = new PluginRegistry();
export default plugins;
