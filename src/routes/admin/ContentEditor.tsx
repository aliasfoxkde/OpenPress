import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useContentStore } from "@/stores/content";
import { BlockEditor } from "@/components/editor/BlockEditor";
import type { BlockType, ContentStatus } from "@openpress/shared";

const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

export function ContentEditor() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { slug?: string };
  const slug = search.slug;

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
    addBlock,
    updateBlockData,
    updateBlockType,
    removeBlock,
    reorderBlocks,
  } = useContentStore();

  // Local state for title/excerpt edits
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [hasChanges, setHasChanges] = useState(false);

  // Create mode vs edit mode
  const isCreateMode = !slug;

  // Load existing content
  useEffect(() => {
    if (slug) {
      fetchContent(slug);
    }
    return () => {
      clearCurrent();
    };
  }, [slug, fetchContent, clearCurrent]);

  // Sync local state from loaded content
  useEffect(() => {
    if (currentContent) {
      setTitle(currentContent.item.title);
      setExcerpt(currentContent.item.excerpt ?? "");
      setStatus(currentContent.item.status);
      setHasChanges(false);
    }
  }, [currentContent?.item.id]); // Only on initial load, not every render

  const markChanged = useCallback(() => setHasChanges(true), []);

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      markChanged();
    },
    [markChanged],
  );

  const handleExcerptChange = useCallback(
    (val: string) => {
      setExcerpt(val);
      markChanged();
    },
    [markChanged],
  );

  const handleStatusChange = useCallback(
    (val: ContentStatus) => {
      setStatus(val);
      markChanged();
    },
    [markChanged],
  );

  // Save handler
  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    const blockData = (currentContent?.blocks || []).map((b) => ({
      block_type: b.block_type,
      data: b.data,
    }));

    if (isCreateMode || !slug) {
      try {
        const newItem = await createContent({
          title: title.trim(),
          status,
          blocks: blockData.length > 0 ? blockData : undefined,
        });
        setHasChanges(false);
        // Navigate to edit mode with the new slug
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
        });
        setHasChanges(false);
      } catch {
        // Error handled in store
      }
    }
  }, [
    title,
    excerpt,
    status,
    currentContent?.blocks,
    isCreateMode,
    slug,
    createContent,
    saveContent,
    navigate,
  ]);

  // Publish toggle
  const handleTogglePublish = useCallback(() => {
    const newStatus: ContentStatus = status === "published" ? "draft" : "published";
    handleStatusChange(newStatus);
  }, [status, handleStatusChange]);

  // Block mutation wrappers that also mark dirty
  const handleAddBlock = useCallback(
    (type: BlockType, pos?: number) => {
      addBlock(type, pos);
      markChanged();
    },
    [addBlock, markChanged],
  );

  const handleUpdateBlockData = useCallback(
    (id: string, data: Record<string, unknown>) => {
      updateBlockData(id, data);
      markChanged();
    },
    [updateBlockData, markChanged],
  );

  const handleUpdateBlockType = useCallback(
    (id: string, type: BlockType) => {
      updateBlockType(id, type);
      markChanged();
    },
    [updateBlockType, markChanged],
  );

  const handleRemoveBlock = useCallback(
    (id: string) => {
      removeBlock(id);
      markChanged();
    },
    [removeBlock, markChanged],
  );

  const handleReorderBlocks = useCallback(
    (from: number, to: number) => {
      reorderBlocks(from, to);
      markChanged();
    },
    [reorderBlocks, markChanged],
  );

  // Keyboard shortcut: Ctrl+S to save
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

  const blocks = currentContent?.blocks || [];

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
        <button
          onClick={() => void navigate({ to: "/admin/content" })}
          className="text-sm text-primary-600 hover:underline"
        >
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
        </div>
        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as ContentStatus)}
            className="text-xs border border-border rounded px-2 py-1.5 bg-surface"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Publish/Unpublish toggle */}
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
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {saveError}
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
        className="w-full text-sm text-text-secondary placeholder:text-text-tertiary border-0 bg-transparent focus:outline-none mb-6 p-0 resize-none"
      />

      {/* Block Editor */}
      <div className="border border-border rounded-lg bg-surface">
        <BlockEditor
          blocks={blocks}
          onUpdateBlockData={handleUpdateBlockData}
          onUpdateBlockType={handleUpdateBlockType}
          onRemoveBlock={handleRemoveBlock}
          onReorderBlocks={handleReorderBlocks}
          onAddBlock={handleAddBlock}
        />

        {/* Empty state */}
        {blocks.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-text-tertiary text-sm mb-4">
              No blocks yet. Add your first block to start writing.
            </p>
            <button
              onClick={() => handleAddBlock("text", 0)}
              className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              + Add text block
            </button>
          </div>
        )}
      </div>

      {/* Unsaved indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-md text-xs shadow-md">
          Unsaved changes (Ctrl+S to save)
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
