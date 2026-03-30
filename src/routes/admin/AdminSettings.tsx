import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Settings {
  [key: string]: string;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "OpenPress",
    site_description: "A modern, edge-native CMS",
    permalink_structure: "/post/:slug",
    default_role: "viewer",
    posts_per_page: "20",
    allow_registration: "false",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: Settings }>("/api/settings");
        if (res?.data) setSettings(res.data);
      } catch {
        // ignore - use defaults
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.put("/api/settings", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-text-tertiary text-sm py-8">Loading settings...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Settings</h1>
      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <fieldset className="border border-border rounded-lg p-4">
          <legend className="text-sm font-medium text-text-primary px-2">General</legend>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Site Title</label>
              <input
                type="text"
                value={settings.site_name || ""}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Site Description</label>
              <textarea
                rows={2}
                value={settings.site_description || ""}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Posts Per Page</label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.posts_per_page || "20"}
                onChange={(e) => setSettings({ ...settings, posts_per_page: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-border rounded-lg p-4">
          <legend className="text-sm font-medium text-text-primary px-2">Permalinks</legend>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="permalink"
                checked={settings.permalink_structure === "/post/:slug"}
                onChange={() => setSettings({ ...settings, permalink_structure: "/post/:slug" })}
              />
              <span>/post/:slug</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="permalink"
                checked={settings.permalink_structure === "/:year/:month/:slug"}
                onChange={() => setSettings({ ...settings, permalink_structure: "/:year/:month/:slug" })}
              />
            </label>
            <span>/:year/:month/:slug</span>
          </div>
        </fieldset>

        <fieldset className="border border-border rounded-lg p-4">
          <legend className="text-sm font-medium text-text-primary px-2">Registration</legend>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.allow_registration === "true"}
                onChange={(e) => setSettings({ ...settings, allow_registration: e.target.checked ? "true" : "false" })}
              />
              <span>Allow public registration</span>
            </label>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Default Role for New Users</label>
              <select
                value={settings.default_role || "viewer"}
                onChange={(e) => setSettings({ ...settings, default_role: e.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus bg-surface"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="author">Author</option>
                <option value="contributor">Contributor</option>
                <option value="subscriber">Subscriber</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary-600 text-white px-6 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {saved && <span className="text-sm text-green-600">Settings saved.</span>}
        </div>
      </form>
    </div>
  );
}
