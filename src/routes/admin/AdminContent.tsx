import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ContentItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  status: string;
  excerpt?: string;
  author_id?: string;
  updated_at: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AdminContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [myContentOnly, setMyContentOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("post");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Non-admin roles see only their own content by default
  const isLimitedRole = user && !["admin", "editor"].includes(user.role);

  async function fetchContent(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/api/content?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchContent();
  }, [statusFilter]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/api/content", {
        title: newTitle.trim(),
        type: newType,
        status: "draft",
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreate(false);
        setNewTitle("");
        void navigate({ to: "/admin/content/edit", search: { slug: data.data?.slug || data.slug } });
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(slug: string) {
    setDeleteTarget(slug);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/content/${deleteTarget}`);
      setDeleteTarget(null);
      await fetchContent();
    } catch {
      // ignore
    }
  }

  async function handleToggleStatus(slug: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    try {
      await api.put(`/api/content/${slug}`, { status: newStatus });
      await fetchContent();
    } catch {
      // ignore
    }
  }

  const statusColors: Record<string, string> = {
    published: "bg-green-50 text-green-700",
    draft: "bg-yellow-50 text-yellow-700",
    pending: "bg-orange-50 text-orange-700",
    trash: "bg-red-50 text-red-700",
    scheduled: "bg-blue-50 text-blue-700",
    archived: "bg-surface-tertiary text-text-secondary",
  };

  const filtered = search
    ? items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Content</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors font-medium"
        >
          New Post
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-text-primary mb-4">Create New Content</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter title..."
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                >
                  <option value="post">Post</option>
                  <option value="page">Page</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => { setShowCreate(false); setNewTitle(""); }}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newTitle.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Draft"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending Review</option>
          <option value="trash">Trash</option>
        </select>
        {isLimitedRole && (
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={myContentOnly}
              onChange={(e) => setMyContentOnly(e.target.checked)}
              className="rounded border-border"
            />
            My content only
          </label>
        )}
      </div>

      {/* Content table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        {loading ? (
          <div className="px-4 py-8 text-center text-text-tertiary text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-text-tertiary text-sm">
            No content yet. Create your first post to get started.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Title</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary hidden md:table-cell">Updated</th>
                <th className="text-right px-4 py-3 font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/content/edit"
                      search={{ slug: item.slug }}
                      className="font-medium text-text-primary hover:text-primary-600 transition-colors"
                    >
                      {item.title}
                    </Link>
                    {item.excerpt && (
                      <div className="text-xs text-text-tertiary mt-0.5 truncate max-w-xs">{item.excerpt}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize text-text-secondary hidden sm:table-cell">{item.type}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void handleToggleStatus(item.slug, item.status)}
                      className={`text-xs px-2 py-1 rounded-full cursor-pointer ${statusColors[item.status] || "bg-surface-tertiary text-text-secondary"}`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-text-tertiary text-xs hidden md:table-cell">
                    {new Date(item.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to="/admin/content/edit"
                        search={{ slug: item.slug }}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => void handleDelete(item.slug)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-text-tertiary">
            {pagination.total} items &middot; Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => void fetchContent(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-border rounded text-text-secondary hover:bg-surface-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => void fetchContent(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-border rounded text-text-secondary hover:bg-surface-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Move to Trash"
        message="Are you sure you want to move this item to trash?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
