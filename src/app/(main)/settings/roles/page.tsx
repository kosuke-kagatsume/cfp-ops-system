import { Header } from "@/components/header";
import { CheckCircle, XCircle } from "lucide-react";

const roles = [
  { name: "管理者 (admin)", description: "全操作権限。マスタ管理、ユーザー管理、システム設定", users: 2 },
  { name: "営業 (sales)", description: "受注入力、出荷指示、顧客情報閲覧、見積作成", users: 12 },
  { name: "経理 (accounting)", description: "売上確定、請求書発行、入金消込、月次締め、支払承認", users: 5 },
  { name: "工場 (factory)", description: "入荷登録、計量入力、加工記録、出荷確認、在庫確認", users: 28 },
  { name: "管理 (manager)", description: "承認操作、ダッシュボード閲覧、レポート出力", users: 8 },
  { name: "閲覧 (readonly)", description: "参照のみ", users: 3 },
];

const resources = ["マスタ", "在庫", "仕入", "売上", "請求", "入金", "加工", "出荷", "帳票", "ユーザー", "監査ログ", "システム設定"];
const actions = ["参照", "登録", "編集", "削除", "承認"];

const permissionMatrix: Record<string, Record<string, string[]>> = {
  "管理者 (admin)": Object.fromEntries(resources.map((r) => [r, actions])),
  "営業 (sales)": {
    "マスタ": ["参照"], "在庫": ["参照"], "仕入": ["参照", "登録"], "売上": ["参照", "登録", "編集"],
    "請求": ["参照"], "入金": ["参照"], "加工": ["参照"], "出荷": ["参照", "登録", "編集"],
    "帳票": ["参照"], "ユーザー": [], "監査ログ": [], "システム設定": [],
  },
  "経理 (accounting)": {
    "マスタ": ["参照"], "在庫": ["参照"], "仕入": ["参照", "登録", "編集"],
    "売上": ["参照", "登録", "編集", "承認"], "請求": ["参照", "登録", "編集"],
    "入金": ["参照", "登録", "編集"], "加工": ["参照"], "出荷": ["参照"],
    "帳票": ["参照", "登録"], "ユーザー": [], "監査ログ": ["参照"], "システム設定": [],
  },
  "工場 (factory)": {
    "マスタ": ["参照"], "在庫": ["参照", "登録", "編集"], "仕入": ["参照", "登録"],
    "売上": [], "請求": [], "入金": [], "加工": ["参照", "登録", "編集"],
    "出荷": ["参照", "登録", "編集"], "帳票": ["参照"], "ユーザー": [], "監査ログ": [], "システム設定": [],
  },
  "管理 (manager)": {
    "マスタ": ["参照"], "在庫": ["参照"], "仕入": ["参照", "承認"],
    "売上": ["参照", "承認"], "請求": ["参照", "承認"], "入金": ["参照", "承認"],
    "加工": ["参照"], "出荷": ["参照", "承認"], "帳票": ["参照"], "ユーザー": ["参照"],
    "監査ログ": ["参照"], "システム設定": [],
  },
  "閲覧 (readonly)": Object.fromEntries(resources.map((r) => [r, ["参照"]])),
};

export default function RolesPage() {
  return (
    <>
      <Header title="ロール管理" />
      <div className="p-4 md:p-6 space-y-6">
        {/* ロール一覧 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div key={role.name} className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-text">{role.name}</h3>
                <span className="text-xs text-text-tertiary">{role.users}人</span>
              </div>
              <p className="text-xs text-text-secondary">{role.description}</p>
            </div>
          ))}
        </div>

        {/* 権限マトリクス */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <div className="px-4 py-3 border-b border-border bg-surface-secondary">
            <h2 className="text-sm font-bold text-text">権限マトリクス</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-xs font-medium text-text-secondary bg-surface-secondary sticky left-0">リソース</th>
                  {roles.map((role) => (
                    <th key={role.name} className="text-center px-2 py-2 text-xs font-medium text-text-secondary bg-surface-secondary">
                      {role.name.split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => (
                  <tr key={resource} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-sm font-medium text-text bg-surface sticky left-0">{resource}</td>
                    {roles.map((role) => {
                      const perms = permissionMatrix[role.name]?.[resource] ?? [];
                      return (
                        <td key={role.name} className="px-2 py-2 text-center">
                          {perms.length === actions.length ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" />
                          ) : perms.length > 0 ? (
                            <span className="text-xs text-text-secondary">{perms.join("/")}</span>
                          ) : (
                            <XCircle className="w-4 h-4 text-red-300 mx-auto" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 承認フロー */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-bold text-text mb-4">承認ワークフロー</h2>
          <div className="flex items-center gap-3">
            <div className="flex-1 p-3 bg-surface-secondary rounded-lg text-center">
              <p className="text-xs text-text-tertiary">Step 1（任意）</p>
              <p className="text-sm font-medium text-text mt-1">営業アシスタント</p>
              <p className="text-xs text-text-tertiary">事前チェック</p>
            </div>
            <div className="text-text-tertiary">&rarr;</div>
            <div className="flex-1 p-3 bg-blue-50 rounded-lg text-center border border-blue-200">
              <p className="text-xs text-blue-600">Step 2（必須）</p>
              <p className="text-sm font-medium text-blue-800 mt-1">営業マネージャー</p>
              <p className="text-xs text-blue-600">業務承認</p>
            </div>
            <div className="text-text-tertiary">&rarr;</div>
            <div className="flex-1 p-3 bg-primary-50 rounded-lg text-center border border-primary-200">
              <p className="text-xs text-primary-600">Step 3（必須）</p>
              <p className="text-sm font-medium text-primary-800 mt-1">社長</p>
              <p className="text-xs text-primary-600">最終承認</p>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">金銭に関わる全操作（仕入単価変更、売上計上、請求書発行、支払承認、値引き・返品等）に適用</p>
        </div>
      </div>
    </>
  );
}
