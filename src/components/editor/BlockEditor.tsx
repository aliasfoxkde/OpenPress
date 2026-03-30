import { useState, useRef, useCallback, type DragEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import type { ContentBlock, BlockType } from "@openpress/shared";

// ── Formatting helpers ──────────────────────────────────────────────
function wrapSelection(
  textarea: HTMLTextAreaElement,
  blockId: string,
  prefix: string,
  suffix: string,
  onUpdate: (id: string, data: Record<string, unknown>) => void,
) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd) || "";
  const newText =
    value.slice(0, selectionStart) + `${prefix}${selected}${suffix}` + value.slice(selectionEnd);
  onUpdate(blockId, { text: newText });
  // Position cursor inside the markers
  setTimeout(() => {
    textarea.selectionStart = selectionStart + prefix.length;
    textarea.selectionEnd = selectionEnd + prefix.length;
    textarea.focus();
  }, 0);
}

// ── Block type menu ─────────────────────────────────────────────────
const BLOCK_TYPES: { value: BlockType; label: string }[] = [
  { value: "text", label: "Paragraph" },
  { value: "heading", label: "Heading" },
  { value: "image", label: "Image" },
  { value: "code", label: "Code" },
  { value: "quote", label: "Quote" },
  { value: "list", label: "List" },
  { value: "divider", label: "Divider" },
  { value: "embed", label: "Embed" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "gallery", label: "Gallery" },
  { value: "custom", label: "Custom HTML" },
];

interface BlockEditorProps {
  blocks: ContentBlock[];
  onUpdateBlockData: (blockId: string, data: Record<string, unknown>) => void;
  onUpdateBlockType: (blockId: string, blockType: BlockType) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlocks: (fromIndex: number, toIndex: number) => void;
  onAddBlock: (blockType: BlockType, position?: number) => void;
  readOnly?: boolean;
}

