import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";

const categories = ["All", "Components", "Widgets", "Sections"];

const components = [
  {
    category: "Components",
    name: "Contact Form",
    description: "Fully functional contact form with validation, email integration, and spam protection.",
    slug: "contact-form",
    tags: ["form", "contact", "email"],
    icon: "📧",
  },
  {
    category: "Components",
    name: "Newsletter Signup",
    description: "Email newsletter subscription widget with double opt-in support.",
    slug: "newsletter",
    tags: ["email", "newsletter", "subscribe"],
    icon: "📬",
  },
  {
    category: "Components",
    name: "Call to Action",
    description: "Customizable CTA block with headline, description, and button with tracking.",
    slug: "cta",
    tags: ["cta", "button", "conversion"],
    icon: "🎯",
  },
  {
    category: "Components",
    name: "FAQ Accordion",
    description: "Expandable FAQ section with smooth animations and search filtering.",
    slug: "faq",
    tags: ["faq", "accordion", "help"],
    icon: "❓",
  },
  {
    category: "Components",
    name: "Testimonial Slider",
    description: "Carousel of customer testimonials with star ratings and avatars.",
    slug: "testimonials",
    tags: ["testimonials", "reviews", "slider"],
    icon: "⭐",
  },
  {
    category: "Components",
    name: "Pricing Table",
    description: "Feature comparison pricing table with toggle for monthly/annual billing.",
    slug: "pricing",
    tags: ["pricing", "plans", "billing"],
    icon: "💰",
  },
  {
    category: "Widgets",
    name: "Recent Posts Widget",
    description: "Sidebar widget showing latest posts with thumbnails and excerpts.",
    slug: "recent-posts",
    tags: ["posts", "sidebar", "blog"],
    icon: "📰",
  },
  {
    category: "Widgets",
    name: "Tag Cloud",
    description: "Visual tag cloud with weighted sizing based on post count.",
    slug: "tag-cloud",
    tags: ["tags", "sidebar", "taxonomy"],
    icon: "🏷️",
  },
  {
    category: "Widgets",
    name: "Social Share Bar",
    description: "Floating social sharing buttons for Twitter, Facebook, LinkedIn, and more.",
    slug: "social-share",
    tags: ["social", "sharing", "buttons"],
    icon: "🔗",
  },
  {
    category: "Widgets",
    name: "Search Widget",
    description: "Instant search with autocomplete, powered by the OpenPress search API.",
    slug: "search-widget",
    tags: ["search", "autocomplete", "sidebar"],
    icon: "🔍",
  },
  {
    category: "Widgets",
    name: "Author Bio Card",
    description: "Author profile card with avatar, bio, and social links.",
    slug: "author-bio",
    tags: ["author", "profile", "sidebar"],
    icon: "👤",
  },
  {
    category: "Sections",
    name: "Hero Slideshow",
    description: "Full-width animated hero section with configurable slides, gradients, and CTAs.",
    slug: "hero-slideshow",
    tags: ["hero", "slideshow", "animation"],
    icon: "🖼️",
  },
  {
    category: "Sections",
    name: "Feature Grid",
    description: "Responsive grid of feature cards with icons, descriptions, and hover effects.",
    slug: "feature-grid",
    tags: ["features", "grid", "cards"],
    icon: "⚡",
  },
  {
    category: "Sections",
    name: "Stats Counter",
    description: "Animated number counters for displaying key metrics and achievements.",
    slug: "stats-counter",
    tags: ["stats", "numbers", "animation"],
    icon: "📊",
  },
  {
    category: "Sections",
    name: "Team Grid",
    description: "Team member showcase with photos, roles, and social links.",
    slug: "team-grid",
    tags: ["team", "members", "about"],
    icon: "👥",
  },
  {
    category: "Sections",
    name: "Gallery Masonry",
    description: "Pinterest-style masonry image gallery with lightbox viewing.",
    slug: "gallery-masonry",
    tags: ["gallery", "images", "masonry"],
    icon: "🖼️",
  },
];

export function Components() {
  useSEO({ title: "Components & Widgets", description: "OpenPress component and widget library", type: "website" });
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = components.filter((t) => {
    const matchesCat = activeCategory === "All" || t.category === activeCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) || t.tags.some((tag) => tag.includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="bg-surface">
      {/* Header */}
      <div className="border-b border-border bg-surface-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-text-primary">Components & Widgets</h1>
          <p className="mt-2 text-text-secondary max-w-2xl">
            Reusable components, widgets, and sections you can embed in any page. Use the template tag <code className="px-1.5 py-0.5 rounded bg-surface border border-border text-xs font-mono">{"{{ widget:slug }}"}</code> to insert them into your content.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search components..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? "bg-primary-600 text-white" : "bg-surface border border-border text-text-secondary hover:bg-surface-secondary"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Template grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t: typeof components[number]) => (
            <div key={t.slug} className="group border border-border rounded-xl overflow-hidden bg-surface hover:border-primary-300 hover:shadow-lg transition-all duration-300">
              {/* Preview area */}
              <div className="h-36 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/30 dark:to-primary-900/20 flex items-center justify-center relative">
                <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{t.icon}</span>
                <span className="absolute top-3 left-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/80 text-text-tertiary">
                  {t.category}
                </span>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-text-primary">{t.name}</h3>
                <p className="mt-1 text-sm text-text-secondary line-clamp-2">{t.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary text-text-tertiary">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <code className="text-[10px] font-mono text-primary-500 bg-primary-50 dark:bg-primary-950/30 px-1.5 py-0.5 rounded">
                    {"{{ widget:"}{t.slug}{" }}"}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-text-tertiary">
            No components match your search.
          </div>
        )}
      </div>

      {/* How to use */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="border-t border-border pt-8">
          <h2 className="text-xl font-bold text-text-primary mb-4">How to Use Components</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="p-5 rounded-xl border border-border bg-surface">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-3">
                <span className="font-bold text-sm">1</span>
              </div>
              <h3 className="font-medium text-text-primary text-sm">Choose a Component</h3>
              <p className="mt-1 text-xs text-text-secondary">Browse the library above and find the component or widget you want to use.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-3">
                <span className="font-bold text-sm">2</span>
              </div>
              <h3 className="font-medium text-text-primary text-sm">Embed in Content</h3>
              <p className="mt-1 text-xs text-text-secondary">Use the template tag <code className="font-mono">{"{{ widget:slug }}"}</code> in any content field to embed it.</p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-surface">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-3">
                <span className="font-bold text-sm">3</span>
              </div>
              <h3 className="font-medium text-text-primary text-sm">Customize & Publish</h3>
              <p className="mt-1 text-xs text-text-secondary">Configure the component settings and publish your content. Templates render automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
