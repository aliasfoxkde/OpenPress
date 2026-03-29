export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-border rounded-lg p-4 bg-surface"
          >
            <div className="text-sm text-text-tertiary">{stat.label}</div>
            <div className="mt-1 text-2xl font-bold text-text-primary">
              {stat.value}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">
              {stat.description}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 border border-border rounded-lg p-6 bg-surface">
        <h2 className="font-semibold text-text-primary mb-4">
          Recent Activity
        </h2>
        <p className="text-sm text-text-tertiary">
          No activity yet. Start by creating some content.
        </p>
      </div>
    </div>
  );
}

const stats = [
  {
    label: "Content Items",
    value: "0",
    description: "Posts, pages, and custom types",
  },
  { label: "Media Files", value: "0", description: "Images, documents, files" },
  { label: "Users", value: "1", description: "Registered accounts" },
  { label: "Plugins", value: "0", description: "Active extensions" },
];
