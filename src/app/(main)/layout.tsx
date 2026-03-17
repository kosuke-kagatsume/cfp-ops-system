"use client";

import { Sidebar } from "@/components/sidebar";
import { SWRConfig } from "swr";
import { fetcher, swrConfig } from "@/lib/swr";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRConfig value={{ ...swrConfig, fetcher }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64">{children}</main>
      </div>
    </SWRConfig>
  );
}
