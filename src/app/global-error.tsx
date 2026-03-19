"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>エラーが発生しました</h2>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>問題が発生しました。再試行してください。</p>
          <button onClick={reset} style={{ padding: "0.5rem 1.5rem", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
