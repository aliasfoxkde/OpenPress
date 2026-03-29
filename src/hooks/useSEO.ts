import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "article" | "website" | "product";
  author?: string;
  publishedTime?: string;
}

function setMeta(attr: string, content: string, type: "name" | "property" = "name") {
  const selector = type === "property" ? `meta[property="${attr}"]` : `meta[name="${attr}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(type === "property" ? "property" : "name", attr);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Hook to set document title and meta tags for SEO.
 * Sets Open Graph, Twitter Card, and standard meta tags.
 */
export function useSEO({ title, description, image, url, type = "article", author, publishedTime }: SEOProps) {
  useEffect(() => {
    const siteName = "OpenPress";

    // Title
    if (title) {
      document.title = `${title} — ${siteName}`;
    }

    // Standard meta
    if (description) {
      setMeta("description", description);
    }

    // Open Graph
    setMeta("og:title", title || siteName, "property");
    setMeta("og:description", description || "", "property");
    setMeta("og:type", type, "property");
    setMeta("og:site_name", siteName, "property");
    setMeta("og:url", url || window.location.href, "property");
    if (image) {
      setMeta("og:image", image, "property");
    }

    // Twitter Card
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", title || siteName);
    setMeta("twitter:description", description || "");
    if (image) {
      setMeta("twitter:image", image);
    }

    // Article specific
    if (author) {
      setMeta("article:author", author, "property");
    }
    if (publishedTime) {
      setMeta("article:published_time", publishedTime, "property");
    }

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url || window.location.href;

    return () => {
      document.title = siteName;
    };
  }, [title, description, image, url, type, author, publishedTime]);
}
