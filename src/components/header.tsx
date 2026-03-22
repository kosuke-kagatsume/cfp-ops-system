"use client";

import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "./sidebar-context";
import { NotificationBell, NotificationPanel } from "./notification-panel";

export function Header({ title, badge }: { title: string; badge?: React.ReactNode }) {
  const { toggle } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="p-2 hover:bg-surface-tertiary rounded-lg transition-colors md:hidden"
        >
          <Menu className="w-5 h-5 text-text-secondary" />
        </button>
        <h1 className="text-lg font-bold text-text">{title}</h1>
        {badge}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="検索..."
            className="pl-10 pr-4 py-2 w-64 text-sm border border-border rounded-lg bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            <NotificationBell />
          </button>
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
