import { create } from "zustand";

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
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("auth_token"),
  isAuthenticated: !!localStorage.getItem("auth_token"),
  isLoading: false,

  login: async (email: string, _password: string) => {
    set({ isLoading: true });
    try {
      // Will be implemented when auth API is ready
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
        role: "admin",
      };
      const mockToken = "mock_token";

      localStorage.setItem("auth_token", mockToken);
      set({
        user: mockUser,
        token: mockToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
      throw new Error("Login failed");
    }
  },

  logout: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const token = localStorage.getItem("auth_token");
    set({ token, isAuthenticated: !!token });
  },
}));
