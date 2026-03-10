import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CFP System",
  description: "CFP 統合基幹システム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
