import { create } from "zustand";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "author" | "contributor" | "subscriber" | "viewer";
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
  setUser: (user: User) => void;
}

function saveAuth(data: { user: User; access_token: string; csrf_token?: string }) {
  localStorage.setItem("auth_token", data.access_token);
  localStorage.setItem("auth_user", JSON.stringify(data.user));
  if (data.csrf_token) localStorage.setItem("csrf_token", data.csrf_token);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem("auth_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem("auth_token"),
  isAuthenticated: !!localStorage.getItem("auth_token"),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // api.post() returns parsed JSON: { data: { user, access_token, ... } }
      const res = await api.post<{ data: { user: User; access_token: string; expires_in: number; csrf_token: string } }>("/api/auth/login", { email, password });

      saveAuth(res.data);
      set({
        user: res.data.user,
        token: res.data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email: string, password: string, name?: string) => {
    set({ isLoading: true });
    try {
      const res = await api.post<{ data: { user: User; access_token: string; expires_in: number; csrf_token?: string } }>("/api/auth/register", { email, password, name });

      saveAuth(res.data);
      set({
        user: res.data.user,
        token: res.data.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("csrf_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ user });
  },

  checkAuth: () => {
    const token = localStorage.getItem("auth_token");
    let user: User | null = null;
    try {
      const stored = localStorage.getItem("auth_user");
      user = stored ? JSON.parse(stored) : null;
    } catch {
      user = null;
    }
    set({ token, user, isAuthenticated: !!token });
  },
}));
