import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { api, ApiError } from "@/lib/api";
import { useSEO } from "@/hooks/useSEO";

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
  useSEO({ title: "Checkout", description: "Complete your OpenPress order", type: "website" });
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
        const cartItems = res.data || [];
        if (cartItems.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        // Fetch product details for each cart item
        const enriched: CheckoutItem[] = [];
        for (const item of cartItems) {
          try {
            const product = await api.get<{ data: ProductInfo }>(`/api/products/${item.product_id}`);
            if (product.data) {
              enriched.push({ cartItem: item, product: product.data });
            }
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
  const totalItems = items.reduce((sum, i) => sum + i.cartItem.quantity, 0);

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const updateQuantity = useCallback(async (cartId: string, productId: string, newQty: number) => {
    if (newQty < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.cartItem.id === cartId ? { ...i, cartItem: { ...i.cartItem, quantity: newQty } } : i,
      ),
    );
    try {
      await api.put(`/cart/${cartId}`, { quantity: newQty });
    } catch {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) =>
          i.cartItem.id === cartId ? { ...i, cartItem: { ...i.cartItem, quantity: Math.max(1, newQty - 1) } } : i,
        ),
      );
    }
  }, []);

  const removeItem = useCallback(async (cartId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItem.id !== cartId));
    try {
      await api.delete(`/cart/${cartId}`);
    } catch {
      // Item already removed locally
    }
  }, []);

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
      window.location.href = res.data.checkout_url;
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Checkout</h1>
        <Link to="/shop" className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          &larr; Continue Shopping
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Cart summary */}
      <div className="border border-border rounded-lg mb-6">
        <div className="px-4 py-3 border-b border-border bg-surface-secondary">
          <span className="text-sm font-medium text-text-secondary">
            {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
          </span>
        </div>
        <div className="divide-y divide-border">
          {items.map(({ cartItem, product }) => (
            <div key={cartItem.id} className="flex items-center gap-4 p-4">
              {product.featured_image_url ? (
                <img src={product.featured_image_url} alt={product.title} loading="lazy" decoding="async" className="w-16 h-16 object-cover rounded" />
              ) : (
                <div className="w-16 h-16 bg-surface-secondary rounded flex items-center justify-center text-text-tertiary text-xs">
                  No image
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{product.title}</div>
                <div className="text-xs text-text-tertiary">
                  {formatPrice(product.price)} each
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => void updateQuantity(cartItem.id, cartItem.product_id, cartItem.quantity - 1)}
                  disabled={cartItem.quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center rounded border border-border text-text-secondary hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-default transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm text-text-primary">{cartItem.quantity}</span>
                <button
                  onClick={() => void updateQuantity(cartItem.id, cartItem.product_id, cartItem.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded border border-border text-text-secondary hover:bg-surface-secondary transition-colors"
                >
                  +
                </button>
              </div>
              <div className="text-sm font-medium text-text-primary whitespace-nowrap">
                {formatPrice(product.price * cartItem.quantity)}
              </div>
              <button
                onClick={() => void removeItem(cartItem.id)}
                aria-label="Remove item"
                className="text-text-tertiary hover:text-red-500 transition-colors ml-1"
                title="Remove item"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
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
          <span className="font-medium text-text-primary">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-border">
          <span className="text-lg font-bold text-text-primary">Total</span>
          <span className="text-lg font-bold text-text-primary">{formatPrice(subtotal)}</span>
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
