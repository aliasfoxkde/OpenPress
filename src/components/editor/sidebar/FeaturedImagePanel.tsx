import { useContext } from "react";
import { SidebarContext } from "./Sidebar";

interface FeaturedImagePanelProps {
  imageUrl: string;
  onChange: (url: string) => void;
  onOpenMediaPicker: () => void;
}

export function FeaturedImagePanel({ imageUrl, onChange, onOpenMediaPicker }: FeaturedImagePanelProps) {
  const { activePanel } = useContext(SidebarContext);

  if (activePanel !== "featured-image") return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Featured Image</h3>

      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Featured"
            className="w-full h-32 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded hover:bg-red-600 transition-colors"
          >
            Remove
          </button>
        </div>
      ) : null}

      <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={onOpenMediaPicker}
        className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium py-1.5 rounded-md border border-border hover:bg-surface-secondary transition-colors"
      >
        Choose from Media Library
      </button>
    </div>
  );
}
