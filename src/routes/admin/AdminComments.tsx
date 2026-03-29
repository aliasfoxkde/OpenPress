import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../../lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Comment {
  id: string;
  content_id: string;
  author_name: string;
  author_email?: string;
  body: string;
  status: string;
  parent_id?: string;
  created_at: string;
  content_title?: string;
  content_slug?: string;
  reply_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  spam: "bg-red-100 text-red-700",
  trash: "bg-surface-tertiary text-text-secondary",
};

export function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get<{ data: Comment[] }>(`/comments?${params}`);
      setComments(res.data || []);
      if (res.pagination) setTotalPages(res.pagination.totalPages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await api.put(`/comments/${id}/status`, { status });
      await fetchComments();
    } catch {
      // silently fail
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/comments/${deleteTarget}`);
      setDeleteTarget(null);
      await fetchComments();
    } catch {
      // silently fail
    }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  function truncate(str: string, len: number) {
    return str.length > len ? str.slice(0, len) + "..." : str;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Comments</h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-md border border-border px-3 py-2 text-sm text-text-secondary focus:border-border-focus focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="spam">Spam</option>
          <option value="trash">Trash</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-text-tertiary text-sm">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary text-sm">No comments found.</div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Comment</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary hidden sm:table-cell">Author</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary hidden md:table-cell">On</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Status</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((comment) => (
                <tr key={comment.id} className="border-t border-border hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-text-primary line-clamp-2">{truncate(comment.body, 100)}</div>
                    {comment.reply_count > 0 && (
                      <div className="text-xs text-text-tertiary mt-0.5">{comment.reply_count} replies</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-text-secondary">{comment.author_name}</div>
                    {comment.author_email && (
                      <div className="text-xs text-text-tertiary">{comment.author_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {comment.content_slug ? (
                      <Link
                        to="/blog/$slug"
                        params={{ slug: comment.content_slug }}
                        className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                      >
                        {truncate(comment.content_title || comment.content_slug, 30)}
                      </Link>
                    ) : (
                      <span className="text-text-tertiary text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[comment.status] || "bg-surface-tertiary text-text-secondary"}`}>
                      {comment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-tertiary text-xs hidden sm:table-cell">
                    {formatDate(comment.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {comment.status === "pending" && (
                        <button
                          onClick={() => void updateStatus(comment.id, "approved")}
                          disabled={updatingId === comment.id}
                          className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {(comment.status === "pending" || comment.status === "approved") && (
                        <button
                          onClick={() => void updateStatus(comment.id, "spam")}
                          disabled={updatingId === comment.id}
                          className="text-xs text-orange-600 hover:text-orange-700 disabled:opacity-50"
                        >
                          Spam
                        </button>
                      )}
                      <button
                        onClick={() => void updateStatus(comment.id, "trash")}
                        disabled={updatingId === comment.id}
                        className="text-xs text-text-tertiary hover:text-text-primary disabled:opacity-50"
                      >
                        Trash
                      </button>
                      <button
                        onClick={() => setDeleteTarget(comment.id)}
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
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1 rounded border border-border text-text-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-tertiary">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="text-sm px-3 py-1 rounded border border-border text-text-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
