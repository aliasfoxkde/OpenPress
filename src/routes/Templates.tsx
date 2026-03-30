import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

const themes = [
  {
    name: "Default",
    slug: "default",
    description: "The standard OpenPress theme — clean, modern, and fully responsive. Includes blog, store, and admin layouts.",
    tags: ["blog", "store", "responsive", "default"],
    icon: "🎨",
    features: ["Blog layout", "E-commerce store", "Admin dashboard", "SEO optimized", "Dark mode"],
    preview: "gradient-to-br from-primary-500 to-primary-700",
  },
  {
    name: "Minimal",
    slug: "minimal",
    description: "A distraction-free reading experience. Perfect for personal blogs and writing-focused sites.",
    tags: ["blog", "minimal", "reading", "typography"],
    icon: "✍️",
    features: ["Typography-first", "No sidebars", "Focus mode", "Clean reading", "Fast loading"],
    preview: "gradient-to-br from-gray-100 to-gray-300",
  },
  {
    name: "Portfolio",
    slug: "portfolio",
    description: "Showcase your work with a creative portfolio layout. Project grids, case studies, and contact form.",
    tags: ["portfolio", "creative", "projects", "gallery"],
    icon: "🖼️",
    features: ["Project grid", "Case study pages", "Image gallery", "Contact form", "Lightbox"],
    preview: "gradient-to-br from-purple-500 to-indigo-600",
  },
  {
    name: "Documentation",
    slug: "docs",
    description: "Technical documentation theme with sidebar navigation, search, code highlighting, and versioning.",
    tags: ["docs", "technical", "api", "reference"],
    icon: "📚",
    features: ["Sidebar nav", "Code highlighting", "Search", "Version selector", "API reference"],
    preview: "gradient-to-br from-blue-600 to-cyan-500",
  },
  {
    name: "Magazine",
    slug: "magazine",
    description: "Rich editorial layout with featured articles, category sections, and author profiles.",
    tags: ["magazine", "editorial", "news", "featured"],
    icon: "📰",
    features: ["Featured hero", "Category sections", "Author profiles", "Grid layout", "Trending"],
    preview: "gradient-to-br from-red-500 to-orange-500",
  },
  {
    name: "E-Commerce Pro",
    slug: "ecommerce-pro",
    description: "Full storefront with product grids, quick view, wishlists, reviews, and advanced filtering.",
    tags: ["ecommerce", "shop", "store", "products"],
    icon: "🛒",
    features: ["Product grid", "Quick view", "Wishlist", "Reviews", "Advanced filters"],
    preview: "gradient-to-br from-emerald-500 to-teal-600",
  },
];

const customizationOptions = [
  {
    category: "Colors",
    items: [
      { name: "Primary Color", description: "Main brand color used for buttons, links, and accents", type: "color" },
      { name: "Secondary Color", description: "Supporting color for hover states and highlights", type: "color" },
      { name: "Background Color", description: "Page and section background color", type: "color" },
      { name: "Text Color", description: "Default text color for body content", type: "color" },
    ],
  },
  {
    category: "Typography",
    items: [
      { name: "Heading Font", description: "Font family for headings (H1-H6)", type: "select" },
      { name: "Body Font", description: "Font family for body text and paragraphs", type: "select" },
      { name: "Font Size", description: "Base font size for body text (14-18px)", type: "range" },
      { name: "Line Height", description: "Default line height for readability", type: "range" },
    ],
  },
  {
    category: "Layout",
    items: [
      { name: "Site Width", description: "Maximum content width (960-1400px)", type: "range" },
      { name: "Sidebar Position", description: "Left or right sidebar on blog pages", type: "select" },
      { name: "Card Style", description: "Border radius and shadow style for cards", type: "select" },
      { name: "Grid Columns", description: "Number of columns for content grids", type: "range" },
    ],
  },
  {
    category: "Header & Footer",
    items: [
      { name: "Header Style", description: "Fixed, sticky, or static header", type: "select" },
      { name: "Footer Layout", description: "Number of footer columns and style", type: "select" },
      { name: "Logo Upload", description: "Custom logo image for header", type: "image" },
      { name: "Favicon", description: "Browser tab icon", type: "image" },
    ],
  },
];

export function Templates() {
  useSEO({ title: "Templates & Themes", description: "OpenPress theme gallery and customization options", type: "website" });
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = themes.filter((t) => {
    if (!search) return true;
    return t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.includes(search.toLowerCase()));
  });

  return (
    <div className="bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-text-primary">Templates & Themes</h1>
          <p className="mt-2 text-text-secondary max-w-2xl">
            Choose a theme for your site and customize colors, typography, layout, and more. All themes are responsive, accessible, and optimized for performance.
          </p>
          <div className="mt-4 relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search themes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
          </div>
        </div>
      </div>

      {/* Theme gallery */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((theme) => (
            <div
              key={theme.slug}
              className={`group border rounded-xl overflow-hidden bg-surface transition-all hover:shadow-lg cursor-pointer ${
                activeTheme === theme.slug ? "border-primary-500 ring-2 ring-primary-500/20" : "border-border hover:border-primary-300"
              }`}
              onClick={() => setActiveTheme(activeTheme === theme.slug ? null : theme.slug)}
            >
              {/* Theme preview */}
              <div className={`h-48 bg-${theme.preview} relative`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg p-4 shadow-lg max-w-[80%]">
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2" />
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-3" />
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
                {theme.slug === "default" && (
                  <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/90 text-primary-600">Active</span>
                )}
              </div>
              {/* Theme info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{theme.icon}</span>
                  <h3 className="font-semibold text-text-primary">{theme.name}</h3>
                </div>
                <p className="text-sm text-text-secondary mb-3">{theme.description}</p>
                <div className="flex flex-wrap gap-1">
                  {theme.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary text-text-tertiary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8 text-text-tertiary">No themes match your search.</div>
        )}

        {/* Customization options */}
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">Customization Options</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {customizationOptions.map((group) => (
              <div key={group.category} className="border border-border rounded-xl p-5 bg-surface">
                <h3 className="font-semibold text-text-primary text-sm mb-4">{group.category}</h3>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-text-primary font-medium">{item.name}</p>
                        <p className="text-xs text-text-tertiary">{item.description}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-secondary text-text-tertiary capitalize">{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-text-tertiary text-center">
            {"Theme customization options are available in the admin dashboard under Settings \u003e Theme."}
          </p>
        </div>
      </div>
    </div>
  );
}
