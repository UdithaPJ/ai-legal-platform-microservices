"use client";

import { create } from "zustand";
import type { UserRole } from "@/types/user";

interface AuthState {
  keycloakId:        string | null;
  userServiceId:     string | null;
  role:              UserRole | null;
  /** BFF-ready URL, e.g. /api/uploads/profile-pictures/abc.jpg  (null = not loaded yet) */
  profilePictureUrl: string | null;
  setKeycloakId:        (id: string)         => void;
  setUserServiceId:     (id: string)         => void;
  setRole:              (role: UserRole)      => void;
  setProfilePictureUrl: (url: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  keycloakId:        null,
  userServiceId:     null,
  role:              null,
  profilePictureUrl: null,

  setKeycloakId:        (id)   => set({ keycloakId: id }),
  setUserServiceId:     (id)   => set({ userServiceId: id }),
  setRole:              (role) => set({ role }),
  setProfilePictureUrl: (url)  => set({ profilePictureUrl: url }),
  reset: () => set({ keycloakId: null, userServiceId: null, role: null, profilePictureUrl: null }),
}));
