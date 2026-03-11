"use client";

import { useToast } from "@/components/toast";
import { Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const handleLogin = () => {
    showToast("Microsoft SSOでログインしました（モック）", "success");
    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
              <span className="text-xl font-bold text-text-inverse">C</span>
            </div>
            <h1 className="text-xl font-bold text-text">CFP System</h1>
            <p className="text-sm text-text-secondary mt-1">統合基幹システム</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#2F2F2F] text-white rounded-lg font-medium hover:bg-[#1a1a1a] transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Microsoft アカウントでサインイン
          </button>

          <div className="mt-6 flex items-start gap-2 p-3 bg-surface-tertiary rounded-lg">
            <Shield className="w-4 h-4 text-text-tertiary mt-0.5 shrink-0" />
            <p className="text-xs text-text-tertiary">
              Microsoft 365のアカウントでログインします。
              アクセスは許可されたIPアドレスからのみ可能です。
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-text-tertiary mt-6">
          &copy; 2026 CFP Corporation. All rights reserved.
        </p>
      </div>
    </div>
  );
}
