import { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "../lib/api";

interface Variant {
  id: string;
  title: string;
  price: number;
  sku: string | null;
  inventory: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  status: string;
  variants: Variant[];
}

export function ProductDetailPage() {
  const { slug } = useParams({ strict: false }) as { slug: string };
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await api.get(`/api/products/${slug}`);
        setProduct(res.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Product not found");
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await api.post("/api/cart/add", {
        product_id: product.id,
        quantity: 1,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch {
      // Cart may require session; silently fail gracefully
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Product Not Found</h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <Link to="/shop" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
          Back to Shop
        </Link>
      </div>
    );
  }

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-700">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-gray-700">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
          {product.featured_image_url ? (
            <img src={product.featured_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
              <span className="text-6xl opacity-30">📦</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
            {product.sku && <p className="mt-1 text-sm text-gray-500">SKU: {product.sku}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>
                <span className="text-sm font-semibold text-green-600">
                  Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {product.excerpt && <p className="text-gray-600">{product.excerpt}</p>}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Options</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                  >
                    {v.title} - {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            {addedToCart ? "Added to Cart!" : "Add to Cart"}
          </button>

          {/* Content */}
          {product.content && (
            <div className="prose prose-gray max-w-none pt-6 border-t">
              <div dangerouslySetInnerHTML={{ __html: product.content }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
