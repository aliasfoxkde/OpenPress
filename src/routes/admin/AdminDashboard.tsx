import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/components/ui/Toast";

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

interface RecentOrder {
  id: string;
  status: string;
  total_cents: number;
  email: string;
  created_at: string;
}

interface RecentComment {
  id: string;
  author_name: string;
  body: string;
  status: string;
  content_slug: string;
  created_at: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentContent, setRecentContent] = useState<RecentItem[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, contentRes, ordersRes, commentsRes] = await Promise.all([
          api.get<{ data: DashboardStats }>("/stats"),
          api.get<{ data: RecentItem[] }>("/content?limit=5"),
          api.get<{ data: RecentOrder[]; pagination: { total: number } }>("/orders?limit=5").catch(() => null),
          api.get<{ data: RecentComment[] }>("/comments?limit=5").catch(() => null),
        ]);

        if (statsRes?.data) {
          setStats(statsRes.data);
        }

        if (contentRes?.data) {
          setRecentContent(contentRes.data);
        }

        if (ordersRes?.data) {
          setRecentOrders(ordersRes.data);
        }

        if (commentsRes?.data) {
          setRecentComments(commentsRes.data);
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
  const isAdmin = user?.role === "admin";
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const [contentRes, productsRes, ordersRes, usersRes, settingsRes, commentsRes] = await Promise.all([
        api.get("/content?limit=100").catch(() => ({ data: [] })),
        api.get("/products?limit=100").catch(() => ({ data: [] })),
        api.get("/orders?limit=100").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] })),
        api.get("/settings").catch(() => ({ data: {} })),
        api.get("/comments?limit=100").catch(() => ({ data: [] })),
      ]);
      const exportData = {
        exported_at: new Date().toISOString(),
        version: "1.0.0",
        content: contentRes.data || [],
        products: productsRes.data || [],
        orders: ordersRes.data || [],
        users: usersRes.data || [],
        settings: settingsRes.data || {},
        comments: commentsRes.data || [],
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `openpress-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data exported successfully", "success");
    } catch {
      toast("Failed to export data", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      toast(`Imported: ${(data.content || []).length} content, ${(data.products || []).length} products, ${(data.users || []).length} users`, "success");
    } catch {
      toast("Invalid import file", "error");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLoadSample() {
    setLoadingSample(true);
    try {
      await api.post("/settings", {
        site_name: "OpenPress Demo",
        site_description: "A modern, edge-native CMS — Demo Site",
        posts_per_page: "12",
      });
      // Create sample posts
      const samplePosts = [
        { title: "Welcome to OpenPress", slug: "welcome-to-openpress", type: "post", status: "published", content: "<p>OpenPress is a modern, open-source CMS built on Cloudflare's edge network. This is your first post — edit it or create new content from the dashboard.</p>", excerpt: "Your first post on OpenPress", meta: { seo_title: "Welcome to OpenPress" } },
        { title: "Getting Started Guide", slug: "getting-started", type: "post", status: "published", content: "<h2>Quick Start</h2><p>OpenPress makes it easy to create and manage content. Here's how to get started:</p><ul><li>Create your first post from the Dashboard</li><li>Customize your site in Settings</li><li>Add products to your store</li></ul>", excerpt: "Learn how to set up your OpenPress site", meta: { seo_title: "Getting Started with OpenPress" } },
        { title: "About", slug: "about", type: "page", status: "published", content: "<h2>About This Site</h2><p>This is a demo site powered by OpenPress. OpenPress is a modern, edge-native content management system.</p>", excerpt: "Learn more about this site" },
        { title: "Edge-Native Architecture", slug: "edge-native-architecture", type: "post", status: "published", content: "<p>OpenPress runs entirely on Cloudflare's global edge network. This means sub-millisecond API responses, zero cold starts, and automatic scaling to millions of requests.</p>", excerpt: "How OpenPress leverages edge computing", meta: { seo_title: "Edge-Native Architecture" } },
        { title: "Draft: Future Features", slug: "future-features", type: "post", status: "draft", content: "<p>This is a draft post about upcoming features.</p>", excerpt: "Coming soon..." },
      ];
      for (const post of samplePosts) {
        await api.post("/content", post).catch(() => {});
      }
      toast("Sample data loaded — refresh to see updates", "success");
    } catch {
      toast("Failed to load sample data", "error");
    } finally {
      setLoadingSample(false);
    }
  }

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
              {canManage && (
                <Link
                  to="/admin/products"
                  className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  New Product
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

          {/* Data Management */}
          {isAdmin && (
            <div className="mt-8 border border-border rounded-lg bg-surface">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-text-primary">Data Management</h2>
                <p className="text-xs text-text-tertiary mt-1">Export, import, or load sample data</p>
              </div>
              <div className="px-6 py-4 flex flex-wrap gap-2">
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  {exporting ? "Exporting..." : "Export All Data"}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="border border-border px-4 py-2 rounded-md text-sm text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Import Data"}
                </button>
                <button
                  onClick={handleLoadSample}
                  disabled={loadingSample}
                  className="border border-primary-300 px-4 py-2 rounded-md text-sm text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {loadingSample ? "Loading..." : "Load Sample Data"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          )}

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
          {/* Recent Orders */}
          {canManage && recentOrders.length > 0 && (
            <div className="mt-6 border border-border rounded-lg bg-surface">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Recent Orders</h2>
                <Link to="/admin/orders" className="text-xs text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentOrders.map((order) => (
                  <div key={order.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {order.email || "Guest"}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-primary">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        order.status === "completed" ? "bg-green-50 text-green-700" :
                        order.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                        order.status === "processing" ? "bg-blue-50 text-blue-700" :
                        "bg-surface-tertiary text-text-secondary"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Comments */}
          {recentComments.length > 0 && (
            <div className="mt-6 border border-border rounded-lg bg-surface">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-text-primary">Recent Comments</h2>
                <Link to="/admin/comments" className="text-xs text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
              <div className="divide-y divide-border">
                {recentComments.map((comment) => (
                  <div key={comment.id} className="px-6 py-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-text-primary">{comment.author_name}</div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        comment.status === "approved" ? "bg-green-50 text-green-700" :
                        comment.status === "pending" ? "bg-yellow-50 text-yellow-700" :
                        comment.status === "spam" ? "bg-red-50 text-red-700" :
                        "bg-surface-tertiary text-text-secondary"
                      }`}>
                        {comment.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">{comment.body}</p>
                    <div className="text-xs text-text-tertiary mt-1">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
