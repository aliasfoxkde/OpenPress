import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useContentStore } from "@/stores/content";
import { useAuthStore } from "@/stores/auth";
import { RichTextEditor, blockNoteToLegacyBlocks, legacyBlocksToBlockNote } from "@/components/editor/RichTextEditor";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Sidebar } from "@/components/editor/sidebar/Sidebar";
import { DocumentPanel } from "@/components/editor/sidebar/DocumentPanel";
import { FeaturedImagePanel } from "@/components/editor/sidebar/FeaturedImagePanel";
import { TaxonomyPanel } from "@/components/editor/sidebar/TaxonomyPanel";
import { SEOPanel } from "@/components/editor/sidebar/SEOPanel";
import { EditorBottomBar } from "@/components/editor/EditorBottomBar";
import type { ContentStatus, BlockType } from "@shared/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PartialBlock = any;

interface Term {
  id: string;
  name: string;
  slug: string;
}

interface Revision {
  id: string;
  revision_number: number;
  created_at: string;
}

interface MediaItem {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  url?: string;
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function ContentEditor() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { slug?: string };
  const slug = search.slug;
  const user = useAuthStore((s) => s.user);
  const toast = useToast();

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

  // Local state
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [contentType, setContentType] = useState("post");
  const [hasChanges, setHasChanges] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Taxonomy state
  const [categories, setCategories] = useState<Term[]>([]);
  const [tags, setTags] = useState<Term[]>([]);

  // Revision history
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [restoringRevision, setRestoringRevision] = useState(false);

  // Media picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // BlockNote editor content
  const [editorBlocks, setEditorBlocks] = useState<PartialBlock[]>([]);
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined>(undefined);
  const [lastSaved, setLastSaved] = useState<string | undefined>(undefined);
  const contentIdRef = useRef<string | null>(null);

  const isCreateMode = !slug;
  const isLimitedRole = user && !["admin", "editor"].includes(user.role);

  // Word count & reading time
  const { wordCount, readingTime } = useMemo(() => {
    const text = editorBlocks
      .map((b: any) => {
        if (b.type === "text" && b.content) {
          return b.content.map((c: any) => (c.type === "text" ? c.text : "")).join("");
        }
        return "";
      })
      .join(" ");
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return { wordCount: words, readingTime: `${mins} min` };
  }, [editorBlocks]);

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
        const res = await api.get<{ data: { id: string; name: string; slug: string; terms?: Term[] }[] }>("/taxonomies");
        for (const tax of res.data || []) {
          const terms = (tax.terms || []).map((t: any) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
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
      setContentType(currentContent.item.type || "post");
      setFeaturedImageUrl(currentContent.item.featured_image_url ?? "");
      contentIdRef.current = currentContent.item.id;

      const meta = (currentContent as { meta?: Record<string, string> }).meta;
      setSeoTitle(meta?.seo_title ?? "");
      setSeoDescription(meta?.seo_description ?? "");

      const itemAny = currentContent.item as unknown as Record<string, unknown>;
      if (currentContent.item.status === "scheduled" && itemAny.scheduled_at) {
        setScheduledAt(String(itemAny.scheduled_at).slice(0, 16));
      } else {
        setScheduledAt("");
      }

      const termIds = (currentContent.terms || []).map((t: any) => t.id || t.term_id);
      setSelectedTermIds(termIds.filter(Boolean));

      let blocks: PartialBlock[] | undefined;
      if (meta?.blocknote_json) {
        try { blocks = JSON.parse(meta.blocknote_json); } catch { blocks = undefined; }
      }
      if (!blocks) {
        const legacyBlocks = currentContent.blocks.map((b) => ({ block_type: b.block_type, data: b.data }));
        blocks = legacyBlocksToBlockNote(legacyBlocks);
      }
      setInitialBlocks(blocks);
      setEditorBlocks(blocks);
      setHasChanges(false);

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
      await api.post(`/revisions/${revId}/restore`, {});
      if (slug) await fetchContent(slug);
      setShowRevisions(false);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed to restore revision", "error");
    } finally {
      setRestoringRevision(false);
    }
  }

