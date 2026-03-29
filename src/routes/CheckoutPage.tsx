import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { api, ApiError } from "@/lib/api";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
}

interface ProductInfo {
  id: string;
  title: string;
  price: number;
  sku: string;
  slug: string;
  excerpt?: string;
  featured_image_url?: string;
}

interface CheckoutItem {
  cartItem: CartItem;
  product: ProductInfo;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCart() {
      try {
        const res = await api.get<{ data: CartItem[] }>("/cart");
        if (res.length === 0) {
          navigate({ to: "/shop" });
          return;
        }

        // Fetch product details for each cart item
        const enriched: CheckoutItem[] = [];
        for (const item of res) {
          try {
            const product = await api.get<ProductInfo>(`/products/${item.product_id}`);
            enriched.push({ cartItem: item, product });
          } catch {
            // Skip invalid items
          }
        }
        setItems(enriched);
      } catch {
        // Cart empty or error
      } finally {
        setLoading(false);
      }
    }
    void loadCart();
  }, [navigate]);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.cartItem.quantity, 0);

  async function handleCheckout() {
    setCreating(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const res = await api.post<{ data: { checkout_url: string; order_id: string } }>("/checkout/create", {
        email,
        success_url: `${origin}/order/success`,
        cancel_url: `${origin}/checkout`,
      });
      window.location.href = res.checkout_url;
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to create checkout session");
      }
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-secondary rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface-secondary rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Cart is empty</h1>
        <p className="mt-2 text-text-secondary">Add some items before checking out.</p>
        <button
          onClick={() => void navigate({ to: "/shop" })}
          className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
        >
          Browse Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Checkout</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Cart summary */}
      <div className="border border-border rounded-lg divide-y divide-border mb-6">
        {items.map(({ cartItem, product }) => (
          <div key={cartItem.id} className="flex items-center gap-4 p-4">
            {product.featured_image_url ? (
              <img src={product.featured_image_url} alt={product.title} className="w-16 h-16 object-cover rounded" />
            ) : (
              <div className="w-16 h-16 bg-surface-secondary rounded flex items-center justify-center text-text-tertiary text-xs">
                No image
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">{product.title}</div>
              <div className="text-xs text-text-tertiary">Qty: {cartItem.quantity}</div>
            </div>
            <div className="text-sm font-medium text-text-primary">
              ${(product.price * cartItem.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Email + Total */}
      <div className="border border-border rounded-lg p-6 bg-surface">
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Email for receipt</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
        </div>

        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-medium text-text-primary">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="text-lg font-bold text-text-primary">Total</span>
          <span className="text-lg font-bold text-text-primary">${subtotal.toFixed(2)}</span>
        </div>

        <button
          onClick={() => void handleCheckout()}
          disabled={creating || items.length === 0}
          className="w-full mt-4 bg-primary-600 text-white py-3 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Redirecting to payment..." : "Pay with Stripe"}
        </button>
      </div>
    </div>
  );
}
