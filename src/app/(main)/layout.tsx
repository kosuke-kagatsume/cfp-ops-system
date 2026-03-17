"use client";

import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-context";
import { SWRConfig } from "swr";
import { fetcher, swrConfig } from "@/lib/swr";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig value={{ ...swrConfig, fetcher }}>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-0 md:ml-64">{children}</main>
        </div>
      </SidebarProvider>
    </SWRConfig>
  );
}
