"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { ImageUpload } from "@/components/ImageUpload";
import {
  LayoutDashboard,
  Users,
  Cpu,
  Truck,
  DollarSign,
  Settings,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { sidebarOpen, toggleSidebar, notifications, unreadCount, setNotifications, clearUnread } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch recent notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [setNotifications]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OPERATOR", "ACCOUNTANT"] },
    { name: "Customers", href: "/dashboard/customers", icon: Users, roles: ["ADMIN", "OPERATOR", "ACCOUNTANT"] },
    { name: "JCB Entries", href: "/dashboard/jcb", icon: Cpu, roles: ["ADMIN", "OPERATOR"] },
    { name: "Tractor Entries", href: "/dashboard/tractor", icon: Truck, roles: ["ADMIN", "OPERATOR"] },
    { name: "Payments", href: "/dashboard/payments", icon: DollarSign, roles: ["ADMIN", "ACCOUNTANT", "OPERATOR"] },
    { name: "Admin Panel", href: "/dashboard/admin", icon: Settings, roles: ["ADMIN"] },
  ];

  const userRole = session?.user?.role || "OPERATOR";
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      clearUnread();
      // mark as read on api
      fetch("/api/notifications/read", { method: "POST" });
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-900/50 bg-zinc-950/95 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0 md:w-16"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-900/50">
          {sidebarOpen ? (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 via-violet-300 to-amber-400 bg-clip-text text-transparent">
                Anand JCB & Tractor
              </span>
            </Link>
          ) : (
            <span className="text-sm font-bold text-violet-400 mx-auto">ML</span>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${!sidebarOpen && "rotate-180"}`} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600/20 to-transparent text-violet-400 border-l-2 border-violet-500 shadow-[inset_4px_0_0_0_rgba(139,92,246,1)]"
                    : "text-zinc-400 hover:bg-zinc-800/40 hover:text-white border-l-2 border-transparent"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-900/50 p-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className={`flex flex-1 flex-col transition-all duration-300 w-full ${sidebarOpen ? "md:pl-64" : "md:pl-16"}`}>
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-900/50 glass-panel px-4 md:px-6 sticky top-0 z-10 w-full">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-white capitalize truncate">
              {pathname.split("/").pop() === "dashboard" ? "Overview" : pathname.split("/").pop()?.replace(/-/g, " ")}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border border-zinc-900/50 bg-zinc-900/30 p-2.5 text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-all duration-200"
            >
              {!mounted ? <div className="h-4 w-4" /> : theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative rounded-lg border border-zinc-900/50 bg-zinc-900/30 p-2.5 text-zinc-400 hover:bg-zinc-800/50 hover:text-white transition-all duration-200"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-0 right-0 -mr-1 -mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 to-amber-500 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(139,92,246,0.6)]">
                      {unreadCount}
                    </span>
                    <span className="absolute top-0 right-0 -mr-1 -mt-1 h-4 w-4 rounded-full bg-violet-500 opacity-75 animate-ping"></span>
                  </>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl z-30">
                  <div className="mb-3 flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Outbound Alerts</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-xs text-zinc-500 hover:text-white">
                      Close
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs text-zinc-600 py-4">No recent dispatches.</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded bg-violet-950/60 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">
                              {n.type}
                            </span>
                            <span className="text-[9px] text-zinc-600">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">{n.content}</p>
                          <span className={`mt-1 inline-block text-[9px] font-semibold ${
                            n.status === "SENT" ? "text-emerald-500" : n.status === "FAILED" ? "text-red-500" : "text-amber-500"
                          }`}>
                            {n.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 rounded-full border border-zinc-900/50 bg-zinc-900/30 px-2 md:px-3 py-1.5 md:py-2 text-sm hover:bg-zinc-800/50 transition-all duration-200"
              >
                {session?.user?.profilePic ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={session.user.profilePic} alt="Profile" className="h-7 w-7 rounded-full object-cover shadow-[0_0_8px_rgba(139,92,246,0.5)] border border-violet-500/50" />
                  </>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-violet-600 to-amber-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shadow-[0_0_8px_rgba(139,92,246,0.5)]">
                    {session?.user?.name?.substring(0, 2) || "U"}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-zinc-300">{session?.user?.name}</span>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-xl z-30">
                  <div className="flex flex-col items-center justify-center p-4 border-b border-zinc-900">
                    <ImageUpload 
                      entityType="USER"
                      entityId={session?.user?.id}
                      currentImage={session?.user?.profilePic}
                      className="mb-3"
                    />
                    <p className="text-sm font-bold text-white">{session?.user?.name}</p>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mt-1">{session?.user?.role}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-all mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Inner Page View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-transparent w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
