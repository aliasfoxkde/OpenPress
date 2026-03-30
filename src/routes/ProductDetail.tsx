import { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { api } from "../lib/api";
import { useCartStore } from "../stores/cart";
import { useSEO } from "@/hooks/useSEO";

/** Strip dangerous elements/attributes from HTML to prevent XSS */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/<embed[\s\S]*?>/gi, "")
    .replace(/ on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/ on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "");
}

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
  const [quantity, setQuantity] = useState(1);

  useSEO({
    title: product?.title,
    description: product?.excerpt,
    image: product?.featured_image_url || undefined,
    url: `${window.location.origin}/shop/${slug}`,
    type: "product",
  });

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

  const addToCart = useCartStore((s) => s.addItem);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
    await addToCart({
      product_id: product.id,
      title: product.title,
      price: product.price,
      quantity,
      sku: product.sku || undefined,
      featured_image_url: product.featured_image_url || undefined,
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-surface-secondary rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 bg-surface-secondary rounded w-3/4" />
            <div className="h-6 bg-surface-secondary rounded w-1/4" />
            <div className="h-32 bg-surface-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Product Not Found</h1>
        <p className="mt-2 text-text-secondary">{error}</p>
        <Link to="/shop" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
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
      <nav className="mb-6 text-sm text-text-tertiary">
        <Link to="/" className="hover:text-text-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-text-primary">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-surface-secondary">
          {product.featured_image_url ? (
            <img src={product.featured_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
              <span className="text-6xl opacity-30">📦</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{product.title}</h1>
            {product.sku && <p className="mt-1 text-sm text-text-tertiary">SKU: {product.sku}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-text-primary">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="text-lg text-text-tertiary line-through">{formatPrice(product.compare_at_price)}</span>
                <span className="text-sm font-semibold text-green-600">
                  Save {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                </span>
              </>
            )}
          </div>

          {product.excerpt && <p className="text-text-secondary">{product.excerpt}</p>}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary mb-2">Options</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary-500 hover:text-primary-600 transition-colors"
                  >
                    {v.title} - {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-text-secondary">Qty</label>
            <div className="flex items-center border border-border rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                -
              </button>
              <span className="px-3 py-2 text-sm text-text-primary min-w-[2rem] text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full rounded-lg bg-primary-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
            {addedToCart ? "Added to Cart!" : "Add to Cart"}
          </button>

          {/* Content */}
          {product.content && (
            <div className="prose prose-gray max-w-none pt-6 border-t">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.content) }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
