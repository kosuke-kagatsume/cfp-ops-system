"use client";

import { Header } from "@/components/header";
import { useToast } from "@/components/toast";
import { dashboardStats, auditLogs } from "@/lib/dummy-data";
import {
  Building2,
  Package,
  Factory,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import Link from "next/link";

const statCards = [
  { label: "取引先", value: dashboardStats.totalPartners, sub: `稼働中 ${dashboardStats.activePartners}`, icon: Building2, color: "bg-blue-50 text-blue-600", href: "/masters/partners" },
  { label: "品目", value: dashboardStats.totalProducts, sub: "4軸コード体系", icon: Package, color: "bg-emerald-50 text-emerald-600", href: "/masters/products" },
  { label: "工場・拠点", value: dashboardStats.totalPlants, sub: `倉庫 ${dashboardStats.totalWarehouses}`, icon: Factory, color: "bg-amber-50 text-amber-600", href: "/masters/plants" },
  { label: "ユーザー", value: dashboardStats.totalUsers, sub: `アクティブ ${dashboardStats.activeUsers}`, icon: Users, color: "bg-purple-50 text-purple-600", href: "/settings/users" },
];

export default function DashboardPage() {
  const { showToast } = useToast();

  return (
    <>
      <Header title="ダッシュボード" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href} className="bg-surface rounded-xl border border-border p-5 hover:border-primary-300 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-text-secondary">{card.label}</p>
                  <p className="text-2xl font-bold text-text mt-1">{card.value}</p>
                  <p className="text-xs text-text-tertiary mt-1">{card.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-warning" />
              <h2 className="font-bold text-text">承認待ち</h2>
              <span className="ml-auto bg-warning/10 text-warning text-xs font-bold px-2 py-0.5 rounded-full">
                {dashboardStats.pendingApprovals}件
              </span>
            </div>
            <div className="space-y-3">
              {[
                { title: "単価変更申請", desc: "東洋プラスチック PP-PEL-N-A1", time: "10分前" },
                { title: "新規取引先登録", desc: "株式会社中部リサイクル", time: "1時間前" },
                { title: "ユーザー追加申請", desc: "中村 太一（営業部）", time: "3時間前" },
              ].map((item) => (
                <button
                  key={item.title}
                  onClick={() => showToast(`${item.title}の承認画面を開きます（開発中）`, "info")}
                  className="w-full flex items-center gap-3 p-3 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors text-left"
                >
                  <div className="w-2 h-2 bg-warning rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">{item.title}</p>
                    <p className="text-xs text-text-tertiary">{item.desc}</p>
                  </div>
                  <span className="text-xs text-text-tertiary">{item.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2 bg-surface rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-info" />
              <h2 className="font-bold text-text">最近の変更</h2>
              <Link href="/audit" className="ml-auto text-xs text-primary-600 hover:underline">
                すべて見る
              </Link>
            </div>
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    log.action === "INSERT" ? "bg-emerald-50 text-emerald-600"
                      : log.action === "UPDATE" ? "bg-blue-50 text-blue-600"
                      : "bg-red-50 text-red-600"
                  }`}>
                    {log.action === "INSERT" ? "+" : log.action === "UPDATE" ? "U" : "-"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text">{log.summary}</p>
                    <p className="text-xs text-text-tertiary">{log.user} - {log.table}</p>
                  </div>
                  <span className="text-xs text-text-tertiary whitespace-nowrap">{log.timestamp.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="font-bold text-text mb-4">クイックアクセス</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "取引先を登録", href: "/masters/partners", icon: Building2, desc: "顧客・仕入先・運送会社" },
              { label: "品目を登録", href: "/masters/products", icon: Package, desc: "4軸コード体系" },
              { label: "単価を設定", href: "/masters/prices", icon: TrendingUp, desc: "顧客×品目×有効期間" },
              { label: "ユーザーを追加", href: "/settings/users", icon: Users, desc: "Microsoft 365 SSO" },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                  <action.icon className="w-5 h-5 text-text-secondary group-hover:text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{action.label}</p>
                  <p className="text-xs text-text-tertiary">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
