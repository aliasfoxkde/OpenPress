import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface DashboardStats {
  content_count: number;
  published_count: number;
  draft_count: number;
  media_count: number;
  user_count: number;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContent, setRecentContent] = useState<Array<{ id: string; title: string; status: string; type: string; updated_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, contentRes] = await Promise.all([
          api.get("/api/site"),
          api.get("/api/content?limit=5"),
        ]);

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          const items = contentData.data || [];
          setRecentContent(items);
          const total = contentData.pagination?.total || 0;
          setStats({
            content_count: total,
            published_count: items.filter((i: { status: string }) => i.status === "published").length,
            draft_count: items.filter((i: { status: string }) => i.status === "draft").length,
            media_count: 0,
            user_count: 1,
          });
        }
      } catch {
        // API not available yet
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const statCards = [
    { label: "Total Content", value: stats?.content_count ?? "—", desc: "All content items", icon: "📄" },
    { label: "Published", value: stats?.published_count ?? "—", desc: "Live content", icon: "✅" },
    { label: "Drafts", value: stats?.draft_count ?? "—", desc: "Pending review", icon: "📝" },
    { label: "Media Files", value: stats?.media_count ?? "—", desc: "Images & documents", icon: "🖼️" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      {loading ? (
        <div className="text-text-tertiary text-sm">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="border border-border rounded-lg p-4 bg-surface hover:border-primary-300 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{stat.icon}</span>
                  <div className="text-sm text-text-tertiary">{stat.label}</div>
                </div>
                <div className="mt-2 text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="mt-1 text-xs text-text-tertiary">{stat.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-border rounded-lg bg-surface">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Recent Content</h2>
            </div>
            {recentContent.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-tertiary text-sm">
                No content yet. Create your first post to get started.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentContent.map((item) => (
                  <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{item.title}</div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {item.type} &middot; {new Date(item.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === "published" ? "bg-green-50 text-green-700" :
                      item.status === "draft" ? "bg-yellow-50 text-yellow-700" :
                      "bg-gray-50 text-gray-700"
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
