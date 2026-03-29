import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../../lib/api";

interface Order {
  id: string;
  email: string;
  status: string;
  subtotal: number;
  total: number;
  currency: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  fulfilled: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-surface-tertiary text-text-secondary",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
  }, [page]);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await api.get(`/api/orders?page=${page}&limit=20`);
      setOrders(res.data || []);
      if (res.pagination) setTotalPages(res.pagination.totalPages);
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Orders</h1>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-surface-secondary rounded" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-text-tertiary">No orders yet.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3 text-sm font-mono">
                      <Link to="/admin/orders/$id" params={{ id: order.id }} className="text-primary-600 hover:text-primary-700">
                        {order.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-primary">{order.email}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">
                      {formatPrice(order.total)} {order.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || "bg-surface-tertiary text-text-secondary"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">
                      {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary disabled:opacity-50">Previous</button>
              <span className="px-4 py-2 text-sm text-text-secondary">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-md border border-border px-4 py-2 text-sm text-text-secondary disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
