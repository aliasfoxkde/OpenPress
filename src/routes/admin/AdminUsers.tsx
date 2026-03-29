import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/auth";
import { api, ApiError } from "@/lib/api";
import type { UserRole } from "@shared/types";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface UsersResponse {
  data: UserRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const ROLES: UserRole[] = ["admin", "editor", "author", "contributor", "subscriber", "viewer"];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  editor: "Editor",
  author: "Author",
  contributor: "Contributor",
  subscriber: "Subscriber",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  editor: "bg-blue-100 text-blue-700",
  author: "bg-green-100 text-green-700",
  contributor: "bg-yellow-100 text-yellow-700",
  subscriber: "bg-surface-tertiary text-text-secondary",
  viewer: "bg-surface-tertiary text-text-tertiary",
};

export function AdminUsers() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await api.get<UsersResponse>(`/users?${params}`);
      setUsers(res.data);
      setTotalPages(res.pagination.totalPages);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setError("You don't have permission to manage users.");
      } else {
        setError("Failed to load users.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setChangingRoleId(userId);
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (e) {
      if (e instanceof ApiError) {
        alert(e.message);
      }
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Delete user "${userName}"? Their content will be reassigned to you.`)) return;
    setDeletingId(userId);
    try {
      await api.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      if (e instanceof ApiError) {
        alert(e.message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  if (error && !isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        </div>
        <div className="text-red-500 p-4 border border-red-200 rounded-lg bg-red-50">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="text-sm border border-border rounded px-3 py-1.5 bg-surface"
          />
          <span className="text-xs text-text-tertiary">{users.length} users</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-text-tertiary">Loading users...</div>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Name</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Email</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Role</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-surface-secondary/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-text-primary font-medium">{user.name}</div>
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-text-tertiary">(you)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.id === currentUser?.id ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => void handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={changingRoleId === user.id}
                        className="text-xs border border-border rounded px-2 py-1 bg-surface"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-tertiary">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => void handleDelete(user.id, user.name)}
                        disabled={deletingId === user.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === user.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-tertiary">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1 rounded border border-border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-text-tertiary">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="text-sm px-3 py-1 rounded border border-border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
