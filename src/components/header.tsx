"use client";

import { Bell, Search } from "lucide-react";

export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6">
      <h1 className="text-lg font-bold text-text">{title}</h1>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="検索..."
            className="pl-10 pr-4 py-2 w-64 text-sm border border-border rounded-lg bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <button className="relative p-2 text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
      </div>
    </header>
  );
}
