import { useContext } from "react";
import { SidebarContext } from "./Sidebar";

interface SEOPanelProps {
  title: string;
  seoTitle: string;
  onSeoTitleChange: (val: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (val: string) => void;
  markChanged: () => void;
}

export function SEOPanel({
  title,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  markChanged,
}: SEOPanelProps) {
  const { activePanel } = useContext(SidebarContext);

  if (activePanel !== "seo") return null;

  const displayTitle = seoTitle || title || "Page Title";

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">SEO</h3>

      {/* Google Preview */}
      <div className="rounded-md border border-border p-3 bg-surface-secondary">
        <div className="text-xs text-text-tertiary mb-1">Google Preview</div>
        <div className="text-base text-primary-700 dark:text-blue-300 font-normal leading-snug line-clamp-1">
          {displayTitle}
        </div>
        <div className="text-xs text-green-700 dark:text-green-400">openpress.pages.dev</div>
        <div className="text-xs text-text-secondary mt-0.5 line-clamp-2">
          {seoDescription || "A brief description of your page will appear here..."}
        </div>
      </div>

      {/* Meta Title */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Meta Title</label>
        <input
          type="text"
          value={seoTitle}
          onChange={(e) => { onSeoTitleChange(e.target.value); markChanged(); }}
          placeholder={`Leave blank to use: ${title || "Page Title"}`}
          maxLength={70}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none"
        />
        <p className="text-[10px] text-text-tertiary mt-0.5">{seoTitle.length}/70</p>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Meta Description</label>
        <textarea
          value={seoDescription}
          onChange={(e) => { onSeoDescriptionChange(e.target.value); markChanged(); }}
          placeholder="A brief description for search engines..."
          maxLength={160}
          rows={3}
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none resize-none"
        />
        <p className="text-[10px] text-text-tertiary mt-0.5">{seoDescription.length}/160</p>
      </div>
    </div>
  );
}