  const markChanged = useCallback(() => setHasChanges(true), []);
  const handleTitleChange = useCallback((val: string) => { setTitle(val); markChanged(); }, [markChanged]);
  const handleExcerptChange = useCallback((val: string) => { setExcerpt(val); markChanged(); }, [markChanged]);
  const handleStatusChange = useCallback((val: ContentStatus) => { setStatus(val); markChanged(); }, [markChanged]);
  const handleFeaturedImageChange = useCallback((val: string) => { setFeaturedImageUrl(val); markChanged(); }, [markChanged]);

  async function openMediaPicker() {
    setShowMediaPicker(true);
    setMediaLoading(true);
    try {
      const res = await api.get<{ data: MediaItem[] }>("/api/media");
      setMediaItems((res?.data || []).filter((m) => m.mime_type?.startsWith("image/")));
    } catch {
      // ignore
    } finally {
      setMediaLoading(false);
    }
  }

  function selectMedia(item: MediaItem) {
    if (item.url) {
      handleFeaturedImageChange(item.url);
      setShowMediaPicker(false);
    }
  }

  const handleEditorChange = useCallback((blocks: PartialBlock[]) => {
    setEditorBlocks(blocks);
    markChanged();
  }, [markChanged]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    const blockData = blockNoteToLegacyBlocks(editorBlocks) as { block_type: BlockType; data: Record<string, unknown> }[];
    const blocknoteJson = JSON.stringify(editorBlocks);
    const seoMeta: Record<string, string> = { blocknote_json: blocknoteJson };
    if (seoTitle.trim()) seoMeta.seo_title = seoTitle.trim();
    if (seoDescription.trim()) seoMeta.seo_description = seoDescription.trim();

    if (isCreateMode || !slug) {
      try {
        const newItem = await createContent({
          title: title.trim(),
          type: contentType,
          status,
          blocks: blockData.length > 0 ? blockData : undefined,
          meta: seoMeta,
          featured_image_url: featuredImageUrl.trim() || undefined,
          term_ids: selectedTermIds.length > 0 ? selectedTermIds : undefined,
          ...(status === "scheduled" && scheduledAt ? { scheduled_at: new Date(scheduledAt).toISOString() } : {}),
        });
        setHasChanges(false);
        setLastSaved(new Date().toLocaleTimeString());
        void navigate({ to: "/admin/content/edit", search: { slug: newItem.slug } });
      } catch {
        toast("Failed to create content", "error");
      }
    } else {
      try {
        await saveContent(slug, {
          title: title.trim(),
          excerpt: excerpt.trim() || undefined,
          status,
          blocks: blockData,
          meta: seoMeta,
          featured_image_url: featuredImageUrl.trim() || undefined,
          term_ids: selectedTermIds,
          ...(status === "scheduled" && scheduledAt ? { scheduled_at: new Date(scheduledAt).toISOString() } : {}),
        });
        setHasChanges(false);
        setLastSaved(new Date().toLocaleTimeString());
        if (contentIdRef.current) loadRevisions(contentIdRef.current);
      } catch {
        toast("Failed to save content", "error");
      }
    }
  }, [title, excerpt, status, editorBlocks, isCreateMode, slug, contentType, featuredImageUrl, selectedTermIds, scheduledAt, seoTitle, seoDescription, createContent, saveContent, navigate, toast]);

  const handleTogglePublish = useCallback(() => {
    handleStatusChange(status === "published" ? "draft" : "published");
  }, [status, handleStatusChange]);

  const handleSubmitForReview = useCallback(() => {
    handleStatusChange("pending");
  }, [handleStatusChange]);

  // Autosave: debounced 30s
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasChanges || isCreateMode || !slug) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { void handleSave(); }, 30_000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [hasChanges, editorBlocks, title, excerpt, status, featuredImageUrl, selectedTermIds, scheduledAt, isCreateMode, slug, handleSave]);

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
      <div className="flex h-full items-center justify-center">
        <div className="text-text-tertiary text-sm">Loading content...</div>
      </div>
    );
  }

  // Error state
  if (detailError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-red-500">{detailError}</div>
        <button onClick={() => void navigate({ to: "/admin/content" })} className="text-sm text-primary-600 hover:underline">
          Back to content list
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void navigate({ to: "/admin/content" })}
            className="text-text-tertiary hover:text-text-primary transition-colors"
            title="Back to content list"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 10H5M5 10l4-4M5 10l4 4" />
            </svg>
          </button>
          <span className="text-sm text-text-tertiary">
            {isCreateMode
              ? `New ${contentType === "page" ? "Page" : "Post"}`
              : (
                <span className="flex items-center gap-1.5">
                  <span>{contentType === "page" ? "Page" : "Post"}</span>
                  <span className="text-text-tertiary">/</span>
                  <span className="text-text-primary font-medium truncate max-w-xs">{title || "Untitled"}</span>
                </span>
              )}
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
          {isLimitedRole && status === "draft" && (
            <button
              onClick={() => { handleSubmitForReview(); void handleSave(); }}
              className="px-3 py-1.5 text-xs rounded bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
            >
              Submit for Review
            </button>
          )}
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
          {status === "published" && slug && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs rounded border border-border text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Preview
            </a>
          )}
        </div>
      </div>

      {/* Save error banner */}
      {saveError && (
        <div className="shrink-0 px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-200">{saveError}</div>
      )}

      {/* Revision History */}
      {showRevisions && (
        <div className="shrink-0 mx-4 mt-2 border border-border rounded-lg bg-surface-secondary p-3">
          <h3 className="text-xs font-semibold text-text-primary mb-2">Revision History</h3>
          {revisions.length === 0 ? (
            <p className="text-xs text-text-tertiary">No revisions yet.</p>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {revisions.map((rev) => (
                <div key={rev.id} className="flex items-center justify-between text-xs py-1">
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

      {/* Main area: Canvas + Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto">
            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={contentType === "page" ? "Page title..." : "Post title..."}
              className="w-full text-3xl font-bold text-text-primary placeholder:text-text-tertiary border-0 bg-transparent focus:outline-none mb-2 p-0"
            />

            {/* Excerpt */}
            <textarea
              value={excerpt}
              onChange={(e) => handleExcerptChange(e.target.value)}
              placeholder="Write an excerpt (optional)..."
              rows={2}
              className="w-full text-sm text-text-secondary placeholder:text-text-tertiary border-0 bg-transparent focus:outline-none mb-4 p-0 resize-none"
            />

            {/* Rich Text Editor */}
            <div className="border border-border rounded-lg bg-surface">
              <RichTextEditor
                initialContent={initialBlocks}
                onChange={handleEditorChange}
                editable={true}
              />
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        <Sidebar>
          <DocumentPanel
            contentType={contentType}
            onContentTypeChange={setContentType}
            isCreateMode={isCreateMode}
            status={status}
            onStatusChange={(val) => handleStatusChange(val as ContentStatus)}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            markChanged={markChanged}
          />
          <FeaturedImagePanel
            imageUrl={featuredImageUrl}
            onChange={handleFeaturedImageChange}
            onOpenMediaPicker={openMediaPicker}
          />
          <TaxonomyPanel
            categories={categories}
            tags={tags}
            selectedTermIds={selectedTermIds}
            onTermIdsChange={setSelectedTermIds}
            markChanged={markChanged}
          />
          <SEOPanel
            title={title}
            seoTitle={seoTitle}
            onSeoTitleChange={setSeoTitle}
            seoDescription={seoDescription}
            onSeoDescriptionChange={setSeoDescription}
            markChanged={markChanged}
          />
        </Sidebar>
      </div>

      {/* Bottom Bar */}
      <EditorBottomBar
        hasChanges={hasChanges}
        isSaving={isSaving}
        lastSaved={lastSaved}
        wordCount={wordCount}
        readingTime={readingTime}
      />

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowMediaPicker(false)}>
          <div className="bg-surface rounded-xl w-full max-w-2xl max-h-[80vh] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-base font-bold text-text-primary">Choose Image</h2>
              <button onClick={() => setShowMediaPicker(false)} className="text-text-tertiary hover:text-text-primary text-lg" aria-label="Close media picker">{'\u00d7'}</button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {mediaLoading ? (
                <div className="text-center py-8 text-text-tertiary text-sm">Loading media...</div>
              ) : mediaItems.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary text-sm">No images in the media library.</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {mediaItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectMedia(item)}
                      className={`aspect-square rounded-md border-2 overflow-hidden hover:border-primary-500 transition-colors ${featuredImageUrl === item.url ? "border-primary-500 ring-2 ring-primary-200" : "border-border"}`}
                    >
                      {item.url ? (
                        <img src={item.url} alt={item.original_name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-secondary flex items-center justify-center text-2xl opacity-30">&#128196;</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
