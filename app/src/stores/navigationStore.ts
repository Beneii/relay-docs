import { create } from "zustand";

interface NavigationState {
  /** App ID to navigate to after next render cycle (from push notification) */
  pendingAppId: string | null;
  pendingPath: string | null;
  setPendingAppId: (id: string | null) => void;
  setPendingPath: (path: string | null) => void;
  clearPendingPath: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingAppId: null,
  pendingPath: null,
  setPendingAppId: (id) => set({ pendingAppId: id }),
  setPendingPath: (path) => set({ pendingPath: path }),
  clearPendingPath: () => set({ pendingPath: null }),
}));
