export function AdminUsers() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Users</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors">
          Add User
        </button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Email
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Role
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-4 py-3 text-text-primary">Admin</td>
              <td className="px-4 py-3 text-text-secondary">
                admin@example.com
              </td>
              <td className="px-4 py-3">
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                  Admin
                </span>
              </td>
              <td className="px-4 py-3 text-text-tertiary">Just now</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
