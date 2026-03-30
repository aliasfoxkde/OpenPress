import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

interface OrderLineItem {
  id: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
}

interface OrderData {
  id: string;
  email: string;
  status: string;
  subtotal: number;
  total: number;
  currency: string;
  paid_at: string;
  created_at: string;
  items: OrderLineItem[];
}

export function OrderSuccessPage() {
  useSEO({ title: "Order Confirmed", description: "Your order has been placed successfully", type: "website" });
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");

    if (!orderId) {
      navigate({ to: "/shop" });
      return;
    }

    async function loadOrder() {
      try {
        const res = await api.get<{ data: OrderData }>(`/orders/${orderId}/receipt`);
        setOrder(res.data);
      } catch {
        setError("Could not load order details. Check your email for confirmation.");
      } finally {
        setLoading(false);
      }
    }
    void loadOrder();
  }, [navigate]);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-secondary rounded w-1/2" />
          <div className="h-40 bg-surface-secondary rounded" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">Order Confirmed</div>
        <p className="text-text-secondary mb-4">{error || "Your order has been placed."}</p>
        <p className="text-sm text-text-tertiary mb-6">Check your email for order confirmation.</p>
        <Link to="/shop" className="text-primary-600 hover:text-primary-700 font-medium">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">&#10003;</div>
        <h1 className="text-2xl font-bold text-text-primary">Order Confirmed</h1>
        <p className="text-text-secondary mt-1">Thank you for your purchase!</p>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-surface-secondary px-6 py-4 border-b border-border">
          <div className="flex justify-between text-sm">
            <span className="text-text-tertiary">Order ID</span>
            <span className="font-mono text-text-primary">{order.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-tertiary">Date</span>
            <span className="text-text-primary">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-text-tertiary">Status</span>
            <span className="text-green-700 font-medium capitalize">{order.status.replace("_", " ")}</span>
          </div>
        </div>

        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="px-6 py-3 flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-text-primary">{item.title}</div>
                <div className="text-xs text-text-tertiary">{item.sku} &middot; Qty: {item.quantity}</div>
              </div>
              <div className="text-sm font-medium text-text-primary">{formatPrice(item.total)}</div>
            </div>
          ))}
        </div>

        <div className="bg-surface-secondary px-6 py-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span className="text-text-primary">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-lg font-bold text-text-primary">Total</span>
            <span className="text-lg font-bold text-text-primary">{formatPrice(order.total)} {order.currency.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/shop" className="text-primary-600 hover:text-primary-700 font-medium">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
