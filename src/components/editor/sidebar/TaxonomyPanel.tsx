import { useContext, useState } from "react";
import { SidebarContext } from "./Sidebar";

interface Term {
  id: string;
  name: string;
  slug: string;
}

interface TaxonomyPanelProps {
  categories: Term[];
  tags: Term[];
  selectedTermIds: string[];
  onTermIdsChange: (ids: string[]) => void;
  markChanged: () => void;
}

export function TaxonomyPanel({
  categories,
  tags,
  selectedTermIds,
  onTermIdsChange,
  markChanged,
}: TaxonomyPanelProps) {
  const { activePanel } = useContext(SidebarContext);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  if (activePanel !== "taxonomy") return null;

  const filteredTags = tagInput.length > 0
    ? tags.filter((t) => t.name.toLowerCase().includes(tagInput.toLowerCase()))
    : [];

  function addTag(termId: string) {
    if (!selectedTermIds.includes(termId)) {
      onTermIdsChange([...selectedTermIds, termId]);
      markChanged();
    }
    setTagInput("");
    setShowTagSuggestions(false);
  }

  function removeTag(termId: string) {
    onTermIdsChange(selectedTermIds.filter((id) => id !== termId));
    markChanged();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Categories & Tags</h3>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Category</label>
          <select
            value={selectedTermIds.find((id) => categories.some((c) => c.id === id)) || ""}
            onChange={(e) => {
              const newId = e.target.value;
              const nonCatIds = selectedTermIds.filter((id) => !categories.some((c) => c.id === id));
              onTermIdsChange(newId ? [...nonCatIds, newId] : nonCatIds);
              markChanged();
            }}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm bg-surface focus:border-border-focus focus:outline-none"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-1">
            {selectedTermIds
              .filter((id) => tags.some((t) => t.id === id))
              .map((id) => {
                const tag = tags.find((t) => t.id === id);
                return tag ? (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full"
                  >
                    {tag.name}
                    <button onClick={() => removeTag(id)} className="hover:text-primary-900" aria-label={`Remove ${tag.name}`}>{'\u00d7'}</button>
                  </span>
                ) : null;
              })}
          </div>
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              placeholder="Add tag..."
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-border-focus focus:outline-none"
            />
            {showTagSuggestions && filteredTags.length > 0 && (
              <div className="absolute z-20 top-full mt-1 w-full bg-surface border border-border rounded-md shadow-lg max-h-32 overflow-y-auto">
                {filteredTags.map((tag) => (
                  <button
                    key={tag.id}
                    onMouseDown={() => addTag(tag.id)}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface-secondary transition-colors"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
