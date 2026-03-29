# OpenPress Technical Research

**Purpose:** Deep technical research for next-generation editor, page builder, multi-tenant hosting, and payments
**Last Updated:** 2026-03-29
**Status:** Research Complete

---

## Table of Contents

1. [TipTap Editor](#1-tiptap-editor)
2. [ProseMirror Document Model](#2-prosemirror-document-model)
3. [React Block Editors Comparison](#3-react-block-editors-comparison)
4. [Drag-and-Drop Page Building](#4-drag-and-drop-page-building)
5. [Cloudflare Workers Multi-Tenant Deployment](#5-cloudflare-workers-multi-tenant-deployment)
6. [Cloudflare Workers for Platforms](#6-cloudflare-workers-for-platforms)
7. [Edge-Native CMS Patterns](#7-edge-native-cms-patterns)
8. [Stripe Integration on Workers](#8-stripe-integration-on-workers)
9. [Recommendations for OpenPress](#9-recommendations-for-openpress)

---

## 1. TipTap Editor

### Overview

TipTap is a headless, extensible rich-text editor built on ProseMirror. It provides React bindings while keeping the core framework-agnostic. It is the most production-ready option for building a WordPress-replacement block editor.

### Architecture

```
@tiptap/core        -- Headless editor engine (framework-agnostic)
@tiptap/react       -- React bindings (useEditor, EditorContent, BubbleMenu)
@tiptap/pm          -- ProseMirror re-exports (state, view, model, transform)
@tiptap/starter-kit -- Bundle of common extensions
```

### Key Packages

| Package | Purpose |
|---------|---------|
| `@tiptap/core` | Editor engine, extension system, command manager |
| `@tiptap/react` | `useEditor` hook, `EditorContent`, `BubbleMenu`, `FloatingMenu` |
| `@tiptap/pm` | ProseMirror state, view, model, transform, keymap |
| `@tiptap/starter-kit` | Pre-configured bundle: Bold, Italic, Heading, BulletList, etc. |
| `@tiptap/extension-collaboration` | Yjs-based real-time collaboration |
| `@tiptap/extension-collaboration-cursor` | Multiplayer cursors |
| `@tiptap/extension-placeholder` | Placeholder text |
| `@tiptap/extension-link` | Hyperlink support |
| `@tiptap/extension-image` | Image insertion with attributes |
| `@tiptap/extension-table` | Full table support (rows, columns, merge) |
| `@tiptap/extension-task-list` | Checkbox lists |
| `@tiptap/extension-mention` | @-mention autocomplete |
| `@tiptap/extension-code-block-lowlight` | Syntax-highlighted code blocks via lowlight |

### React Usage Pattern

```tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

function RichTextEditor({ content, onUpdate }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getJSON());  // ProseMirror JSON doc
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg focus:outline-none max-w-none min-h-[200px]',
      },
    },
  });

  return <EditorContent editor={editor} />;
}
```

### Custom Extensions

TipTap's extension API is built on ProseMirror plugins with a declarative syntax:

```tsx
import { Extension } from '@tiptap/core';
import { Node, mergeAttributes } from '@tiptap/core';

// Custom mark (inline formatting)
const Highlight = Extension.create({
  name: 'highlight',
  addOptions() { return { color: '#ffc107' }; },
  addCommands() {
    return {
      toggleHighlight: () => ({ commands }) => commands.toggleMark('highlight'),
    };
  },
});

// Custom node (block-level)
const CalloutBlock = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  attrs: { type: { default: 'info' } },
  parseHTML() { return [{ tag: 'div[data-callout]' }]; },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0];
  },
});
```

### Collaborative Editing (Yjs)

TipTap integrates Yjs for real-time collaboration:

```tsx
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const provider = new WebsocketProvider('wss://your-server', 'doc-id', ydoc);

const editor = useEditor({
  extensions: [
    StarterKit.configure({ history: false }), // Yjs handles history
    Collaboration.configure({ document: ydoc }),
    CollaborationCursor.configure({
      provider,
      user: { name: 'User', color: '#f783ac' },
    }),
  ],
});
```

### Relevance to OpenPress

The current `BlockEditor.tsx` uses raw `<textarea>` elements per block with manual keyboard shortcut handling. Replacing this with TipTap would provide:
- Proper WYSIWYG rich-text editing inside each block
- 50+ production-tested extensions (tables, mentions, code blocks, links)
- Collaborative editing via Yjs (known limitation in PROGRESS.md)
- Custom node types that map to the existing `BlockType` union
- Built-in undo/redo, selection, and clipboard handling

---

## 2. ProseMirror Document Model

### Overview

ProseMirror is the underlying engine for TipTap, Remirror, Milkdown, and other modern editors. Understanding its document model is essential for extending the editor beyond basic rich text.

### Document Model

ProseMirror uses an **immutable node tree** with a well-defined schema:

```
Schema
  --> Document (Node tree)
    --> EditorState (doc + selection + storedMarks + plugins)
      --> Transactions (immutable state changes)
        --> View (DOM synchronization)
```

### Schema System

```js
import { Schema } from 'prosemirror-model';

const openPressSchema = new Schema({
  nodes: {
    doc:       { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', marks: '_' },
    heading:   { group: 'block', content: 'inline*', marks: '_',
                 attrs: { level: { default: 1 } } },
    image:     { group: 'block', inline: false,
                 attrs: { src: {}, alt: { default: '' }, caption: { default: '' } } },
    codeBlock: { group: 'block', content: 'text*',
                 attrs: { language: { default: 'plaintext' } } },
    blockquote:{ group: 'block', content: 'block+' },
    list:      { group: 'block', content: 'listItem+' },
    listItem:  { content: 'paragraph block*' },
    text:      { group: 'inline' },
    hardBreak: { inline: true, group: 'inline' },
  },
  marks: {
    bold:      { inclusive: true },
    italic:    { inclusive: true },
    link:      { attrs: { href: {}, title: { default: null } },
                 inclusive: false },
    strikethrough: {},
  },
});
```

**Content expressions** control what can go where:
- `"block+"` -- one or more block nodes
- `"inline*"` -- zero or more inline nodes
- `"paragraph block*"` -- a paragraph followed by optional blocks
- `"_"` -- any marks allowed

### Key Data Structures

| Structure | Purpose |
|-----------|---------|
| `Node` | Immutable document node (type, attrs, content Fragment, marks) |
| `Fragment` | Ordered sequence of child nodes |
| `Slice` | A slice of a document (used for copy/paste, drag/drop) |
| `Mark` | Inline formatting annotation (bold, italic, link) |
| `ResolvedPos` | Position with context (parent, depth, text offset) |
| `Selection` | Current selection (TextSelection, NodeSelection, AllSelection) |

### Transactions (State Changes)

All edits go through transactions -- immutable state transitions:

```js
const state = EditorState.create({ schema, doc });
const tr = state.tr;
tr.insertText('Hello', 1);
tr.setNodeMarkup(pos, null, { level: 2 }); // Change heading level
const newState = state.apply(tr);
```

Each transaction records:
- Steps (individual changes: ReplaceStep, AddMarkStep, etc.)
- Document before and after
- Selection mapping
- Meta information (for plugin communication)

### Relevance to OpenPress

ProseMirror's schema system maps directly to the existing `BlockType` union:
- `text` -> `paragraph` node
- `heading` -> `heading` node with `level` attr
- `image` -> `image` node with `src`, `alt`, `caption` attrs
- `code` -> `codeBlock` node with `language` attr
- `quote` -> `blockquote` node
- `list` -> `list`/`listItem` nodes with `ordered` attr

The existing `content_blocks` D1 table stores block data as JSON. With ProseMirror, the entire document can be stored as a single ProseMirror JSON doc, or individual top-level blocks can still map to D1 rows for query-ability.

---

## 3. React Block Editors Comparison

### Candidates

| Editor | Base | Block Model | DnD | Collaboration | Maturity |
|--------|------|-------------|-----|---------------|----------|
| **BlockNote** | TipTap + ProseMirror | Notion-like blocks | Built-in | Yjs (built-in) | Production |
| **Editor.js** | Vanilla JS | JSON blocks via API | No | No | Stable |
| **Plate.js** | Slate.js | Plugin-based | Plugin | No | Production |
| **Novel** | TipTap + ProseMirror | Notion-like + AI | Built-in | Yjs | Beta |
| **Tiptap directly** | ProseMirror | Custom | Via extensions | Yjs plugin | Production |

### BlockNote (Recommended for OpenPress)

**Repository:** `github.com/TypeCellOS/BlockNote`
**License:** MPL-2.0
**NPM:** `@blocknote/core`, `@blocknote/react`

BlockNote is a block-based editor built on TipTap/ProseMirror that provides a Notion-like editing experience out of the box.

**Strengths:**
- Block-level drag-and-drop built in
- Slash menu (`/` to insert blocks)
- Block type switching (paragraph <-> heading <-> bullet list)
- Nested blocks (columns, toggles)
- Real-time collaboration via Yjs (built-in)
- ProseMirror under the hood (extensible via TipTap extensions)
- React component API for custom block renderers
- Exports to HTML, Markdown, and ProseMirror JSON

**Usage:**
```tsx
import { BlockNoteEditor, PartialBlock } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/react';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/react/style.css';

function Editor({ initialContent, onChange }) {
  const editor = BlockNoteEditor.create({
    initialContent: initialContent as PartialBlock[],
  });

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => onChange(editor.document)}
    />
  );
}
```

**Custom schema blocks:**
```tsx
const editor = BlockNoteEditor.create({
  schema: {
    blockSpecs: {
      // Extend with custom blocks
      alert: {
        propSchema: { type: { default: 'warning' } },
        content: 'inline',
        render: (props) => (
          <div className={`alert alert-${props.block.props.type}`}>
            <InlineContent />
          </div>
        ),
      },
    },
  },
});
```

### Editor.js

**Repository:** `github.com/codex-team/editor.js`
**License:** MIT

Block-style editor that outputs clean JSON. Each block is an independent object with `type`, `data`.

**Strengths:**
- Clean JSON output (direct mapping to OpenPress `content_blocks`)
- Framework-agnostic (works with React wrappers)
- Plugin ecosystem (~50 tools)
- Simple API

**Weaknesses for OpenPress:**
- No built-in drag-and-drop
- No real-time collaboration
- Vanilla JS, not React-native (requires wrapper)
- Less active development
- No inline rich-text editing (blocks are modal edit)

### Plate.js

**Repository:** `github.com/udecode/plate`
**License:** MIT
**NPM:** `@udecode/plate`

Slate.js-based editor with 50+ plugins. Highly composable React editor framework.

**Strengths:**
- 50+ plugins (bold, list, table, mention, etc.)
- React-first architecture
- Headless UI components
- Very customizable

**Weaknesses for OpenPress:**
- No built-in block DnD (would need custom implementation)
- No built-in collaboration
- Slate.js has a steeper learning curve than ProseMirror
- More boilerplate for block-level editing

### Novel

**Repository:** `github.com/steven-tey/novel`
**License:** Apache-2.0

Notion-style WYSIWYG editor with AI autocomplete. Built on TipTap + ProseMirror + Vercel AI SDK.

**Strengths:**
- AI autocomplete built in (maps to OpenPress Phase 7 AI integration)
- Beautiful UI out of the box (Tailwind + Radix)
- Slash commands
- Bubble menu
- Image upload with drag-and-drop

**Weaknesses for OpenPress:**
- Opinionated UI (harder to customize)
- AI integration is tightly coupled to Vercel AI SDK
- Less mature than BlockNote for custom block types
- Not designed for extensibility (more of a drop-in component)

### Recommendation for OpenPress

**Primary: BlockNote** for the block editor experience. It provides:
1. Block-level DnD (maps to current `reorderBlocks` functionality)
2. Slash menu (replaces current `AddBlockButton` dropdown)
3. Notion-like UX (familiar to WordPress block editor users)
4. Collaboration-ready (Yjs built in)
5. ProseMirror/TipTap under the hood (extensible)
6. Custom block specs (can map to OpenPress `BlockType` union)

**Secondary: TipTap directly** for fine-grained control if BlockNote's opinionated UI is too restrictive.

---

## 4. Drag-and-Drop Page Building

### How Visual Builders Work

Visual page builders (Webflow, Wix, Builder.io) share a common architecture:

```
Component Registry -> Canvas (DnD) -> Component Tree -> Serialize -> Render
     |                    |                |
  Schema +             Sortable         JSON tree
  Defaults             Containers       (props, children)
```

**Core concepts:**
1. **Component Registry** -- Defines available components with schemas, defaults, and renderers
2. **Canvas** -- The visual editing surface with drop zones
3. **Component Tree** -- The hierarchical state (JSON) of placed components
4. **Serialization** -- Converting the tree to stored format (JSON, HTML, or JSX)
5. **Rendering** -- Converting stored format back to live output

### React Libraries Comparison

| Library | Approach | Status | Bundle | Key Feature |
|---------|----------|--------|--------|-------------|
| **@dnd-kit** | Primitives | Active | 28KB | Modular, accessible, performant |
| **@hello-pangea/dnd** | Atlassian fork | Active | 60KB | List-based DnD (drag-beautiful-dnd fork) |
| **@craftjs/core** | Page builder framework | Active | 45KB | Extensible page editor SDK |
| **GrapesJS** | Multi-purpose builder | Active | 200KB+ | Full web builder, React wrappers available |
| **react-arborist** | Tree DnD | Active | 15KB | Hierarchical tree reordering |

### @dnd-kit (Recommended for Block Reordering)

`@dnd-kit` is the modern standard for React drag-and-drop. It uses a sensor-based architecture with built-in accessibility.

**Packages:**
- `@dnd-kit/core` -- Core DnD engine
- `@dnd-kit/sortable` -- Sortable lists (for block reordering)
- `@dnd-kit/utilities` -- CSS utilities

**Architecture:**
```
DndContext (provider)
  --> Sensors (Pointer, Keyboard, Touch)
  --> Strategies (rect sorting, collision detection)
  --> SortableContext (list container)
    --> useSortable() (per item)
      --> transform, transition, listeners, attributes
```

**Usage for block editor:**
```tsx
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableBlock({ block, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div {...listeners} className="drag-handle">::</div>
      {children}
    </div>
  );
}

function BlockList({ blocks, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {blocks.map(block => (
          <SortableBlock key={block.id} block={block}>
            <BlockRenderer block={block} />
          </SortableBlock>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### @craftjs/core (Recommended for Page Builder)

Craft.js is a React framework specifically designed for building extensible drag-and-drop page editors.

**Key Concepts:**
```tsx
import { Editor, Frame, Element, useEditor } from '@craftjs/core';

// Register components with schemas
const TextComponent = ({ text, fontSize }) => <p style={{ fontSize }}>{text}</p>;
TextComponent.craft = {
  displayName: 'Text',
  props: { text: 'Hello', fontSize: '16px' },
  rules: { canDrag: () => true, canMoveIn: () => false },
  related: { settings: TextSettings }, // Sidebar settings panel
};

// Page editor
function PageEditor() {
  return (
    <Editor resolver={{ TextComponent, Container, Columns }}>
      <Frame>
        <Element is={Container} canvas>
          <TextComponent text="Hello World" />
        </Element>
      </Frame>
    </Editor>
  );
}

// Access editor state
function Toolbar() {
  const { actions, selected, isEnabled } = useEditor((state) => ({
    selected: state.events.selected,
  }));
}
```

### GrapesJS

Full-featured web builder framework with React wrappers (`grapesjs-react`).

**Strengths:**
- Complete web builder (not just a DnD library)
- Built-in component tree, style manager, layer manager
- HTML/CSS import/export
- Plugin ecosystem

**Weaknesses for OpenPress:**
- Large bundle size (200KB+)
- Not React-native (DOM manipulation conflicts with React)
- Opinionated UI
- Overkill if you only need block-level DnD

### Recommended Stack for OpenPress

**Phase 1 (Block Editor):** `@dnd-kit/sortable` for block reordering within the content editor. Replaces the current manual HTML5 drag implementation in `BlockEditor.tsx`.

**Phase 2 (Page Builder):** `@craftjs/core` for the visual page builder. Provides:
- Component registry (maps to theme system)
- Canvas with drop zones
- Component tree serialization to JSON (maps to `content_blocks` table)
- Settings sidebar for selected components
- Custom component rules (canDrag, canMoveIn, canMoveOut)

---

## 5. Cloudflare Workers Multi-Tenant Deployment

### Current OpenPress Setup

OpenPress currently uses Cloudflare Pages with:
- D1 database (`openpress-db`, ID: `4f17765f-643b-4065-8ecc-74f9da77a8e9`)
- KV namespace (ID: `4ee12a2365fc48fc98c720b05b80447f`)
- R2 bucket (`openpress-media`)
- Hono API on Pages Functions

### Multi-Tenant Architecture Options

#### Option A: Shared Database with Tenant Isolation (Simplest)

```
Platform Worker
  --> D1 (shared, tenant_id column on every table)
  --> R2 (shared, tenant_id prefix on keys)
  --> KV (shared, tenant_id prefix on keys)
```

**Pros:** Single database, simple management, $0 cost
**Cons:** Application-level isolation, no per-tenant limits

**Implementation:**
```sql
-- Add tenant_id to all tables
ALTER TABLE content_items ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
ALTER TABLE users ADD COLUMN tenant_id TEXT NOT NULL DEFAULT 'default';
-- Add index
CREATE INDEX idx_tenant_content ON content_items(tenant_id);
```

```ts
// Hono middleware extracts tenant from hostname
app.use('*', async (c, next) => {
  const hostname = new URL(c.req.url).hostname;
  const tenantId = hostname.split('.')[0]; // tenant.openpress.pages.dev
  c.set('tenantId', tenantId);
  await next();
});
```

#### Option B: Dispatch Namespaces (Workers for Platforms)

Separate Worker per tenant, each with its own resources. See Section 6 for details.

#### Option C: Durable Objects per Tenant (Most Isolated, Has Cost)

Each tenant gets a Durable Object with its own SQLite storage.

```ts
export class TenantDO {
  state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.storage.sql.exec('CREATE TABLE IF NOT EXISTS ...');
  }
}
```

**Pros:** Full isolation, per-tenant SQLite, WebSocket support
**Cons:** Cost ($0.15/million requests), requires paid plan for production

### Recommended for OpenPress

**Option A (Shared DB with tenant_id)** for the $0 budget constraint. This is the most pragmatic approach:
- Single D1 database with `tenant_id` on every table
- R2 key prefix: `{tenantId}/media/{filename}`
- KV key prefix: `{tenantId}:setting:{key}`
- Hostname-based tenant resolution via Hono middleware
- Add `tenants` table for tenant metadata

---

## 6. Cloudflare Workers for Platforms

### Overview

Workers for Platforms (formerly "Workers Unbound for Platforms") lets you deploy customer code at scale. It uses **Dispatch Namespaces** to route requests to tenant-specific Workers.

### Architecture

```
Customer Request
  --> Platform Router Worker (your code)
    --> Dispatch Namespace
      --> Tenant Worker (customer/tenant code)
        --> D1, R2, KV, AI (tenant bindings)
```

### Dispatch Namespaces

Dispatch Namespaces are a Cloudflare API feature that allows a platform Worker to forward requests to dynamically selected Workers.

**wrangler.toml for the platform router:**
```toml
name = "openpress-platform"
main = "src/router.ts"
compatibility_date = "2025-01-01"

[[dispatch_namespaces]]
binding = "TENANTS"
namespace = "openpress-tenants"
```

**Router Worker:**
```ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const tenantId = url.hostname.split('.')[0]; // tenant.openpress.dev

    // Route to tenant-specific Worker
    const tenantWorker = env.TENANTS.get(tenantId);
    if (!tenantWorker) {
      return new Response('Tenant not found', { status: 404 });
    }

    // Forward the request to the tenant Worker
    return tenantWorker.fetch(request);
  },
};
```

### Deploying Tenant Workers

Tenant Workers are uploaded programmatically via the Cloudflare API:

```ts
async function deployTenantWorker(accountId: string, apiToken: string, tenantId: string) {
  const workerScript = `
    export default {
      async fetch(request, env) {
        // Tenant-specific logic with tenant-specific bindings
        const content = await env.DB.prepare(
          'SELECT * FROM content_items WHERE tenant_id = ?'
        ).bind('${tenantId}').all();
        return Response.json(content);
      }
    };
  `;

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${tenantId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/javascript',
      },
      body: workerScript,
    },
  );

  // Attach to dispatch namespace
  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/dispatch/namespaces/openpress-tenants/scripts/${tenantId}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}` },
    },
  );
}
```

### Smart Placement

Workers for Platforms supports **Smart Placement**, which automatically runs Workers close to the backend they access. This reduces latency for D1/R2 operations.

### Tail Workers

Attach a Tail Worker to collect logs and metrics from all tenant Workers:

```toml
[tail_workers]
service = "openpress-analytics"
```

### Per-Tenant Limits

Cloudflare allows setting per-script limits:
```json
{
  "limits": {
    "cpu_ms": 50,
    "subrequest_limit": 20
  }
}
```

### Cost Implications for OpenPress

Workers for Platforms requires a Cloudflare paid plan ($5/month minimum). For the $0 budget constraint, this is not viable at launch. The shared-database approach (Section 5, Option A) is the recommended path, with Workers for Platforms as a future upgrade for enterprise customers.

---

## 7. Edge-Native CMS Patterns

### Architecture Patterns

Edge-native CMSes use a **cache-first, compute-at-edge** architecture:

```
Request
  --> KV Cache (sub-ms hit)
    --> Miss? -> Worker computes from D1 -> Store in KV -> Return
    --> Hit? -> Return cached response
```

### How Existing Edge CMSes Work

#### Sanity

- **Content Lake:** Centralized content storage with real-time updates
- **GROQ:** Custom query language for content queries
- **Edge Delivery:** Content cached at CDN edge via `@sanity/client`
- **Pattern:** Write to Content Lake, read from edge cache
- **ISR:** Stale-while-revalidate with tagged cache purging

#### Payload CMS

- **Storage:** SQLite (via better-sqlite3) or PostgreSQL
- **Edge Pattern:** Build to static, deploy to edge; or use Next.js with edge runtime
- **Admin UI:** React-based, runs client-side
- **Pattern:** Admin writes to database, reads serve from edge cache

#### Strapi v5

- **Cloud-Native:** REST + GraphQL API
- **Edge Delivery:** Via Strapi Cloud or self-hosted with CDN
- **Pattern:** API-first, front-end agnostic

### D1 + KV + R2 Patterns for OpenPress

#### Pattern 1: Cache-First Content Delivery

```ts
// pages/functions/api/content/[[slug]].ts
export const onRequestGet: PagesFunction<Env> = async (c) => {
  const slug = c.params.slug as string;
  const tenantId = c.get('tenantId') as string;
  const cacheKey = `${tenantId}:content:${slug}`;

  // Try KV cache first
  const cached = await c.env.CACHE.get(cacheKey, 'json');
  if (cached) {
    return Response.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=300' },
    });
  }

  // Cache miss: query D1
  const item = await c.env.DB.prepare(
    'SELECT * FROM content_items WHERE slug = ? AND tenant_id = ? AND status = ?'
  ).bind(slug, tenantId, 'published').first();

  if (!item) {
    return new Response('Not Found', { status: 404 });
  }

  // Store in KV with 5-minute TTL
  await c.env.CACHE.put(cacheKey, JSON.stringify(item), { expirationTtl: 300 });

  return Response.json(item, {
    headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, max-age=300' },
  });
};
```

#### Pattern 2: Tagged Cache Purging

```ts
// When content is updated, purge related caches
async function purgeContentCache(env: Env, tenantId: string, slug: string) {
  // Delete specific page cache
  await env.CACHE.delete(`${tenantId}:content:${slug}`);
  // Delete listing caches that might contain this content
  await env.CACHE.delete(`${tenantId}:content:list`);
  // Delete homepage cache
  await env.CACHE.delete(`${tenantId}:homepage`);
}
```

#### Pattern 3: R2 Media with Transform

```ts
// Upload media
async function uploadMedia(env: Env, tenantId: string, file: File) {
  const key = `${tenantId}/media/${crypto.randomUUID()}/${file.name}`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { tenantId, originalName: file.name },
  });
  return { key, url: `/api/media/${key}` };
}

// Serve media with Cloudflare Image Resizing (if on paid plan)
// Or serve directly from R2 public bucket
```

#### Pattern 4: ISR (Incremental Static Regeneration)

```ts
// On content change, regenerate and cache the full page HTML
async function regeneratePage(env: Env, tenantId: string, slug: string) {
  // Render the page server-side
  const html = await renderPageToString(tenantId, slug, env);
  // Cache the full HTML in KV
  await env.CACHE.put(`${tenantId}:page:${slug}`, html, { expirationTtl: 3600 });
}
```

#### Pattern 5: Search with D1 FTS5

```sql
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE IF NOT EXISTS content_search USING fts5(
  title, content, excerpt,
  content=content_items,
  content_rowid=rowid,
  tokenize='unicode61'
);

-- Search query
SELECT ci.*, rank
FROM content_search cs
JOIN content_items ci ON ci.id = cs.rowid
WHERE cs MATCH ?
AND ci.tenant_id = ?
AND ci.status = 'published'
ORDER BY rank
LIMIT 20;
```

### OpenPress Edge Architecture Recommendation

```
Browser (React SPA)
  |
  +--> KV Cache (static pages, CSS, JS) -- HIT: return immediately
  |
  +--> Pages Function (Hono)
        |
        +--> KV Cache (content JSON) -- HIT: return with s-maxage
        |
        +--> D1 (content, blocks, taxonomies) -- MISS: query, cache result
        |
        +--> R2 (media files) -- Direct access or Worker proxy
        |
        +--> Workers AI (content generation, embeddings)
```

---

## 8. Stripe Integration on Workers

### Overview

Stripe can be used directly from Cloudflare Workers using the Stripe API via `fetch()`. No SDK is required -- the REST API works natively.

### Stripe Checkout

For OpenPress e-commerce (Phase 6 products, cart, orders):

```ts
// functions/api/checkout/create.ts
export const onRequestPost: PagesFunction<Env> = async (c) => {
  const { items, customerEmail } = await c.req.json();
  const tenantId = c.get('tenantId') as string;

  // Build line_items from cart
  const lineItems = items.map(item => ({
    'price_data[price_data][currency]': 'usd',
    'price_data[price_data][product_data][name]': item.name,
    'price_data[price_data][unit_amount]': String(Math.round(item.price * 100)),
    quantity: String(item.quantity),
  }));

  // Create Checkout Session via Stripe API
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${c.req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', `${c.req.headers.get('origin')}/checkout/cancel`);
  params.set('customer_email', customerEmail);
  params.set('metadata[tenant_id]', tenantId);

  // Add line items
  items.forEach((item, i) => {
    params.set(`line_items[${i}][price_data][currency]`, 'usd');
    params.set(`line_items[${i}][price_data][product_data][name]`, item.name);
    params.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(item.price * 100)));
    params.set(`line_items[${i}][quantity]`, String(item.quantity));
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await response.json();
  return Response.json({ url: session.url });
};
```

### Stripe Connect (Multi-Tenant Marketplaces)

For multi-tenant SaaS where each tenant receives payments:

#### Connect Standard (Simplest)

Each tenant creates their own Stripe account and connects it.

```ts
// Generate Connect onboarding link
async function createConnectAccount(env: Env, tenantId: string) {
  // Create connected account
  const account = await fetch('https://api.stripe.com/v1/accounts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      type: 'standard',
      'metadata[tenant_id]': tenantId,
    }),
  }).then(r => r.json());

  // Create onboarding link
  const link = await fetch('https://api.stripe.com/v1/account_links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      account: account.id,
      refresh_url: 'https://openpress.dev/admin/settings/payments',
      return_url: 'https://openpress.dev/admin/settings/payments',
      type: 'account_onboarding',
    }),
  }).then(r => r.json());

  return { accountId: account.id, onboardingUrl: link.url };
}
```

#### Destination Charges (Platform + Tenant Split)

```ts
async function createDestinationCharge(
  env: Env,
  tenantStripeAccount: string,
  amount: number,
  platformFee: number, // e.g., 10% of amount
) {
  return fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency: 'usd',
      'transfer_data[destination]': tenantStripeAccount,
      'application_fee_amount': String(Math.round(platformFee * 100)),
    }),
  }).then(r => r.json());
}
```

### Webhook Verification on Workers

```ts
// functions/api/webhooks/stripe.ts
export const onRequestPost: PagesFunction<Env> = async (c) => {
  const body = await c.req.text();
  const signature = c.req.headers.get('Stripe-Signature');

  // Verify webhook signature
  const elements = signature.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
  const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(c.env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'],
  );
  const isValid = await crypto.subtle.verify(
    'HMAC', key,
    Uint8Array.from(atob(signatureHash), c => c.charCodeAt(0)),
    encoder.encode(payload),
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(c.env, event.data.object);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(c.env, event.data.object);
      break;
  }

  return new Response('OK', { status: 200 });
};
```

### Idempotency for Workers Retries

Workers can retry on failure. Use idempotency keys to prevent duplicate charges:

```ts
// Generate idempotency key from cart session
const idempotencyKey = crypto.randomUUID();

const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${secretKey}`,
    'Idempotency-Key': idempotencyKey,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: params.toString(),
});
```

### Wrangler Configuration

```toml
# wrangler.toml additions for Stripe
[vars]
STRIPE_PUBLISHABLE_KEY = "pk_live_..."

# Secrets (set via: wrangler secret put STRIPE_SECRET_KEY)
# STRIPE_SECRET_KEY
# STRIPE_WEBHOOK_SECRET
```

```bash
# Set secrets
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

### OpenPress Integration Plan

1. **Phase A (Single Tenant):** Stripe Checkout for the existing e-commerce module
   - Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as Workers secrets
   - Create `/api/checkout/create` endpoint
   - Create `/api/webhooks/stripe` endpoint
   - Update `orders` table with `stripe_session_id` column

2. **Phase B (Multi-Tenant):** Stripe Connect for platform marketplace
   - Each tenant connects their Stripe account
   - Destination charges with platform fee
   - Webhook routing by `account` field

---

## 9. Recommendations for OpenPress

### Editor Upgrade Path

**Current State:** Raw `<textarea>` elements per block in `BlockEditor.tsx` (794 lines).
**Recommended Path:**

1. **Immediate (Phase 3.5):** Replace the block editor with BlockNote
   - `pnpm add @blocknote/core @blocknote/react`
   - BlockNote handles DnD, slash menu, block type switching, inline rich text
   - Custom block specs map to the existing `BlockType` union
   - Serialization: `editor.document` -> store as JSON in `content_blocks.data`
   - Estimated effort: Replace ~794 lines with ~150 lines

2. **Near-Term:** Add TipTap extensions for WordPress-specific features
   - Table extension for data tables
   - Mention extension for @-references
   - Code block with syntax highlighting
   - Image upload integration with R2 media API

3. **Future:** Real-time collaboration via Yjs
   - Add `@tiptap/extension-collaboration`
   - WebSocket server via Durable Objects (requires paid plan)
   - Or use Cloudflare Pub/Sub (when available on free tier)

### Page Builder Upgrade Path

**Current State:** No visual page builder. Content editor only.
**Recommended Path:**

1. **Phase 4.5:** Block-level DnD via `@dnd-kit/sortable`
   - `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
   - Replace manual HTML5 drag in `BlockEditor.tsx`
   - Keyboard sorting, touch support, accessibility built in

2. **Phase 10:** Visual page builder via `@craftjs/core`
   - Component registry mapping to theme system
   - Canvas-based layout editing
   - Sidebar for component settings
   - Serialize to `content_blocks` table

### Multi-Tenancy Path

**Recommended:** Shared database with `tenant_id` (Section 5, Option A)
- Add `tenants` table and `tenant_id` column to all tables
- R2 key namespacing: `{tenantId}/media/{file}`
- KV key namespacing: `{tenantId}:cache:{key}`
- Hostname-based routing in Hono middleware
- Workers for Platforms (Option B) as a future paid-tier upgrade

### Stripe Integration Path

**Recommended:** Start with Stripe Checkout for single-tenant e-commerce
- Add Stripe secrets to Workers environment
- Create checkout session endpoint
- Create webhook handler with HMAC verification
- Update `orders` table with Stripe session/payment IDs
- Stripe Connect for multi-tenant marketplace as a future phase

### Edge Optimization Path

1. Add FTS5 search for content
2. Implement KV cache for published content (stale-while-revalidate)
3. Add cache purging on content update
4. Consider full-page HTML caching in KV for ISR
