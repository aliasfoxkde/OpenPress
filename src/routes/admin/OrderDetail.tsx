import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";

interface LineItem {
  id: string;
  product_id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  created_at: string;
}

interface OrderData {
  id: string;
  user_id: string | null;
  email: string;
  status: string;
  subtotal: number;
  total: number;
  currency: string;
  shipping_address: string;
  billing_address: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: LineItem[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-orange-100 text-orange-700",
};

const STATUS_OPTIONS = ["pending", "processing", "shipped", "completed", "cancelled", "refunded"];

export function OrderDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: OrderData }>(`/orders/${id}`);
        setOrder(res.data);
      } catch {
        setMessage({ type: "error", text: "Failed to load order." });
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdating(true);
    setMessage(null);
    try {
      await api.put(`/orders/${id}`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      setMessage({ type: "success", text: "Status updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to update status." });
    } finally {
      setUpdating(false);
    }
  }

  function parseAddress(raw: string) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface-secondary rounded w-1/3" />
        <div className="h-48 bg-surface-secondary rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary mb-4">Order not found.</p>
        <button onClick={() => void navigate({ to: "/admin/orders" })} className="text-sm text-primary-600 hover:text-primary-700">
          Back to Orders
        </button>
      </div>
    );
  }

  const shipping = parseAddress(order.shipping_address);
  const billing = parseAddress(order.billing_address);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/admin/orders" })}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l4-4M5 10l4 4" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            Order {order.id.slice(0, 8)}
          </h1>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[order.status] || "bg-surface-tertiary text-text-secondary"}`}>
          {order.status}
        </span>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Status Update */}
      <div className="mb-6 border border-border rounded-lg p-4 bg-surface">
        <label className="block text-sm font-medium text-text-secondary mb-2">Update Status</label>
        <select
          value={order.status}
          onChange={(e) => void updateStatus(e.target.value)}
          disabled={updating}
          className="w-full max-w-xs rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Info */}
        <div className="border border-border rounded-lg bg-surface">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Order Info</h2>
          </div>
          <div className="divide-y divide-border">
            <div className="px-4 py-2.5 flex justify-between text-sm">
              <span className="text-text-tertiary">Email</span>
              <span className="text-text-primary">{order.email}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-sm">
              <span className="text-text-tertiary">Created</span>
              <span className="text-text-primary">{new Date(order.created_at).toLocaleString()}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-sm">
              <span className="text-text-tertiary">Updated</span>
              <span className="text-text-primary">{new Date(order.updated_at).toLocaleString()}</span>
            </div>
            <div className="px-4 py-2.5 flex justify-between text-sm">
              <span className="text-text-tertiary">Currency</span>
              <span className="text-text-primary">{order.currency.toUpperCase()}</span>
            </div>
            {order.notes && (
              <div className="px-4 py-2.5 text-sm">
                <span className="text-text-tertiary block mb-1">Notes</span>
                <span className="text-text-primary">{order.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping */}
        {shipping && (
          <div className="border border-border rounded-lg bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Shipping Address</h2>
            </div>
            <div className="p-4 text-sm text-text-primary">
              {Object.entries(shipping).map(([key, value]) => (
                <div key={key} className="capitalize">{String(value)}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Line Items */}
      <div className="mt-6 border border-border rounded-lg bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary">Line Items</h2>
        </div>
        {order.items.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-text-tertiary">No line items.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-text-tertiary">Product</th>
                <th className="text-left px-4 py-2 font-medium text-text-tertiary">SKU</th>
                <th className="text-right px-4 py-2 font-medium text-text-tertiary">Price</th>
                <th className="text-right px-4 py-2 font-medium text-text-tertiary">Qty</th>
                <th className="text-right px-4 py-2 font-medium text-text-tertiary">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {order.items.map((item) => (
                <tr key={item.id} className="hover:bg-surface-secondary/50">
                  <td className="px-4 py-2.5 text-text-primary">{item.title}</td>
                  <td className="px-4 py-2.5 text-text-tertiary text-xs">{item.sku}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-text-secondary">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-text-primary">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-secondary">
                <td colSpan={4} className="px-4 py-2.5 text-right text-text-secondary">Subtotal</td>
                <td className="px-4 py-2.5 text-right font-medium text-text-primary">${Number(order.subtotal).toFixed(2)}</td>
              </tr>
              <tr className="bg-surface-secondary">
                <td colSpan={4} className="px-4 py-2.5 text-right text-sm font-semibold text-text-primary">Total</td>
                <td className="px-4 py-2.5 text-right text-lg font-bold text-text-primary">${Number(order.total).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
