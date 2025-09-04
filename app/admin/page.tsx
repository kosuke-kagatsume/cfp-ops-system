'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Settings, 
  Users, 
  Upload, 
  Database,
  FileText,
  Shield,
  Activity,
  AlertCircle
} from 'lucide-react';

export default function AdminPage() {
  const adminSections = [
    {
      title: '統合設定',
      description: '外部システムとの連携設定',
      icon: Settings,
      href: '/admin/integrations',
      items: ['kintone連携', '奉行CSV出力', 'LINE WORKS通知']
    },
    {
      title: 'ユーザー管理',
      description: 'ユーザーと権限の管理',
      icon: Users,
      href: '/admin/users',
      items: ['ユーザー一覧', 'ロール設定', 'アクセス履歴']
    },
    {
      title: 'データ取込',
      description: 'CSVファイルのアップロード',
      icon: Upload,
      href: '/admin/data-intake',
      items: ['センサーデータ', 'ロット情報', '品質データ']
    },
    {
      title: 'システム監視',
      description: 'システムステータスと監視',
      icon: Activity,
      href: '/admin/monitoring',
      items: ['API稼働状況', 'データ同期状態', 'エラーログ']
    }
  ];

  const systemStats = [
    { label: 'アクティブユーザー', value: '12', icon: Users },
    { label: '本日のAPI呼び出し', value: '3,245', icon: Database },
    { label: 'データ同期', value: '正常', icon: Activity, status: 'success' },
    { label: 'アラート', value: '2', icon: AlertCircle, status: 'warning' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">管理画面</h1>
        <p className="text-muted-foreground mt-1">
          システム設定と管理機能
        </p>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${
                    stat.status === 'success' ? 'text-green-600' :
                    stat.status === 'warning' ? 'text-yellow-600' :
                    ''
                  }`}>
                    {stat.value}
                  </span>
                  <Icon className={`h-5 w-5 ${
                    stat.status === 'success' ? 'text-green-600' :
                    stat.status === 'warning' ? 'text-yellow-600' :
                    'text-muted-foreground'
                  }`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Admin Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={section.href}>
                  <Button variant="outline" className="w-full">
                    管理画面を開く
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>
            よく使う管理機能へのショートカット
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              CSVテンプレートダウンロード
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              権限テンプレート編集
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              データバックアップ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}