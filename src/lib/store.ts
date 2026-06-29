import { create } from "zustand";

interface NotificationItem {
  id: string;
  type: "SMS" | "WHATSAPP";
  content: string;
  createdAt: string;
  sentAt?: string;
  status: "PENDING" | "SENT" | "FAILED";
}

interface AppState {
  theme: "light" | "dark";
  sidebarOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
    setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  addNotification: (notification: NotificationItem) => void;
  clearUnread: () => void;
}

export const useStore = create<AppState>((set) => ({
  theme: "dark", // default to modern dark mode
  sidebarOpen: true,
  notifications: [],
  unreadCount: 0,
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        localStorage.setItem("mitti-theme", newTheme);
      }
      return { theme: newTheme };
    }),
  setTheme: (theme) =>
    set(() => {
      if (typeof window !== "undefined") {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        localStorage.setItem("mitti-theme", theme);
      }
      return { theme };
    }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set(() => ({ sidebarOpen: open })),
  setNotifications: (notifications) =>
    set(() => {
      const unread = notifications.filter((n) => n.status === "PENDING").length;
      return { notifications, unreadCount: unread };
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  clearUnread: () => set(() => ({ unreadCount: 0 })),
}));
