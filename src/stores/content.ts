import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  ContentItem,
  ContentBlock,
  ContentStatus,
  BlockType,
  ApiResponse,
} from "@shared/types";

interface ContentListParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}

interface ContentDetail {
  item: ContentItem;
  blocks: ContentBlock[];
  terms: unknown[];
  meta: Record<string, string>;
}

function parseBlockRaw(raw: Record<string, unknown>): ContentBlock {
  let data: Record<string, unknown> = {};
  if (typeof raw.data === "string") {
    try {
      data = JSON.parse(raw.data as string);
    } catch {
      data = {};
    }
  } else if (typeof raw.data === "object" && raw.data !== null) {
    data = raw.data as Record<string, unknown>;
  }
  return {
    id: raw.id as string,
    content_id: raw.content_id as string,
    block_type: raw.block_type as BlockType,
    data,
    sort_order: raw.sort_order as number,
    parent_block_id: raw.parent_block_id as string | undefined,
    created_at: raw.created_at as string,
    updated_at: raw.updated_at as string,
  };
}

function defaultBlockData(blockType: BlockType): Record<string, unknown> {
  switch (blockType) {
    case "text":
      return { text: "" };
    case "heading":
      return { text: "", level: 2 };
    case "image":
      return { url: "", alt: "", caption: "" };
    case "code":
      return { code: "", language: "plaintext" };
    case "quote":
      return { text: "", source: "" };
    case "list":
      return { items: [] as string[], ordered: false };
    case "divider":
      return {};
    case "embed":
      return { url: "", provider: "" };
    case "video":
      return { url: "", poster: "" };
    case "audio":
      return { url: "" };
    case "gallery":
      return { images: [] };
    case "component":
      return { componentId: "", props: {} };
    case "custom":
      return { html: "" };
    default:
      return {};
  }
}

interface ContentState {
  items: ContentItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  isLoadingList: boolean;
  listError: string | null;
  listFilter: ContentStatus | "all";

  currentContent: ContentDetail | null;
  isLoadingDetail: boolean;
  detailError: string | null;
  isSaving: boolean;
  saveError: string | null;

  fetchItems: (params?: ContentListParams) => Promise<void>;
  setFilter: (filter: ContentStatus | "all") => void;
  deleteItem: (slug: string) => Promise<void>;
  updateStatus: (slug: string, status: ContentStatus) => Promise<void>;

  fetchContent: (slug: string) => Promise<void>;
  createContent: (data: {
    title: string;
    type?: string;
    status?: ContentStatus;
    blocks?: { block_type: BlockType; data: Record<string, unknown> }[];
    meta?: Record<string, string>;
    featured_image_url?: string;
    term_ids?: string[];
  }) => Promise<ContentItem>;
  saveContent: (
    slug: string,
    data: {
      title?: string;
      excerpt?: string;
      status?: ContentStatus;
      featured_image_url?: string;
      blocks?: { block_type: BlockType; data: Record<string, unknown> }[];
      meta?: Record<string, string>;
      term_ids?: string[];
    },
  ) => Promise<void>;
  clearCurrent: () => void;

