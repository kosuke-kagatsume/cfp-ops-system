export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600">
          <span className="text-2xl font-bold text-text-inverse">C</span>
        </div>
        <h1 className="text-3xl font-bold text-text">CFP System</h1>
        <p className="text-text-secondary">統合基幹システム</p>
        <div className="flex gap-3 justify-center">
          <a
            href="/dashboard"
            className="px-6 py-2.5 bg-primary-600 text-text-inverse rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            ダッシュボード
          </a>
          <a
            href="/login"
            className="px-6 py-2.5 border border-border text-text-secondary rounded-lg font-medium hover:bg-surface-tertiary transition-colors"
          >
            ログイン
          </a>
        </div>
      </div>
    </div>
  );
}
