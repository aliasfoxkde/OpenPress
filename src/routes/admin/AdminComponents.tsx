import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ReusableComponent {
  id: string;
  name: string;
  slug: string;
  type: string;
  category: string;
  description: string | null;
  template: string;
  config_schema: string;
  is_enabled: number;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = ["general", "forms", "social", "cta", "media", "custom"];
const TYPES = ["widget", "section", "block", "embed"];

export function AdminComponents() {
  const toast = useToast();
  const [items, setItems] = useState<ReusableComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newType, setNewType] = useState("widget");
  const [newCategory, setNewCategory] = useState("general");
  const [newDesc, setNewDesc] = useState("");
  const [newTemplate, setNewTemplate] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchComponents() {
    setLoading(true);
    try {
      const res = await api.get<{ data: ReusableComponent[] }>("/components/admin/components").catch(() => null);
      setItems(res?.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchComponents();
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/components/admin/components", {
        name: newName.trim(),
        slug: newSlug.trim() || newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: newType,
        category: newCategory,
        description: newDesc.trim() || null,
        template: newTemplate,
        config_schema: "{}",
      });
      toast("Component created", "success");
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      setNewDesc("");
      setNewTemplate("");
      await fetchComponents();
    } catch {
      toast("Failed to create component", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/components/admin/components/${deleteTarget}`);
      setDeleteTarget(null);
      toast("Component deleted", "success");
      await fetchComponents();
    } catch {
      toast("Failed to delete", "error");
    }
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await api.put(`/components/admin/components/${editingId}`, { template: editTemplate });
      toast("Template saved", "success");
      setEditingId(null);
      await fetchComponents();
    } catch {
      toast("Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function duplicate(id: string) {
    try {
      await api.post(`/components/admin/components/${id}/duplicate`);
      toast("Component duplicated", "success");
      await fetchComponents();
    } catch {
      toast("Failed to duplicate", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Reusable Components</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          New Component
        </button>
      </div>

      <div className="mb-4 border border-border rounded-lg bg-surface-secondary p-4">
        <p className="text-sm text-text-secondary">
          Components can be embedded in content using template tags like{" "}
          <code className="bg-surface px-1.5 py-0.5 rounded text-xs font-mono text-primary-700">
            {"{{ widget:contact-form }}"}
          </code>
        </p>
      </div>

      {showCreate && (
        <div className="border border-primary-300 rounded-lg bg-surface p-6 mb-6">
          <h3 className="font-semibold text-text-primary mb-4">Create Component</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Name *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="Contact Form" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Slug</label>
              <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" placeholder="contact-form (auto-generated)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-secondary mb-1">Template (HTML)</label>
            <textarea value={newTemplate} onChange={(e) => setNewTemplate(e.target.value)} rows={8} className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none" placeholder="<div class='widget'>...</div>" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => void handleCreate()} disabled={creating} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {creating ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-secondary rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">No components yet. Create reusable widgets, sections, or blocks.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border border-border rounded-lg bg-surface px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-text-primary">{item.name}</h3>
                  <div className="flex gap-2 mt-0.5">
                    <code className="text-xs bg-surface-secondary px-1.5 py-0.5 rounded text-text-tertiary">
                      {item.slug}
                    </code>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                      {item.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                      {item.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_enabled ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"}`}>
                      {item.is_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditingId(item.id); setEditTemplate(item.template); }} className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors">
                    Edit
                  </button>
                  <button onClick={() => void duplicate(item.id)} className="border border-border px-3 py-1.5 rounded-md text-xs text-text-secondary hover:bg-surface-secondary transition-colors">
                    Duplicate
                  </button>
                  <button onClick={() => setDeleteTarget(item.id)} className="text-xs text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>
              {item.description && <p className="text-xs text-text-tertiary mt-2">{item.description}</p>}
              <div className="mt-2 p-3 bg-surface-secondary rounded border border-border overflow-auto max-h-32">
                <pre className="text-xs text-text-tertiary whitespace-pre-wrap">{item.template.slice(0, 200)}{item.template.length > 200 ? "..." : ""}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit template modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-surface border border-border rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="font-semibold text-text-primary mb-4">Edit Template</h3>
            <textarea
              value={editTemplate}
              onChange={(e) => setEditTemplate(e.target.value)}
              rows={16}
              className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => void saveEdit()} disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingId(null)} className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Component"
        message="Are you sure you want to delete this component?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
