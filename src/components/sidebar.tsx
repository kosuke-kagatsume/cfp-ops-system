"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  Factory,
  DollarSign,
  Users,
  Shield,
  ScrollText,
  ChevronDown,
  ChevronRight,
  Settings,
  ShoppingCart,
  Boxes,
  Cog,
  CalendarDays,
  Truck,
  PackageCheck,
  FileText,
  Receipt,
  ClipboardList,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  CalendarCheck,
  Wallet,
  Globe,
  TrendingUp,
  Droplets,
  FlaskConical,
  Beaker,
  TestTube,
  Award,
  Fuel,
  Container,
  Trash2,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "MR事業部",
    icon: Boxes,
    children: [
      { name: "仕入・受入", href: "/purchases", icon: ShoppingCart },
      { name: "在庫管理", href: "/inventory", icon: Package },
      { name: "加工管理", href: "/processing", icon: Cog },
      { name: "生産カレンダー", href: "/production-calendar", icon: CalendarDays },
      { name: "出荷管理", href: "/shipments", icon: PackageCheck },
      { name: "配車管理", href: "/dispatch", icon: Truck },
      { name: "帳票管理", href: "/documents", icon: FileText },
    ],
  },
  {
    name: "販売管理",
    icon: Receipt,
    children: [
      { name: "見積管理", href: "/sales/quotations", icon: ClipboardList },
      { name: "受注管理", href: "/sales/orders", icon: FileText },
      { name: "売上管理", href: "/sales/revenue", icon: TrendingUp },
      { name: "納品書管理", href: "/sales/delivery-notes", icon: FileText },
      { name: "請求管理", href: "/sales/invoices", icon: Receipt },
      { name: "入金管理", href: "/sales/payments-received", icon: CreditCard },
      { name: "支払管理", href: "/sales/payments-payable", icon: Wallet },
      { name: "月次締め", href: "/sales/monthly-closing", icon: CalendarCheck },
      { name: "為替管理", href: "/sales/exchange-rates", icon: ArrowRightLeft },
      { name: "運賃管理", href: "/sales/freight", icon: Banknote },
      { name: "海外帳票", href: "/sales/export-docs", icon: Globe },
    ],
  },
  {
    name: "CR事業部",
    icon: Droplets,
    children: [
      { name: "原料受入", href: "/cr/materials", icon: ShoppingCart },
      { name: "製造指図", href: "/cr/production-orders", icon: ClipboardList },
      { name: "タンク管理", href: "/cr/tanks", icon: Container },
      { name: "出荷管理(油化)", href: "/cr/oil-shipments", icon: Fuel },
      { name: "残渣管理", href: "/cr/residue", icon: Trash2 },
    ],
  },
  {
    name: "研究室",
    icon: FlaskConical,
    children: [
      { name: "サンプル受付", href: "/lab/samples", icon: TestTube },
      { name: "分析入力", href: "/lab/analysis", icon: Beaker },
      { name: "成績書発行", href: "/lab/certificates", icon: Award },
    ],
  },
  {
    name: "マスタ管理",
    icon: Settings,
    children: [
      { name: "取引先", href: "/masters/partners", icon: Building2 },
      { name: "品目", href: "/masters/products", icon: Package },
      { name: "工場・倉庫", href: "/masters/plants", icon: Factory },
      { name: "単価", href: "/masters/prices", icon: DollarSign },
    ],
  },
  {
    name: "システム設定",
    icon: Shield,
    children: [
      { name: "ユーザー管理", href: "/settings/users", icon: Users },
      { name: "ロール管理", href: "/settings/roles", icon: Shield },
    ],
  },
  { name: "監査ログ", href: "/audit", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "MR事業部": true,
    "販売管理": false,
    "CR事業部": false,
    "研究室": false,
    "マスタ管理": false,
    "システム設定": false,
  });

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
            <span className="text-sm font-bold text-text-inverse">C</span>
          </div>
          <div>
            <p className="text-sm font-bold text-text">CFP System</p>
            <p className="text-xs text-text-tertiary">統合基幹システム</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          if (item.children) {
            const isOpen = openGroups[item.name] ?? false;
            const isChildActive = item.children.some((child) =>
              pathname.startsWith(child.href)
            );

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isChildActive
                      ? "text-primary-700 font-medium"
                      : "text-text-secondary hover:bg-surface-tertiary"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1 text-left">{item.name}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const isActive = pathname.startsWith(child.href);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary-50 text-primary-700 font-medium"
                              : "text-text-secondary hover:bg-surface-tertiary"
                          }`}
                        >
                          <child.icon className="w-4 h-4 shrink-0" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-text-secondary hover:bg-surface-tertiary"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-xs font-medium text-primary-700">FK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">福田 奈美絵</p>
            <p className="text-xs text-text-tertiary truncate">管理者</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
