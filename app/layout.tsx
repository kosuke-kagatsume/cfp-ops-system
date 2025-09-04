import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CFP Ops & Traceability",
  description: "岡山ケミカルセンター運用管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto py-6">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
