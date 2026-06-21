import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isRestored: false,

  setSession: (accessToken, user) => set({
    accessToken,
    user,
    isAuthenticated: true,
    isLoading: false,
    isRestored: true,
  }),

  logout: () => {
    // Invalidate state
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isRestored: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setRestored: (isRestored) => set({ isRestored }),
}));
