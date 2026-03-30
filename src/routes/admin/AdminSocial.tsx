import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon: string | null;
  label: string | null;
  is_active: number;
  sort_order: number;
  created_at: string;
}

interface Integration {
  id: string;
  service: string;
  name: string;
  is_enabled: number;
  config: string;
  settings: string;
  last_sync_at: string | null;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  twitter: "𝕏",
  facebook: "f",
  instagram: "📷",
  linkedin: "in",
  youtube: "▶",
  tiktok: "♪",
  github: "⌨",
  github_alt: "🐙",
  threads: "🧵",
  pinterest: "📌",
  reddit: "🔴",
  mastodon: "🐘",
  bluesky: "🦋",
  email: "✉",
  phone: "📞",
};

export function AdminSocial() {
  const toast = useToast();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"links" | "integrations">("links");
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Link form
  const [linkPlatform, setLinkPlatform] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkIcon, setLinkIcon] = useState("");
  const [adding, setAdding] = useState(false);

  // Integration form
  const [intName, setIntName] = useState("");
  const [intService, setIntService] = useState("");
  const [intConfig, setIntConfig] = useState("{}");
  const [addingInt, setAddingInt] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [linkRes, intRes] = await Promise.all([
        api.get<{ data: SocialLink[] }>("/social/admin/social").catch(() => null),
        api.get<{ data: Integration[] }>("/social/admin/integrations").catch(() => null),
      ]);
      setLinks(linkRes?.data || []);
      setIntegrations(intRes?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  async function addLink() {
    if (!linkPlatform.trim() || !linkUrl.trim()) return;
    setAdding(true);
    try {
      await api.post("/social/admin/social", {
        platform: linkPlatform.trim(),
        url: linkUrl.trim(),
        label: linkLabel.trim() || null,
        icon: linkIcon.trim() || null,
      });
      toast("Social link added", "success");
      setShowAddLink(false);
      setLinkPlatform("");
      setLinkUrl("");
      setLinkLabel("");
      setLinkIcon("");
      await fetchData();
    } catch {
      toast("Failed to add link", "error");
    } finally {
      setAdding(false);
    }
  }

  async function addIntegration() {
    if (!intName.trim() || !intService.trim()) return;
    setAddingInt(true);
    try {
      await api.post("/social/admin/integrations", {
        name: intName.trim(),
        service: intService.trim(),
        config: intConfig,
      });
      toast("Integration added", "success");
      setShowAddIntegration(false);
      setIntName("");
      setIntService("");
      setIntConfig("{}");
      await fetchData();
    } catch {
      toast("Failed to add integration", "error");
    } finally {
      setAddingInt(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "link") {
        await api.delete(`/social/admin/social/${deleteTarget.id}`);
      } else {
        await api.delete(`/social/admin/integrations/${deleteTarget.id}`);
      }
      setDeleteTarget(null);
      toast("Removed", "success");
      await fetchData();
    } catch {
      toast("Failed to remove", "error");
    }
  }

  async function toggleLink(id: string, current: number) {
    try {
      await api.put(`/social/admin/social/${id}`, { is_active: current ? 0 : 1 });
      await fetchData();
    } catch {
      toast("Failed to update", "error");
    }
  }

  async function toggleIntegration(id: string, current: number) {
    try {
      await api.put(`/social/admin/integrations/${id}`, { is_enabled: current ? 0 : 1 });
      await fetchData();
    } catch {
      toast("Failed to update", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Social & Integrations</h1>
        {activeTab === "links" ? (
          <button onClick={() => setShowAddLink(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
            Add Link
          </button>
        ) : (
          <button onClick={() => setShowAddIntegration(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
            Add Integration
          </button>
        )}
      </div>

      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {(["links", "integrations"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize ${
                activeTab === tab ? "border-primary-500 text-primary-600" : "border-transparent text-text-tertiary hover:border-border hover:text-text-secondary"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-surface-secondary rounded-lg" />
          ))}
        </div>
      ) : activeTab === "links" ? (
        <>
          {showAddLink && (
            <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
              <h3 className="font-semibold text-text-primary mb-4">Add Social Link</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Platform *</label>
                  <select value={linkPlatform} onChange={(e) => setLinkPlatform(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                    <option value="">Select platform...</option>
                    {Object.keys(PLATFORM_ICONS).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">URL *</label>
                  <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Label</label>
                  <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="Display text (optional)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Custom Icon</label>
                  <input value={linkIcon} onChange={(e) => setLinkIcon(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="SVG path or emoji" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => void addLink()} disabled={adding} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {adding ? "Adding..." : "Add"}
                </button>
                <button onClick={() => setShowAddLink(false)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {links.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">No social links configured. Add links to display on your website.</div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="border border-border rounded-lg bg-surface px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center rounded bg-surface-secondary text-sm">
                      {link.icon || PLATFORM_ICONS[link.platform] || "🔗"}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-text-primary capitalize">{link.label || link.platform}</div>
                      <div className="text-xs text-text-tertiary truncate max-w-xs">{link.url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => void toggleLink(link.id, link.is_active)} className={`text-xs px-2 py-1 rounded-full font-medium ${link.is_active ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
                      {link.is_active ? "Active" : "Hidden"}
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "link", id: link.id })} className="text-xs text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {showAddIntegration && (
            <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
              <h3 className="font-semibold text-text-primary mb-4">Add Integration</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Service Name *</label>
                  <input value={intName} onChange={(e) => setIntName(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="Google Analytics" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Service ID *</label>
                  <input value={intService} onChange={(e) => setIntService(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="google_analytics" />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-text-secondary mb-1">Configuration (JSON)</label>
                <textarea value={intConfig} onChange={(e) => setIntConfig(e.target.value)} rows={4} className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none" placeholder='{"tracking_id": "..."}' />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => void addIntegration()} disabled={addingInt} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
                  {addingInt ? "Adding..." : "Add"}
                </button>
                <button onClick={() => setShowAddIntegration(false)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {integrations.length === 0 ? (
            <div className="text-center py-12 text-text-tertiary">No integrations configured. Connect third-party services.</div>
          ) : (
            <div className="space-y-2">
              {integrations.map((integ) => (
                <div key={integ.id} className="border border-border rounded-lg bg-surface px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-text-primary">{integ.name}</div>
                    <div className="text-xs text-text-tertiary">
                      {integ.service} {integ.last_sync_at && `· Last synced ${new Date(integ.last_sync_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => void toggleIntegration(integ.id, integ.is_enabled)} className={`text-xs px-2 py-1 rounded-full font-medium ${integ.is_enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
                      {integ.is_enabled ? "Connected" : "Disconnected"}
                    </button>
                    <button onClick={() => setDeleteTarget({ type: "integration", id: integ.id })} className="text-xs text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Item"
        message="Are you sure you want to remove this item?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