export function BlockEditor({
  blocks,
  onUpdateBlockData,
  onUpdateBlockType,
  onRemoveBlock,
  onReorderBlocks,
  onAddBlock,
  readOnly = false,
}: BlockEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showTypeMenu, setShowTypeMenu] = useState<string | null>(null);
  const [activeTextarea, setActiveTextarea] = useState<HTMLTextAreaElement | null>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Drag handlers ───────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Minimal drag image
      const el = e.currentTarget.cloneNode(true) as HTMLElement;
      el.style.width = "300px";
      el.style.opacity = "0.8";
      document.body.appendChild(el);
      e.dataTransfer.setDragImage(el, 0, 0);
      requestAnimationFrame(() => document.body.removeChild(el));
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragIndex !== null && dragIndex !== index) {
        setDropIndex(index);
      }
    },
    [dragIndex],
  );

  const handleDrop = useCallback(
    (e: DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex !== null && dragIndex !== index) {
        onReorderBlocks(dragIndex, index);
      }
      setDragIndex(null);
      setDropIndex(null);
    },
    [dragIndex, onReorderBlocks],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  // ── Formatting toolbar ──────────────────────────────────────────────
  const activeBlock = activeBlockId ? blocks.find((b) => b.id === activeBlockId) : null;
  const isTextBlock = activeBlock?.block_type === "text" || activeBlock?.block_type === "heading";

  const applyFormat = useCallback(
    (prefix: string, suffix: string) => {
      if (activeTextarea && activeBlockId) {
        wrapSelection(activeTextarea, activeBlockId, prefix, suffix, onUpdateBlockData);
      }
    },
    [activeTextarea, activeBlockId, onUpdateBlockData],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (block: ContentBlock, e: KeyboardEvent) => {
      // Ctrl/Cmd+Enter: toggle paragraph <-> heading
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const newType: BlockType = block.block_type === "heading" ? "text" : "heading";
        onUpdateBlockType(block.id, newType);
        return;
      }

      // Ctrl/Cmd+B: bold (insert ** markers)
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const { selectionStart, selectionEnd, value } = textarea;
        const selected = value.slice(selectionStart, selectionEnd);
        const newText =
          value.slice(0, selectionStart) + `**${selected}**` + value.slice(selectionEnd);
        onUpdateBlockData(block.id, { text: newText });
        // Restore cursor position after React re-renders
        setTimeout(() => {
          textarea.selectionStart = selectionStart + 2;
          textarea.selectionEnd = selectionEnd + 2;
        }, 0);
        return;
      }

      // Ctrl/Cmd+I: italic (insert * markers)
      if ((e.ctrlKey || e.metaKey) && e.key === "i") {
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const { selectionStart, selectionEnd, value } = textarea;
        const selected = value.slice(selectionStart, selectionEnd);
        const newText =
          value.slice(0, selectionStart) + `*${selected}*` + value.slice(selectionEnd);
        onUpdateBlockData(block.id, { text: newText });
        setTimeout(() => {
          textarea.selectionStart = selectionStart + 1;
          textarea.selectionEnd = selectionEnd + 1;
        }, 0);
        return;
      }

      // Ctrl/Cmd+K: insert link
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const textarea = e.target as HTMLTextAreaElement;
        const { selectionStart, selectionEnd, value } = textarea;
        const selected = value.slice(selectionStart, selectionEnd) || "link text";
        const newText =
          value.slice(0, selectionStart) +
          `[${selected}](url)` +
          value.slice(selectionEnd);
        onUpdateBlockData(block.id, { text: newText });
        return;
      }

      // Backspace on empty block: delete it
      if (e.key === "Backspace") {
        const textarea = e.target as HTMLTextAreaElement;
        if (textarea.value === "" && blocks.length > 1) {
          e.preventDefault();
          const idx = blocks.findIndex((b) => b.id === block.id);
          onRemoveBlock(block.id);
          // Focus previous block
          if (idx > 0) {
            const prevBlock = blocks[idx - 1];
            const prevEl = blockRefs.current.get(prevBlock.id);
            const prevTextarea = prevEl?.querySelector("textarea");
            if (prevTextarea) {
              prevTextarea.focus();
            }
          }
        }
        return;
      }

      // Enter without modifiers in a text block: create new text block below
      if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (block.block_type === "text" || block.block_type === "heading") {
          const textarea = e.target as HTMLTextAreaElement;
          if (textarea.value === "") {
            e.preventDefault();
            const idx = blocks.findIndex((b) => b.id === block.id);
            onAddBlock("text", idx + 1);
            // Focus the new block
            setTimeout(() => {
              const newBlock = blocks[idx + 1];
              if (newBlock) {
                const newEl = blockRefs.current.get(newBlock.id);
                const newTextarea = newEl?.querySelector("textarea");
                newTextarea?.focus();
              }
            }, 50);
          }
        }
      }
    },
    [blocks, onAddBlock, onRemoveBlock, onUpdateBlockData, onUpdateBlockType],
  );

  if (blocks.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-surface-secondary">
        <p className="text-text-tertiary text-sm mb-3">No blocks yet</p>
        <div className="flex flex-wrap justify-center gap-2">
          {BLOCK_TYPES.slice(0, 4).map((bt) => (
            <button
              key={bt.value}
              onClick={() => onAddBlock(bt.value, 0)}
              disabled={readOnly}
              className="px-3 py-1.5 text-xs rounded-md border border-border bg-surface hover:bg-surface-tertiary transition-colors disabled:opacity-50"
            >
              + {bt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <div key={block.id}>
          {/* Drop zone above */}
          {dragIndex !== null && dragIndex !== index && dropIndex === index && (
            <div className="h-1 bg-primary-400 rounded-full mb-1" />
          )}

          <div
            ref={(el) => {
              if (el) blockRefs.current.set(block.id, el);
            }}
            className={cn(
              "group relative rounded-lg border transition-all",
              activeBlockId === block.id
                ? "border-primary-300 ring-1 ring-primary-100"
                : "border-transparent hover:border-border",
              dragIndex === index && "opacity-50",
              "bg-surface",
            )}
            onClick={() => setActiveBlockId(block.id)}
          >
            {/* Block toolbar */}
            {!readOnly && (
              <div
                className={cn(
                  "absolute -left-10 top-1 flex flex-col items-center gap-0.5",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                )}
              >
                {/* Drag handle */}
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  className="p-1 cursor-grab text-text-tertiary hover:text-text-primary rounded hover:bg-surface-tertiary"
                  title="Drag to reorder"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="3" r="1.5" />
                    <circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" />
                    <circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" />
                    <circle cx="11" cy="13" r="1.5" />
                  </svg>
                </button>

                {/* Add block below */}
                <button
                  onClick={() => onAddBlock("text", index + 1)}
                  className="p-1 text-text-tertiary hover:text-primary-600 rounded hover:bg-surface-tertiary"
                  title="Add block below"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="3" x2="8" y2="13" />
                    <line x1="3" y1="8" x2="13" y2="8" />
                  </svg>
                </button>
              </div>
            )}

            {/* Block content */}
            <div className="p-3 pl-2">
              {/* Formatting toolbar for text/heading blocks */}
              {!readOnly && activeBlockId === block.id && (block.block_type === "text" || block.block_type === "heading") && (
                <div className="flex items-center gap-0.5 mb-1 pb-1 border-b border-border">
                  <ToolbarButton
                    title="Bold (Ctrl+B)"
                    onClick={() => applyFormat("**", "**")}
                  >
                    <strong className="text-xs">B</strong>
                  </ToolbarButton>
                  <ToolbarButton
                    title="Italic (Ctrl+I)"
                    onClick={() => applyFormat("*", "*")}
                  >
                    <em className="text-xs">I</em>
                  </ToolbarButton>
                  <ToolbarButton
                    title="Strikethrough"
                    onClick={() => applyFormat("~~", "~~")}
                  >
                    <span className="text-xs line-through">S</span>
                  </ToolbarButton>
                  <span className="w-px h-4 bg-border mx-1" />
                  <ToolbarButton
                    title="Link (Ctrl+K)"
                    onClick={() => applyFormat("[", "](url)")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </ToolbarButton>
                  <ToolbarButton
                    title="Code"
                    onClick={() => applyFormat("`", "`")}
                  >
                    <span className="text-xs font-mono">&lt;&gt;</span>
                  </ToolbarButton>
                </div>
              )}
              <BlockRenderer
                block={block}
                readOnly={readOnly}
                onUpdateData={onUpdateBlockData}
                onKeyDown={handleKeyDown}
                showTypeMenu={showTypeMenu === block.id}
                onToggleTypeMenu={() =>
                  setShowTypeMenu(showTypeMenu === block.id ? null : block.id)
                }
                onChangeType={(newType) => {
                  onUpdateBlockType(block.id, newType);
                  setShowTypeMenu(null);
                }}
                onDelete={() => onRemoveBlock(block.id)}
                onTextareaRef={setActiveTextarea}
              />
            </div>

            {/* Sort order indicator */}
            <div className="absolute right-2 top-1 text-[10px] text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
              #{block.sort_order}
            </div>
          </div>

          {/* Drop zone below last item */}
          {dragIndex !== null &&
            dragIndex !== index &&
            dropIndex === index &&
            index === blocks.length - 1 && (
              <div className="h-1 bg-primary-400 rounded-full mt-1" />
            )}
        </div>
      ))}

      {/* Add block button at bottom */}
      {!readOnly && (
        <div className="flex justify-center pt-2">
          <AddBlockButton onAdd={onAddBlock} position={blocks.length} />
        </div>
      )}
    </div>
  );
}

// ── Block renderer ────────────────────────────────────────────────────
interface BlockRendererProps {
  block: ContentBlock;
  readOnly: boolean;
  onUpdateData: (blockId: string, data: Record<string, unknown>) => void;
  onKeyDown: (block: ContentBlock, e: KeyboardEvent) => void;
  showTypeMenu: boolean;
  onToggleTypeMenu: () => void;
  onChangeType: (type: BlockType) => void;
  onDelete: () => void;
  onTextareaRef: (el: HTMLTextAreaElement | null) => void;
}

function BlockRenderer({
  block,
  readOnly,
  onUpdateData,
  onKeyDown,
  showTypeMenu,
  onToggleTypeMenu,
  onChangeType,
  onDelete,
  onTextareaRef,
}: BlockRendererProps) {
  const updateField = (field: string, value: unknown) => {
    onUpdateData(block.id, { ...block.data, [field]: value });
  };

  const text = String(block.data.text ?? "");
  const level = Number(block.data.level ?? 2);
  const code = String(block.data.code ?? "");
  const language = String(block.data.language ?? "plaintext");
  const url = String(block.data.url ?? "");
  const alt = String(block.data.alt ?? "");
  const caption = String(block.data.caption ?? "");
  const source = String(block.data.source ?? "");

  return (
    <div className="flex items-start gap-2">
      {/* Type selector */}
      {!readOnly && (
        <div className="relative shrink-0 pt-1">
          <button
            onClick={onToggleTypeMenu}
            className="text-[11px] px-1.5 py-0.5 rounded border border-border text-text-tertiary hover:text-text-primary hover:border-primary-300 transition-colors"
          >
            {block.block_type}
          </button>
          {showTypeMenu && (
            <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-20 py-1 w-36 max-h-60 overflow-y-auto">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  onClick={() => onChangeType(bt.value)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-surface-tertiary transition-colors",
                    bt.value === block.block_type
                      ? "text-primary-600 font-medium"
                      : "text-text-secondary",
                  )}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Block content area */}
      <div className="flex-1 min-w-0">
        {block.block_type === "text" && (
          <textarea
            ref={onTextareaRef}
            value={text}
            onChange={(e) => updateField("text", e.target.value)}
            onKeyDown={(e) => onKeyDown(block, e)}
            onFocus={() => onTextareaRef(e.currentTarget)}
            readOnly={readOnly}
            placeholder="Type something..."
            rows={Math.max(2, text.split("\n").length)}
            className="w-full resize-none border-0 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0 p-0"
          />
        )}

        {block.block_type === "heading" && (
          <div>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4].map((l) => (
                <button
                  key={l}
                  onClick={() => updateField("level", l)}
                  disabled={readOnly}
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] rounded transition-colors",
                    level === l
                      ? "bg-primary-100 text-primary-700"
                      : "text-text-tertiary hover:bg-surface-tertiary",
                  )}
                >
                  H{l}
                </button>
              ))}
            </div>
            {readOnly ? (
              <p
                className={cn(
                  "font-bold text-text-primary",
                  level === 1 && "text-2xl",
                  level === 2 && "text-xl",
                  level === 3 && "text-lg",
                  level === 4 && "text-base",
                )}
              >
                {text}
              </p>
            ) : (
              <textarea
                ref={onTextareaRef}
                value={text}
                onChange={(e) => updateField("text", e.target.value)}
                onKeyDown={(e) => onKeyDown(block, e)}
                onFocus={() => onTextareaRef(e.currentTarget)}
                placeholder="Heading text..."
                rows={1}
                className={cn(
                  "w-full resize-none border-0 bg-transparent font-bold text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-0 p-0",
                  level === 1 && "text-2xl",
                  level === 2 && "text-xl",
                  level === 3 && "text-lg",
                  level === 4 && "text-base",
                )}
              />
            )}
          </div>
        )}

        {block.block_type === "image" && (
          <div className="space-y-2">
            {url && !readOnly ? (
              <img
                src={url}
                alt={alt}
                className="max-w-full rounded border border-border"
              />
            ) : url ? (
              <img
                src={url}
                alt={alt}
                className="max-w-full rounded border border-border"
              />
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-surface-secondary">
                <svg className="mx-auto mb-2 text-text-tertiary" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                <p className="text-xs text-text-tertiary">Image block</p>
              </div>
            )}
            {!readOnly && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateField("url", e.target.value)}
                  placeholder="Image URL..."
                  className="w-full text-xs border border-border rounded px-2 py-1 focus:border-border-focus focus:outline-none"
                />
                <input
                  type="text"
                  value={alt}
                  onChange={(e) => updateField("alt", e.target.value)}
                  placeholder="Alt text..."
                  className="w-full text-xs border border-border rounded px-2 py-1 focus:border-border-focus focus:outline-none"
                />
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => updateField("caption", e.target.value)}
                  placeholder="Caption..."
                  className="w-full text-xs border border-border rounded px-2 py-1 focus:border-border-focus focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {block.block_type === "code" && (
          <div className="space-y-1">
            {!readOnly && (
              <select
                value={language}
                onChange={(e) => updateField("language", e.target.value)}
                className="text-[11px] border border-border rounded px-1.5 py-0.5 bg-surface text-text-secondary"
              >
                {[
                  "plaintext",
                  "javascript",
                  "typescript",
                  "python",
                  "html",
                  "css",
                  "json",
                  "sql",
                  "bash",
                  "go",
                  "rust",
                  "java",
                ].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}
            <textarea
              value={code}
              onChange={(e) => updateField("code", e.target.value)}
              onKeyDown={(e) => {
                // Tab to indent in code blocks
                if (e.key === "Tab") {
                  e.preventDefault();
                  const textarea = e.target as HTMLTextAreaElement;
                  const { selectionStart, selectionEnd, value: val } = textarea;
                  const newVal = val.slice(0, selectionStart) + "  " + val.slice(selectionEnd);
                  updateField("code", newVal);
                  setTimeout(() => {
                    textarea.selectionStart = selectionStart + 2;
                    textarea.selectionEnd = selectionStart + 2;
                  }, 0);
                }
              }}
              readOnly={readOnly}
              placeholder="Code..."
              rows={Math.max(3, code.split("\n").length)}
              className="w-full resize-none bg-surface-secondary text-xs font-mono text-text-primary rounded border border-border p-2 focus:border-border-focus focus:outline-none"
            />
          </div>
        )}

        {block.block_type === "quote" && (
          <div className="border-l-4 border-primary-300 pl-3 py-1">
            <textarea
              value={text}
              onChange={(e) => updateField("text", e.target.value)}
              onKeyDown={(e) => onKeyDown(block, e)}
              readOnly={readOnly}
              placeholder="Quote text..."
              rows={Math.max(2, text.split("\n").length)}
              className="w-full resize-none border-0 bg-transparent text-sm text-text-primary italic placeholder:text-text-tertiary focus:outline-none focus:ring-0 p-0"
            />
            {!readOnly && (
              <input
                type="text"
                value={source}
                onChange={(e) => updateField("source", e.target.value)}
                placeholder="Source..."
                className="w-full text-xs border-0 bg-transparent text-text-secondary placeholder:text-text-tertiary focus:outline-none mt-1"
              />
            )}
            {readOnly && source && (
              <p className="text-xs text-text-tertiary mt-1">-- {source}</p>
            )}
          </div>
        )}

        {block.block_type === "list" && (
          <div className="space-y-1">
            {String(
              block.data.items
                ? (block.data.items as string[]).join("\n")
                : "",
            )
              .split("\n")
              .map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-text-tertiary text-xs">
                    {block.data.ordered ? `${i + 1}.` : "\u2022"}
                  </span>
                  {!readOnly ? (
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const items = (
                          (block.data.items as string[]) || []
                        ).slice();
                        items[i] = e.target.value;
                        // Add new item when editing last
                        if (i === items.length - 1 && e.target.value) {
                          items.push("");
                        }
                        updateField("items", items);
                      }}
                      className="flex-1 text-sm border-0 bg-transparent focus:outline-none p-0"
                      placeholder="List item..."
                    />
                  ) : (
                    <span className="text-sm text-text-primary">{item}</span>
                  )}
                </div>
              ))}
            {!readOnly && (
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() =>
                    updateField("ordered", !block.data.ordered)
                  }
                  className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded border transition-colors",
                    block.data.ordered
                      ? "bg-primary-100 text-primary-700 border-primary-200"
                      : "text-text-tertiary border-border hover:border-primary-300",
                  )}
                >
                  {block.data.ordered ? "Ordered" : "Unordered"}
                </button>
              </div>
            )}
          </div>
        )}

        {block.block_type === "divider" && (
          <hr className="border-border my-2" />
        )}

        {block.block_type === "embed" && (
          <div className="space-y-2">
            {url && (
              <div className="border border-border rounded bg-surface-secondary p-4 text-center">
                <p className="text-sm text-text-secondary">
                  Embed: {url}
                </p>
              </div>
            )}
            {!readOnly && (
              <input
                type="text"
                value={url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="Embed URL..."
                className="w-full text-xs border border-border rounded px-2 py-1 focus:border-border-focus focus:outline-none"
              />
            )}
          </div>
        )}

        {block.block_type === "video" && (
          <div className="space-y-2">
            {url ? (
              <video
                src={url}
                controls
                className="max-w-full rounded border border-border"
              />
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-surface-secondary">
                <p className="text-xs text-text-tertiary">Video block</p>
              </div>
            )}
            {!readOnly && (
              <input
                type="text"
                value={url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="Video URL..."
                className="w-full text-xs border border-border rounded px-2 py-1 focus:border-border-focus focus:outline-none"
              />
            )}
          </div>
        )}

        {block.block_type === "audio" && (
          <div className="space-y-2">
            {url ? (
              <audio src={url} controls className="w-full" />
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center bg-surface-secondary">
                <p className="text-xs text-text-tertiary">Audio block</p>
              </div>
            )}
            {!readOnly && (
              <input
                type="text"
                value={url}
                onChange={(e) => updateField("url", e.target.value)}
                placeholder="Audio URL..."
                className="w-full text-xs border border-border rounded px-2 py-1 focus:border-border-focus focus:outline-none"
              />
            )}
          </div>
        )}

        {block.block_type === "custom" && (
          <textarea
            value={String(block.data.html ?? "")}
            onChange={(e) => updateField("html", e.target.value)}
            readOnly={readOnly}
            placeholder="Custom HTML..."
            rows={4}
            className="w-full resize-none bg-surface-secondary text-xs font-mono text-text-primary rounded border border-border p-2 focus:border-border-focus focus:outline-none"
          />
        )}

        {(block.block_type === "gallery" ||
          block.block_type === "component") && (
          <div className="border border-border rounded bg-surface-secondary p-4 text-center">
            <p className="text-xs text-text-tertiary">
              {block.block_type === "gallery" ? "Gallery" : "Component"} block
              (coming soon)
            </p>
          </div>
        )}
      </div>

      {/* Delete button */}
      {!readOnly && (
        <button
          onClick={onDelete}
          className="shrink-0 p-1 text-text-tertiary hover:text-red-500 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete block"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Toolbar button ────────────────────────────────────────────────────
function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition-colors"
    >
      {children}
    </button>
  );
}

// ── Add block button ──────────────────────────────────────────────────
function AddBlockButton({
  onAdd,
  position,
}: {
  onAdd: (type: BlockType, position?: number) => void;
  position: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-1.5 text-sm text-text-secondary border border-border rounded-md hover:border-primary-300 hover:text-primary-600 transition-colors bg-surface"
      >
        + Add block
      </button>
      {expanded && (
        <>
          {/* Click-away backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setExpanded(false)}
          />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface border border-border rounded-lg shadow-lg z-20 py-2 w-48">
            <div className="px-3 py-1 text-xs font-medium text-text-tertiary uppercase">
              Block Type
            </div>
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.value}
                onClick={() => {
                  onAdd(bt.value, position);
                  setExpanded(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-text-secondary hover:bg-surface-tertiary hover:text-text-primary transition-colors"
              >
                {bt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
