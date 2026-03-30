import { useState, useEffect } from "react";
import { api, ApiError } from "../../lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Product {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  status: string;
  inventory: number;
  updated_at: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", sku: "", compare_at_price: "", inventory: "0" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => void loadProducts(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function loadProducts() {
    setLoading(true);
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await api.get(`/api/products${query}`);
      setProducts(res.data || []);
    } catch {
      // Products may not exist yet
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.price) return;
    setSaving(true);
    try {
      await api.post("/api/products", {
        title: form.title,
        price: Math.round(parseFloat(form.price) * 100),
        sku: form.sku || undefined,
        compare_at_price: form.compare_at_price ? Math.round(parseFloat(form.compare_at_price) * 100) : undefined,
        inventory: parseInt(form.inventory) || 0,
        status: "draft",
      });
      setShowCreate(false);
      setForm({ title: "", price: "", sku: "", compare_at_price: "", inventory: "0" });
      await loadProducts();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to create product", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/products/${deleteTarget}`);
      setProducts((p) => p.filter((prod) => prod.id !== deleteTarget));
      setDeleteTarget(null);
      toast("Product deleted", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to delete product", "error");
    }
  }

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Products</h1>
        {products.length > 0 && (
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48 rounded-md border border-border px-3 py-1.5 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        )}
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          {showCreate ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border border-border bg-surface-secondary p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Price (USD) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Compare at Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.compare_at_price}
                onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Inventory</label>
              <input
                type="number"
                min="0"
                value={form.inventory}
                onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm shadow-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving || !form.title || !form.price}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
        </form>
      )}

      {/* Products table */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-secondary rounded" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">No products yet. Create your first product!</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Inventory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{product.title}</div>
                      {product.excerpt && <div className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{product.excerpt}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{product.sku || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{product.inventory}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          product.status === "active"
                            ? "bg-green-100 text-green-700"
                            : product.status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-surface-tertiary text-text-secondary"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteTarget(product.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>

          {/* Mobile card view */}
          <div className="sm:hidden space-y-3">
            {products.map((product) => (
              <div key={product.id} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-text-primary">{product.title}</div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.status === "active"
                        ? "bg-green-100 text-green-700"
                        : product.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-surface-tertiary text-text-secondary"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{formatPrice(product.price)}</span>
                  <span className="text-text-tertiary">{product.inventory} in stock</span>
                </div>
                {product.sku && (
                  <div className="mt-1 text-xs text-text-tertiary">SKU: {product.sku}</div>
                )}
                <div className="mt-2 text-right">
                  <button
                    onClick={() => setDeleteTarget(product.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message="Are you sure you want to delete this product? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
