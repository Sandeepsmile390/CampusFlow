import { create } from 'zustand';
import axiosInstance from '../utils/axios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  panelOpen: false,

  // ── Fetch all notifications for the current user ──────────────────────────
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get('/notifications');
      set({
        notifications: res.data.data,
        unreadCount: res.data.unreadCount,
        isLoading: false
      });
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Mark a single notification as read ───────────────────────────────────
  markAsRead: async (id) => {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark notification read:', err.message);
    }
  },

  // ── Mark ALL notifications as read ───────────────────────────────────────
  markAllRead: async () => {
    try {
      await axiosInstance.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all read:', err.message);
    }
  },

  // ── Delete a single notification ─────────────────────────────────────────
  deleteNotification: async (id) => {
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      set((state) => {
        const deleted = state.notifications.find((n) => n.id === id);
        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          unreadCount: deleted && !deleted.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        };
      });
    } catch (err) {
      console.error('Failed to delete notification:', err.message);
    }
  },

  // ── Toggle the notification panel open/close ──────────────────────────────
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),

  // ── Add an optimistic local notification (e.g. from polling) ─────────────
  addLocal: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }))
}));