  addBlock: (blockType: BlockType, position?: number) => void;
  updateBlockData: (blockId: string, data: Record<string, unknown>) => void;
  updateBlockType: (blockId: string, newType: BlockType) => void;
  removeBlock: (blockId: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoadingList: false,
  listError: null,
  listFilter: "all",

  currentContent: null,
  isLoadingDetail: false,
  detailError: null,
  isSaving: false,
  saveError: null,

  // List actions
  fetchItems: async (params) => {
    set({ isLoadingList: true, listError: null });
    try {
      const filter = get().listFilter;
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set("page", String(params.page));
      if (params?.limit) queryParams.set("limit", String(params.limit));
      if (params?.type) queryParams.set("type", params.type);
      if (params?.search) queryParams.set("search", params.search);
      if (filter !== "all") queryParams.set("status", filter);

      const qs = queryParams.toString();
      const path = `/content${qs ? `?${qs}` : ""}`;
      const res = await api.get<
        ApiResponse<{
          results: ContentItem[];
        }> & {
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }
      >(path);
      set({
        items: res.data.results || [],
        pagination: res.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
        isLoadingList: false,
      });
    } catch (e) {
      set({
        listError: e instanceof Error ? e.message : "Failed to load content",
        isLoadingList: false,
      });
    }
  },

  setFilter: (filter) => {
    set({ listFilter: filter });
    get().fetchItems({ page: 1 });
  },

  deleteItem: async (slug) => {
    try {
      await api.delete(`/content/${slug}`);
      const items = get().items.filter((i) => i.slug !== slug);
      set({ items });
    } catch (e) {
      set({
        listError: e instanceof Error ? e.message : "Failed to delete",
      });
    }
  },

  updateStatus: async (slug, status) => {
    try {
      await api.put(`/content/${slug}`, { status });
      const items = get().items.map((i) =>
        i.slug === slug ? { ...i, status } : i,
      );
      set({ items });
    } catch (e) {
      set({
        listError: e instanceof Error ? e.message : "Failed to update status",
      });
    }
  },

  // Detail actions
  fetchContent: async (slug) => {
    set({ isLoadingDetail: true, detailError: null });
    try {
      const res = await api.get<
        ApiResponse<{
          id: string;
          type: string;
          slug: string;
          title: string;
          content: string | null;
          excerpt: string | null;
          status: ContentStatus;
          author_id: string | null;
          featured_image_url: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          blocks: Record<string, unknown>[];
          terms: unknown[];
          meta: Record<string, string>;
        }>
      >(`/content/${slug}`);
      const d = res.data;
      const item: ContentItem = {
        id: d.id,
        type: d.type as ContentItem["type"],
        slug: d.slug,
        title: d.title,
        content: d.content ?? undefined,
        excerpt: d.excerpt ?? undefined,
        status: d.status,
        author_id: d.author_id ?? undefined,
        featured_image_url: d.featured_image_url ?? undefined,
        published_at: d.published_at ?? undefined,
        created_at: d.created_at,
        updated_at: d.updated_at,
      };
      const blocks = (d.blocks || []).map(parseBlockRaw);
      set({ currentContent: { item, blocks, terms: d.terms || [], meta: d.meta || {} }, isLoadingDetail: false });
    } catch (e) {
      set({
        detailError: e instanceof Error ? e.message : "Failed to fetch",
        isLoadingDetail: false,
      });
    }
  },

  createContent: async (data) => {
    set({ isSaving: true, saveError: null });
    try {
      const res = await api.post<ApiResponse<ContentItem>>("/content", data);
      set({ isSaving: false });
      return res.data;
    } catch (e) {
      set({
        saveError: e instanceof Error ? e.message : "Failed to create",
        isSaving: false,
      });
      throw e;
    }
  },

  saveContent: async (slug, data) => {
    set({ isSaving: true, saveError: null });
    try {
      await api.put(`/content/${slug}`, data);
      set({ isSaving: false });
    } catch (e) {
      set({
        saveError: e instanceof Error ? e.message : "Failed to save",
        isSaving: false,
      });
      throw e;
    }
  },

  clearCurrent: () => set({ currentContent: null, detailError: null, saveError: null }),

  // Block actions (local, unsaved)
  addBlock: (blockType, position) => {
    const current = get().currentContent;
    if (!current) return;

    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      content_id: current.item.id,
      block_type: blockType,
      data: defaultBlockData(blockType),
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const blocks = [...current.blocks];
    const insertAt = position !== undefined ? position : blocks.length;
    blocks.splice(insertAt, 0, newBlock);
    blocks.forEach((b, i) => {
      b.sort_order = i;
    });

    set({ currentContent: { ...current, blocks } });
  },

  updateBlockData: (blockId, data) => {
    const current = get().currentContent;
    if (!current) return;

    const blocks = current.blocks.map((b) =>
      b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b,
    );
    set({ currentContent: { ...current, blocks } });
  },

  updateBlockType: (blockId, newType) => {
    const current = get().currentContent;
    if (!current) return;

    const blocks = current.blocks.map((b) =>
      b.id === blockId
        ? { ...b, block_type: newType, data: defaultBlockData(newType) }
        : b,
    );
    set({ currentContent: { ...current, blocks } });
  },

  removeBlock: (blockId) => {
    const current = get().currentContent;
    if (!current) return;

    const blocks = current.blocks
      .filter((b) => b.id !== blockId)
      .map((b, i) => ({ ...b, sort_order: i }));
    set({ currentContent: { ...current, blocks } });
  },

  reorderBlocks: (fromIndex, toIndex) => {
    const current = get().currentContent;
    if (!current) return;

    const blocks = [...current.blocks];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    blocks.forEach((b, i) => {
      b.sort_order = i;
    });
    set({ currentContent: { ...current, blocks } });
  },
}));
