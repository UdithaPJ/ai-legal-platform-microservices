"use client";

import { create } from "zustand";
import type { UserRole } from "@/types/user";

interface AuthState {
  keycloakId: string | null;
  userServiceId: string | null;
  role: UserRole | null;
  setKeycloakId: (id: string) => void;
  setUserServiceId: (id: string) => void;
  setRole: (role: UserRole) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  keycloakId: null,
  userServiceId: null,
  role: null,
  setKeycloakId: (id) => set({ keycloakId: id }),
  setUserServiceId: (id) => set({ userServiceId: id }),
  setRole: (role) => set({ role }),
  reset: () => set({ keycloakId: null, userServiceId: null, role: null }),
}));
