import { create } from "zustand";
import { api } from "../api/client";
import type { ActivityLogEntry } from "../types";

interface ActivityState {
  entries: ActivityLogEntry[];
  fetchActivity: (boardId: string) => Promise<void>;
  prependEntry: (entry: ActivityLogEntry) => void;
  clear: () => void;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  entries: [],

  fetchActivity: async (boardId) => {
    const res = await api.get(`/api/boards/${boardId}/activity`);
    set({ entries: res.data.activity });
  },

  prependEntry: (entry) => {
    set({ entries: [entry, ...get().entries].slice(0, 30) });
  },

  clear: () => set({ entries: [] }),
}));