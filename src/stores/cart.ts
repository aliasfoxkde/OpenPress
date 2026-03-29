import { create } from "zustand";
import { api } from "../lib/api";

export interface CartItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  sku?: string;
  featured_image_url?: string;
}

interface CartState {
  items: CartItem[];
  sessionId: string;
  initialized: boolean;
  init: () => Promise<void>;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
      const res = await api.get<{ data: CartItem[] }>(`/cart?session_id=${get().sessionId}`);
      if (res && Array.isArray(res.data)) {
        set({ items: res.data, initialized: true });
      }
    } catch {
      // Cart may not exist yet — that's fine
      set({ initialized: true });
    }
  },

  addItem: (item) => {
    const { items } = get();
    const existing = items.find((i) => i.product_id === item.product_id);
    if (existing) {
      set({
        items: items.map((i) =>
          i.product_id === item.product_id ? { ...i, quantity: i.quantity + item.quantity } : i,
        ),
      });
    } else {
      set({ items: [...items, item] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
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

  subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
