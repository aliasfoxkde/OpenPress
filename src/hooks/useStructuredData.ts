import { useEffect } from "react";

/**
 * Inject JSON-LD structured data into the document head.
 * Removes previous script on cleanup or re-render.
 */
export function useStructuredData(data: Record<string, unknown> | null) {
  useEffect(() => {
    if (!data) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    script.id = "structured-data";
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);
}

/** Build Article schema.org structured data */
export function buildArticleData(opts: {
  title: string;
  excerpt?: string;
  url: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.excerpt || "",
    url: opts.url,
    image: opts.image || undefined,
    author: opts.author
      ? { "@type": "Person", name: opts.author }
      : { "@type": "Organization", name: "OpenPress" },
    publisher: {
      "@type": "Organization",
      name: "OpenPress",
    },
    datePublished: opts.publishedTime || undefined,
    dateModified: opts.modifiedTime || opts.publishedTime || undefined,
  };
}

/** Build Product schema.org structured data */
export function buildProductData(opts: {
  title: string;
  excerpt?: string;
  url: string;
  image?: string;
  price: number;
  currency?: string;
  sku?: string;
  availability?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.title,
    description: opts.excerpt || "",
    url: opts.url,
    image: opts.image || undefined,
    sku: opts.sku || undefined,
    offers: {
      "@type": "Offer",
      price: (opts.price / 100).toFixed(2),
      priceCurrency: opts.currency || "USD",
      availability: opts.availability
        ? `https://schema.org/${opts.availability}`
        : "https://schema.org/InStock",
      url: opts.url,
    },
  };
}
