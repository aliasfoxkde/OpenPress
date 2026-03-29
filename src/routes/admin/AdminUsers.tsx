import { useAuthStore } from "@/stores/auth";

export function AdminUsers() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">Name</th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">Email</th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">Role</th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {user && (
              <tr className="border-t border-border">
                <td className="px-4 py-3 text-text-primary font-medium">{user.name}</td>
                <td className="px-4 py-3 text-text-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full capitalize">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={logout}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Sign out
                  </button>
                </td>
              </tr>
            )}
            {!user && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-tertiary">
                  No user data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
