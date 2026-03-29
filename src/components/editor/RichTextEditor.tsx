import { useCreateBlockNote, BlockNoteViewRaw, BlockNoteDefaultUI } from "@blocknote/react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BNBlock = any;

interface RichTextEditorProps {
  initialContent?: BNBlock[];
  onChange: (blocks: BNBlock[]) => void;
  editable?: boolean;
}

/**
 * WYSIWYG rich-text editor using BlockNote (TipTap/ProseMirror).
 * Provides:
 * - Slash menu (/) for block insertion
 * - Bubble menu for inline formatting (bold, italic, link, etc.)
 * - Built-in drag-and-drop block reordering
 * - Block type switching (paragraph <-> heading <-> list)
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, etc.)
 */
export function RichTextEditor({ initialContent, onChange, editable = true }: RichTextEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editor = useCreateBlockNote({
    initialContent: initialContent?.length ? initialContent : undefined,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { data?: { url?: string; id?: string } };
      return data.data?.url || `/api/media/${data.data?.id}/file`;
    },
  });

  return (
    <div className="rich-text-editor">
      <BlockNoteViewRaw
        editor={editor}
        onChange={() => {
          if (onChange) {
            onChange(editor.document);
          }
        }}
        editable={editable}
        theme="light"
      >
        <BlockNoteDefaultUI />
      </BlockNoteViewRaw>
    </div>
  );
}

/**
 * Convert BlockNote blocks to the legacy content_blocks format
 * for backward compatibility with the API.
 */
export function blockNoteToLegacyBlocks(
  blocks: BNBlock[],
): { block_type: string; data: Record<string, unknown> }[] {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((block: Record<string, unknown>) => {
    const type = String(block.type || "paragraph");
    const props = (block.props || {}) as Record<string, unknown>;

    switch (type) {
      case "heading": {
        const level = (props.level as number) || 2;
        return {
          block_type: "heading",
          data: {
            text: extractText(block),
            level,
          },
        };
      }
      case "bulletListItem":
      case "numberedListItem": {
        return {
          block_type: "list",
          data: {
            items: [extractText(block)],
            ordered: type === "numberedListItem",
          },
        };
      }
      case "image": {
        return {
          block_type: "image",
          data: {
            url: (props.url as string) || "",
            alt: (props.alt as string) || "",
            caption: (props.caption as string) || "",
          },
        };
      }
      case "codeBlock": {
        return {
          block_type: "code",
          data: {
            code: extractText(block),
            language: (props.language as string) || "plaintext",
          },
        };
      }
      case "quote": {
        return {
          block_type: "quote",
          data: {
            text: extractText(block),
            source: "",
          },
        };
      }
      default: {
        return {
          block_type: "text",
          data: { text: extractText(block) },
        };
      }
    }
  });
}

/**
 * Convert legacy content_blocks to BlockNote partial blocks.
 */
export function legacyBlocksToBlockNote(
  blocks: { block_type: string; data: Record<string, unknown> }[],
): BNBlock[] {
  return blocks.map((block) => {
    const data = block.data || {};
    const text = String(data.text || data.code || "");

    switch (block.block_type) {
      case "heading":
        return {
          type: "heading",
          props: { level: (data.level as number) || 2 },
          content: text ? [{ type: "text", text, styles: {} }] : undefined,
        };
      case "image":
        return {
          type: "image",
          props: {
            url: String(data.url || ""),
            alt: String(data.alt || ""),
            caption: String(data.caption || ""),
          },
        };
      case "code":
        return {
          type: "codeBlock",
          props: { language: String(data.language || "plaintext") },
          content: text ? [{ type: "text", text, styles: {} }] : undefined,
        };
      case "quote":
        return {
          type: "quote",
          content: text ? [{ type: "text", text, styles: { italic: true } }] : undefined,
        };
      case "list": {
        const items = (data.items as string[]) || [];
        if (items.length > 0) {
          return {
            type: data.ordered ? "numberedListItem" : "bulletListItem",
            content: items[0] ? [{ type: "text", text: items[0], styles: {} }] : undefined,
          };
        }
        return { type: "paragraph" };
      }
      default:
        return {
          type: "paragraph",
          content: text ? [{ type: "text", text, styles: {} }] : undefined,
        };
    }
  });
}

function extractText(block: Record<string, unknown>): string {
  const content = block.content;
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null && "text" in c)
      .map((c) => String(c.text))
      .join("");
  }
  return "";
}
