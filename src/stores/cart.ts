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
}

interface CartState {
  items: CartItem[];
  sessionId: string;
  initialized: boolean;
  init: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clear: () => void;
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

    // Sync to API
    try {
      await api.post("/cart/add", {
        product_id: item.product_id,
        quantity: item.quantity,
      });
    } catch {
      // API sync failed — local state is still valid
    }
  },

  removeItem: async (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
    // Sync to API
    const item = get().items.find((i) => i.product_id === productId);
    if (item?.id) {
      try {
        await api.delete(`/cart/${item.id}`);
      } catch {
        // Ignore
      }
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      await get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.product_id === productId ? { ...i, quantity } : i,
      ),
    });
  },

  clear: () => {
    set({ items: [] });
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  subtotal: () =>
    get().items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0),
}));
