import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-tertiary">
          <span className="text-3xl font-bold text-text-tertiary">404</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">ページが見つかりません</h1>
          <p className="text-sm text-text-secondary mt-2">
            お探しのページは存在しないか、移動した可能性があります。
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            ダッシュボードへ
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 border border-border text-text-secondary rounded-lg font-medium hover:bg-surface-tertiary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            トップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
