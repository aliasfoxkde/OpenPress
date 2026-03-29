import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useContentStore } from "@/stores/content";
import { useAuthStore } from "@/stores/auth";
import { RichTextEditor, blockNoteToLegacyBlocks, legacyBlocksToBlockNote } from "@/components/editor/RichTextEditor";
import { api } from "@/lib/api";
import type { ContentStatus } from "@shared/types";

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

interface Term {
  id: string;
  name: string;
  slug: string;
  taxonomy_id: string;
}

interface Revision {
  id: string;
  revision_number: number;
  created_at: string;
}

export function ContentEditor() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { slug?: string };
  const slug = search.slug;
  const user = useAuthStore((s) => s.user);

  const {
    currentContent,
    isLoadingDetail,
    detailError,
    isSaving,
    saveError,
    fetchContent,
    createContent,
    saveContent,
    clearCurrent,
  } = useContentStore();

  // Local state for title/excerpt edits
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [hasChanges, setHasChanges] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);

  // Taxonomy state
  const [categories, setCategories] = useState<Term[]>([]);
  const [tags, setTags] = useState<Term[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Revision history
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [restoringRevision, setRestoringRevision] = useState(false);

  // BlockNote editor content
  const [editorBlocks, setEditorBlocks] = useState<PartialBlock[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined>(undefined);
  const contentIdRef = useRef<string | null>(null);

  const isCreateMode = !slug;
  const isLimitedRole = user && !["admin", "editor"].includes(user.role);

  // Load existing content
  useEffect(() => {
    if (slug) {
      fetchContent(slug);
    }
    return () => {
      clearCurrent();
    };
  }, [slug, fetchContent, clearCurrent]);

  // Fetch taxonomies
  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const res = await api.get<{ data: { id: string; name: string; terms?: Term[] }[] }>("/taxonomies");
        for (const tax of res.data || []) {
          const terms = (tax.terms || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            taxonomy_id: tax.id,
          }));
          if (tax.name === "Category" || tax.slug === "category") {
            setCategories(terms);
          } else if (tax.name === "Tag" || tax.slug === "tag" || tax.name === "Tags" || tax.slug === "tags") {
            setTags(terms);
          }
        }
      } catch {
        // taxonomies may not exist yet
      }
    }
    void loadTaxonomies();
  }, []);

  // Sync local state from loaded content
  useEffect(() => {
    if (currentContent) {
      setTitle(currentContent.item.title);
      setExcerpt(currentContent.item.excerpt ?? "");
      setStatus(currentContent.item.status);
      setFeaturedImageUrl(currentContent.item.featured_image_url ?? "");
      contentIdRef.current = currentContent.item.id;

      // Sync terms
      const termIds = (currentContent.terms || []).map((t: any) => t.id || t.term_id);
      setSelectedTermIds(termIds.filter(Boolean));

      // Load BlockNote content
      const meta = (currentContent as { meta?: Record<string, string> }).meta;
      let blocks: PartialBlock[] | undefined;
      if (meta?.blocknote_json) {
        try {
          blocks = JSON.parse(meta.blocknote_json);
        } catch {
          blocks = undefined;
        }
      }
      if (!blocks) {
        const legacyBlocks = currentContent.blocks.map((b) => ({
          block_type: b.block_type,
          data: b.data,
        }));
        blocks = legacyBlocksToBlockNote(legacyBlocks);
      }
      setInitialBlocks(blocks);
      setEditorBlocks(blocks);
      setHasChanges(false);

      // Load revisions
      loadRevisions(currentContent.item.id);
    }
  }, [currentContent?.item.id]);

  async function loadRevisions(contentId: string) {
    try {
      const res = await api.get<{ data: Revision[] }>(`/revisions?contentId=${contentId}&limit=20`);
      setRevisions(res.data || []);
    } catch {
      // revisions may not exist
    }
  }

  async function handleRestoreRevision(revId: string) {
    setRestoringRevision(true);
    try {
      await api.post(`/revisions/${revId}/restore`);
      if (slug) {
        await fetchContent(slug);
      }
      setShowRevisions(false);
    } catch {
      // error handled silently
    } finally {
      setRestoringRevision(false);
    }
  }

  const markChanged = useCallback(() => setHasChanges(true), []);

  const handleTitleChange = useCallback((val: string) => { setTitle(val); markChanged(); }, [markChanged]);
  const handleExcerptChange = useCallback((val: string) => { setExcerpt(val); markChanged(); }, [markChanged]);
  const handleStatusChange = useCallback((val: ContentStatus) => { setStatus(val); markChanged(); }, [markChanged]);
  const handleFeaturedImageChange = useCallback((val: string) => { setFeaturedImageUrl(val); markChanged(); }, [markChanged]);

  const handleEditorChange = useCallback((blocks: PartialBlock[]) => {
    setEditorBlocks(blocks);
    markChanged();
  }, [markChanged]);

  // Tag management
  const filteredTags = tagInput.length > 0
    ? tags.filter((t) => t.name.toLowerCase().includes(tagInput.toLowerCase()))
    : [];

  function addTag(termId: string) {
    if (!selectedTermIds.includes(termId)) {
      setSelectedTermIds([...selectedTermIds, termId]);
      markChanged();
    }
    setTagInput("");
    setShowTagSuggestions(false);
  }

  function removeTag(termId: string) {
    setSelectedTermIds(selectedTermIds.filter((id) => id !== termId));
    markChanged();
  }

  // Save handler
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    const blockData = blockNoteToLegacyBlocks(editorBlocks);
    const blocknoteJson = JSON.stringify(editorBlocks);

    if (isCreateMode || !slug) {
      try {
        const newItem = await createContent({
          title: title.trim(),
          status,
          blocks: blockData.length > 0 ? blockData : undefined,
          meta: { blocknote_json: blocknoteJson },
          featured_image_url: featuredImageUrl.trim() || undefined,
          term_ids: selectedTermIds.length > 0 ? selectedTermIds : undefined,
        });
        setHasChanges(false);
        void navigate({ to: "/admin/content/edit", search: { slug: newItem.slug } });
      } catch {
        // Error handled in store
      }
    } else {
      try {
        await saveContent(slug, {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          status,
          blocks: blockData,
          meta: { blocknote_json: blocknoteJson },
          featured_image_url: featuredImageUrl.trim() || undefined,
          term_ids: selectedTermIds,
        });
        setHasChanges(false);
        // Refresh revisions after save
        if (contentIdRef.current) loadRevisions(contentIdRef.current);
      } catch {
        // Error handled in store
      }
    }
  }, [
    title, excerpt, status, editorBlocks, isCreateMode, slug,
    featuredImageUrl, selectedTermIds, createContent, saveContent, navigate,
  ]);

  const handleTogglePublish = useCallback(() => {
    const newStatus: ContentStatus = status === "published" ? "draft" : "published";
    handleStatusChange(newStatus);
  }, [status, handleStatusChange]);

  const handleSubmitForReview = useCallback(() => {
    handleStatusChange("pending");
    // Trigger save with pending status
  }, [handleStatusChange]);

  // Autosave: debounced 30s
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasChanges || isCreateMode || !slug) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { void handleSave(); }, 30_000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [hasChanges, editorBlocks, title, excerpt, status, featuredImageUrl, selectedTermIds, isCreateMode, slug, handleSave]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Loading state
  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-tertiary">Loading content...</div>
      </div>
    );
  }

  // Error state
  if (detailError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-red-500">{detailError}</div>
        <button onClick={() => void navigate({ to: "/admin/content" })} className="text-sm text-primary-600 hover:underline">
          Back to content list
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 sticky top-14 z-10 bg-surface py-2 -mt-2 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/admin/content" })}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            title="Back to content list"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l4-4M5 10l4 4" />
            </svg>
          </button>
          <span className="text-sm text-text-tertiary">
            {isCreateMode ? "New Post" : "Edit Post"}
          </span>
          {!isCreateMode && revisions.length > 0 && (
            <button
              onClick={() => setShowRevisions(!showRevisions)}
              className="text-xs text-text-tertiary hover:text-text-primary transition-colors ml-2"
            >
              {showRevisions ? "Hide" : "Show"} Revisions ({revisions.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ContentStatus)}
            className="text-xs border border-border rounded px-2 py-1.5 bg-surface"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Submit for Review (limited roles) */}
          {isLimitedRole && status === "draft" && (
            <button
              onClick={() => { handleSubmitForReview(); void handleSave(); }}
              className="px-3 py-1.5 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
            >
              Submit for Review
            </button>
          )}

          {/* Publish/Unpublish toggle */}
          {!isLimitedRole && (
            <button
              onClick={handleTogglePublish}
              className={cn(
                "px-3 py-1.5 text-xs rounded transition-colors",
                status === "published"
                  ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  : "bg-primary-600 text-white hover:bg-primary-700",
              )}
            >
              {status === "published" ? "Unpublish" : "Publish"}
            </button>
          )}

          {/* Save */}
          <button
            onClick={() => void handleSave()}
            disabled={isSaving || !title.trim()}
            className={cn(
              "px-4 py-1.5 text-xs rounded font-medium transition-colors",
              isSaving || !title.trim()
                ? "bg-surface-tertiary text-text-tertiary cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700",
            )}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">{saveError}</div>
      )}

      {/* Revision History Sidebar */}
      {showRevisions && (
        <div className="mb-6 border border-border rounded-lg bg-surface-secondary p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Revision History</h3>
          {revisions.length === 0 ? (
            <p className="text-xs text-text-tertiary">No revisions yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {revisions.map((rev) => (
                <div key={rev.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    Rev #{rev.revision_number} &mdash; {new Date(rev.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => void handleRestoreRevision(rev.id)}
                    disabled={restoringRevision}
                    className="text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {restoringRevision ? "Restoring..." : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        placeholder="Post title..."
        className="w-full text-3xl font-bold text-text-primary placeholder:text-text-tertiary border-0 bg-transparent focus:outline-none mb-4 p-0"
      />

      {/* Excerpt */}
      <textarea
        value={excerpt}
        onChange={(e) => handleExcerptChange(e.target.value)}
        placeholder="Write an excerpt (optional)..."
        rows={2}
        className="w-full text-sm text-text-secondary placeholder:text-text-tertiary border-0 bg-transparent focus:outline-none mb-4 p-0 resize-none"
      />

      {/* Featured Image */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-1">Featured Image URL</label>
        {featuredImageUrl ? (
          <div className="relative mb-2">
            <img
              src={featuredImageUrl}
              alt="Featured"
              className="w-full max-h-48 object-cover rounded-md border border-border"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <button
              onClick={() => handleFeaturedImageChange("")}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : null}
        <input
          type="url"
          value={featuredImageUrl}
          onChange={(e) => handleFeaturedImageChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none focus:ring-1 focus:ring-border-focus"
        />
      </div>

      {/* Categories & Tags */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Category</label>
            <select
              value={selectedTermIds.find((id) => categories.some((c) => c.id === id)) || ""}
              onChange={(e) => {
                const newId = e.target.value;
                // Remove any existing category selection
                const nonCatIds = selectedTermIds.filter((id) => !categories.some((c) => c.id === id));
                if (newId) {
                  setSelectedTermIds([...nonCatIds, newId]);
                } else {
                  setSelectedTermIds(nonCatIds);
                }
                markChanged();
              }}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-1">Tags</label>
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
                      <button onClick={() => removeTag(id)} className="hover:text-primary-900">&times;</button>
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
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
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

      {/* Rich Text Editor */}
      <div className="border border-border rounded-lg bg-surface">
        <RichTextEditor
          initialContent={initialBlocks}
          onChange={handleEditorChange}
          editable={true}
        />
      </div>

      {/* Unsaved indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-md text-xs shadow-md">
          Unsaved changes — autosaves in 30s (Ctrl+S to save now)
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
