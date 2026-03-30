import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useCartStore } from "../stores/cart";
import { useSEO } from "@/hooks/useSEO";

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
}

export function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("default");

  useSEO({
    title: "Shop",
    description: "Browse our products",
    url: `${window.location.origin}/shop`,
    type: "website",
  });

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/products");
      setProducts(res.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-surface-secondary rounded w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface-secondary rounded-lg h-72" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-text-tertiary mb-4">{error}</p>
        <button
          onClick={() => void loadProducts()}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Shop</h1>
        <p className="mt-2 text-text-secondary">Browse our products</p>
      </div>

      {/* Search & Sort */}
      {products.length > 0 && (
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border border-border px-3 py-2 text-sm bg-surface focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
          >
            <option value="default">Default order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
          </select>
        </div>
      )}

      {(() => {
        let filtered = search
          ? products.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt?.toLowerCase().includes(search.toLowerCase()))
          : products;

        if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
        else if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
        else if (sort === "name-asc") filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

        if (filtered.length === 0) {
          return (
            <div className="text-center py-16">
              <p className="text-text-tertiary text-lg">
                {search ? "No products match your search." : "No products available yet."}
              </p>
              {!search && <p className="text-text-tertiary text-sm mt-2">Check back soon!</p>}
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const addToCart = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    await addToCart({
      product_id: product.id,
      title: product.title,
      price: product.price,
      quantity: 1,
      sku: product.sku || undefined,
      featured_image_url: product.featured_image_url || undefined,
    });
  }

  return (
    <Link
      to="/shop/$slug"
      params={{ slug: product.slug || product.id }}
      className="group block rounded-xl border border-border bg-surface shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {product.featured_image_url ? (
        <div className="aspect-square bg-surface-secondary overflow-hidden">
          <img
            src={product.featured_image_url}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <span className="text-4xl opacity-30">📦</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
          {product.title}
        </h3>
        {product.excerpt && (
          <p className="mt-1 text-sm text-text-tertiary line-clamp-2">{product.excerpt}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-text-tertiary line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={added}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              added
                ? "bg-green-100 text-green-700"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            {added ? "Added" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
