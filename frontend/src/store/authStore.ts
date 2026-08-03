import { create } from "zustand";
import { api } from "../api/client";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  signup: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/api/auth/signup", { email, password, name });
      set({ user: res.data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/api/auth/login", { email, password });
      set({ user: res.data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await api.post("/api/auth/logout");
    set({ user: null });
  },

  // No "GET /me" endpoint exists yet in the backend — see note below.
  checkAuth: async () => {
    set({ isInitialized: true });
  },
}));