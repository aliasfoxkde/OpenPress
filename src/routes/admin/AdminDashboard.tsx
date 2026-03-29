import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

interface DashboardStats {
  content_count: number;
  published_count: number;
  draft_count: number;
  pending_count: number;
  media_count: number;
  user_count: number;
  product_count: number;
  order_count: number;
  pending_comments: number;
}

interface RecentItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  type: string;
  updated_at: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContent, setRecentContent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, contentRes] = await Promise.all([
          api.get<{ data: DashboardStats }>("/stats"),
          api.get<{ data: RecentItem[] }>("/content?limit=5"),
        ]);

        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        if (contentRes?.data) {
          setRecentContent(contentRes.data);
        }
      } catch {
        // API not available
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const statCards = [
    { label: "Content", value: stats?.content_count ?? "—", icon: "📄" },
    { label: "Published", value: stats?.published_count ?? "—", icon: "✅" },
    { label: "Drafts", value: stats?.draft_count ?? "—", icon: "📝" },
    { label: "Pending", value: stats?.pending_count ?? "—", icon: "⏳" },
    { label: "Media", value: stats?.media_count ?? "—", icon: "🖼️" },
    { label: "Products", value: stats?.product_count ?? "—", icon: "🛒" },
    { label: "Orders", value: stats?.order_count ?? "—", icon: "📦" },
    { label: "Users", value: stats?.user_count ?? "—", icon: "👥" },
  ];

  const canManage = user && ["admin", "editor"].includes(user.role);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-surface-secondary rounded-lg" />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="border border-border rounded-lg p-4 bg-surface hover:border-primary-300 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{stat.icon}</span>
                  <div className="text-sm text-text-tertiary">{stat.label}</div>
                </div>
                <div className="mt-2 text-2xl font-bold text-text-primary">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="font-semibold text-text-primary mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/content/edit"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                New Post
              </Link>
              {canManage && (
                <Link
                  to="/admin/media"
                  className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  Upload Media
                </Link>
              )}
              {canManage && stats && stats.pending_comments > 0 && (
                <Link
                  to="/admin/comments"
                  className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  Review Comments ({stats.pending_comments})
                </Link>
              )}
            </div>
          </div>

          {/* Recent Content */}
          <div className="mt-8 border border-border rounded-lg bg-surface">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-text-primary">Recent Content</h2>
              <Link to="/admin/content" className="text-xs text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            {recentContent.length === 0 ? (
              <div className="px-6 py-8 text-center text-text-tertiary text-sm">
                No content yet. Create your first post to get started.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentContent.map((item) => (
                  <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                    <button
                      onClick={() => void navigate({ to: "/admin/content/edit", search: { slug: item.slug } })}
                      className="text-left"
                    >
                      <div className="text-sm font-medium text-text-primary hover:text-primary-600 transition-colors">{item.title}</div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {item.type} &middot; {new Date(item.updated_at).toLocaleDateString()}
                      </div>
                    </button>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === "published" ? "bg-green-50 text-green-700" :
                      item.status === "draft" ? "bg-yellow-50 text-yellow-700" :
                      item.status === "pending" ? "bg-orange-50 text-orange-700" :
                      "bg-surface-tertiary text-text-secondary"
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
