import { create } from "zustand";

interface NavigationState {
  /** App ID to navigate to after next render cycle (from push notification) */
  pendingAppId: string | null;
  setPendingAppId: (id: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingAppId: null,
  setPendingAppId: (id) => set({ pendingAppId: id }),
}));
