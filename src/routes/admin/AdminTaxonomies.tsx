import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Term {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  created_at: string;
}

interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  terms: Term[];
}

export function AdminTaxonomies() {
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTermName, setNewTermName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; taxonomyId: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  async function fetchTaxonomies() {
    setLoading(true);
    try {
      const res = await api.get<{ data: Taxonomy[] }>("/taxonomies");
      setTaxonomies(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTaxonomies();
  }, []);

  async function handleCreateTerm(taxonomyId: string) {
    if (!newTermName.trim()) return;
    setCreating(true);
    try {
      await api.post(`/taxonomies/${taxonomyId}/terms`, { name: newTermName.trim() });
      setNewTermName("");
      setAddingTo(null);
      await fetchTaxonomies();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to create term", "error");
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/taxonomies/terms/${deleteTarget.id}`);
      setDeleteTarget(null);
      await fetchTaxonomies();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete term", "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-tertiary">Loading taxonomies...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Taxonomies</h1>

      {taxonomies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-tertiary">No taxonomies found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {taxonomies.map((tax) => (
            <div key={tax.id} className="border border-border rounded-lg bg-surface">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">{tax.name}</h2>
                  {tax.description && <p className="text-xs text-text-tertiary mt-0.5">{tax.description}</p>}
                </div>
                <span className="text-xs text-text-tertiary bg-surface-secondary px-2 py-1 rounded-full">
                  {tax.terms.length} term{tax.terms.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Terms list */}
              <div className="p-4">
                {tax.terms.length === 0 ? (
                  <p className="text-sm text-text-tertiary mb-3">No terms yet.</p>
                ) : (
                  <div className="space-y-1">
                    {tax.terms.map((term) => (
                      <div key={term.id} className="flex items-center justify-between px-3 py-2 rounded hover:bg-surface-secondary transition-colors">
                        <div>
                          <span className="text-sm text-text-primary">{term.name}</span>
                          {term.slug && (
                            <span className="text-xs text-text-tertiary ml-2">{term.slug}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setDeleteTarget({ id: term.id, name: term.name, taxonomyId: tax.id })}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add term */}
                {addingTo === tax.id ? (
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={newTermName}
                      onChange={(e) => setNewTermName(e.target.value)}
                      placeholder="Term name..."
                      className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCreateTerm(tax.id);
                        if (e.key === "Escape") { setAddingTo(null); setNewTermName(""); }
                      }}
                    />
                    <button
                      onClick={() => void handleCreateTerm(tax.id)}
                      disabled={creating || !newTermName.trim()}
                      className="rounded-md bg-primary-600 text-white px-3 py-2 text-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      {creating ? "Adding..." : "Add"}
                    </button>
                    <button
                      onClick={() => { setAddingTo(null); setNewTermName(""); }}
                      className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingTo(tax.id); setNewTermName(""); }}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    + Add Term
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Term"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
