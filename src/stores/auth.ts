import { create } from "zustand";
import { api } from "../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
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
      const res = await api.post<{ data: { user: User; access_token: string; expires_in: number } }>("/api/auth/login", { email, password });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error?.message || "Login failed");
      }

      localStorage.setItem("auth_token", body.data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(body.data.user));

      set({
        user: body.data.user,
        token: body.data.access_token,
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
      const res = await api.post<{ data: { user: User; access_token: string; expires_in: number } }>("/api/auth/register", { email, password, name });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.error?.message || "Registration failed");
      }

      localStorage.setItem("auth_token", body.data.access_token);
      localStorage.setItem("auth_user", JSON.stringify(body.data.user));

      set({
        user: body.data.user,
        token: body.data.access_token,
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
    set({ user: null, token: null, isAuthenticated: false });
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
