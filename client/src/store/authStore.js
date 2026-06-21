import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setSession: (accessToken, user) => set({
    accessToken,
    user,
    isAuthenticated: true,
    isLoading: false,
  }),

  logout: () => {
    // Invalidate state
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
