import { create } from "zustand";
import { api } from "../lib/api";

export interface CartItem {
  id?: string;
  product_id: string;
  title?: string;
  price?: number;
  quantity: number;
  sku?: string;
  featured_image_url?: string;
  configuration?: Record<string, string[]>;
}

interface CartState {
  items: CartItem[];
  sessionId: string;
  initialized: boolean;
  init: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  itemCount: () => number;
  subtotal: () => number;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("cart_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("cart_session_id", id);
  }
  return id;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  sessionId: getSessionId(),
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    try {
      const res = await api.get<{ data: CartItem[] }>("/cart");
      if (res && Array.isArray(res.data)) {
        set({ items: res.data, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  addItem: async (item) => {
    const { items } = get();
    const previousItems = [...items];
    const existing = items.find((i) => i.product_id === item.product_id);

    if (existing) {
      const newQty = existing.quantity + item.quantity;
      set({
        items: items.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: newQty } : i,
        ),
      });
    } else {
      set({ items: [...items, item] });
    }

    // Sync to API — revert on failure
    try {
      await api.post("/cart/add", {
        product_id: item.product_id,
        quantity: item.quantity,
        configuration: item.configuration || undefined,
      });
    } catch {
      set({ items: previousItems });
    }
  },

  removeItem: async (productId) => {
    const { items } = get();
    const previousItems = [...items];
    set({ items: items.filter((i) => i.product_id !== productId) });
    // Sync to API — revert on failure
    if (previousItems.find((i) => i.product_id === productId)?.id) {
      try {
        await api.delete(`/cart/${previousItems.find((i) => i.product_id === productId)!.id}`);
      } catch {
        set({ items: previousItems });
      }
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(productId);
      return;
    }
    const { items } = get();
    const previousItems = [...items];
    set({
      items: items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i,
      ),
    });
    // Sync to API — revert on failure
    if (previousItems.find((i) => i.product_id === productId)?.id) {
      try {
        await api.put(`/cart/${previousItems.find((i) => i.product_id === productId)!.id}`, { quantity });
      } catch {
        set({ items: previousItems });
      }
    }
  },

  clear: async () => {
    set({ items: [] });
    try {
      await api.post("/cart/clear", {});
    } catch {
      // Ignore
    }
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
}));
