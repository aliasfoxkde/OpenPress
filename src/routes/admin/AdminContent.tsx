export function AdminContent() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Content</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm hover:bg-primary-700 transition-colors">
          New Post
        </button>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Title
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-text-tertiary"
              >
                No content yet. Create your first post to get started.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
