'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Cloud,
  FileSpreadsheet,
  MessageSquare,
  TestTube,
  Save,
  Download,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

export default function IntegrationsPage() {
  const [kintoneConfig, setKintoneConfig] = useState({
    domain: 'example.kintone.com',
    appId: '123',
    apiToken: '',
    isActive: false
  });

  const [lineWorksConfig, setLineWorksConfig] = useState({
    webhookUrl: '',
    isActive: false
  });

  const [obcConfig, setObcConfig] = useState({
    exportPath: '/exports/obc/',
    isActive: false
  });

  const handleKintoneTest = () => {
    toast.info('kintone接続テスト中...');
    setTimeout(() => {
      toast.success('kintone接続テスト成功（モック）');
    }, 1500);
  };

  const handleLineWorksTest = () => {
    toast.info('LINE WORKSテストメッセージ送信中...');
    setTimeout(() => {
      toast.success('LINE WORKSテスト送信成功（モック）');
    }, 1500);
  };

  const handleObcExport = () => {
    toast.info('奉行CSVテンプレート生成中...');
    setTimeout(() => {
      // モックCSVダウンロード
      const csvContent = `伝票番号,伝票日付,取引先コード,取引先名,金額,税額,合計
001,2025-08-01,C001,三菱ケミカル株式会社,1000000,100000,1100000
002,2025-08-01,C002,住友化学株式会社,850000,85000,935000`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `obc_template_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('奉行CSVテンプレートをダウンロードしました');
    }, 1500);
  };

  const handleSaveConfig = (integration: string) => {
    toast.success(`${integration}設定を保存しました`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">統合設定</h1>
        <p className="text-muted-foreground mt-1">
          外部システムとの連携設定
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          MVPではモック実装です。実際のシステム連携は今後実装予定です。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="kintone">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="kintone">
            <Cloud className="h-4 w-4 mr-2" />
            kintone
          </TabsTrigger>
          <TabsTrigger value="obc">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            奉行シリーズ
          </TabsTrigger>
          <TabsTrigger value="lineworks">
            <MessageSquare className="h-4 w-4 mr-2" />
            LINE WORKS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kintone">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>kintone連携設定</CardTitle>
                  <CardDescription>
                    入荷ロット情報の読み取り設定
                  </CardDescription>
                </div>
                <Badge variant={kintoneConfig.isActive ? 'default' : 'secondary'}>
                  {kintoneConfig.isActive ? '有効' : '無効'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kintone-domain">ドメイン</Label>
                  <Input
                    id="kintone-domain"
                    placeholder="your-domain.kintone.com"
                    value={kintoneConfig.domain}
                    onChange={(e) => setKintoneConfig({...kintoneConfig, domain: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kintone-appid">アプリID</Label>
                  <Input
                    id="kintone-appid"
                    placeholder="123"
                    value={kintoneConfig.appId}
                    onChange={(e) => setKintoneConfig({...kintoneConfig, appId: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kintone-token">APIトークン</Label>
                <Input
                  id="kintone-token"
                  type="password"
                  placeholder="APIトークンを入力"
                  value={kintoneConfig.apiToken}
                  onChange={(e) => setKintoneConfig({...kintoneConfig, apiToken: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="kintone-active"
                  checked={kintoneConfig.isActive}
                  onCheckedChange={(checked) => setKintoneConfig({...kintoneConfig, isActive: checked})}
                />
                <Label htmlFor="kintone-active">連携を有効にする</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleKintoneTest} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  接続テスト
                </Button>
                <Button onClick={() => handleSaveConfig('kintone')}>
                  <Save className="h-4 w-4 mr-2" />
                  設定を保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="obc">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>奉行シリーズ連携設定</CardTitle>
                  <CardDescription>
                    CSV出力テンプレート設定
                  </CardDescription>
                </div>
                <Badge variant={obcConfig.isActive ? 'default' : 'secondary'}>
                  {obcConfig.isActive ? '有効' : '無効'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="obc-path">エクスポートパス</Label>
                <Input
                  id="obc-path"
                  placeholder="/exports/obc/"
                  value={obcConfig.exportPath}
                  onChange={(e) => setObcConfig({...obcConfig, exportPath: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="obc-active"
                  checked={obcConfig.isActive}
                  onCheckedChange={(checked) => setObcConfig({...obcConfig, isActive: checked})}
                />
                <Label htmlFor="obc-active">自動エクスポートを有効にする</Label>
              </div>

              <div className="space-y-2">
                <Label>テンプレート一覧</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">売上伝票 (sales.csv)</span>
                    <Button size="sm" variant="outline" onClick={handleObcExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">買掛金 (ap.csv)</span>
                    <Button size="sm" variant="outline" onClick={handleObcExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">売掛金 (ar.csv)</span>
                    <Button size="sm" variant="outline" onClick={handleObcExport}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={() => handleSaveConfig('奉行')}>
                <Save className="h-4 w-4 mr-2" />
                設定を保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lineworks">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>LINE WORKS連携設定</CardTitle>
                  <CardDescription>
                    アラート通知設定
                  </CardDescription>
                </div>
                <Badge variant={lineWorksConfig.isActive ? 'default' : 'secondary'}>
                  {lineWorksConfig.isActive ? '有効' : '無効'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lw-webhook">Webhook URL</Label>
                <Input
                  id="lw-webhook"
                  placeholder="https://www.worksapis.com/..."
                  value={lineWorksConfig.webhookUrl}
                  onChange={(e) => setLineWorksConfig({...lineWorksConfig, webhookUrl: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="lw-active"
                  checked={lineWorksConfig.isActive}
                  onCheckedChange={(checked) => setLineWorksConfig({...lineWorksConfig, isActive: checked})}
                />
                <Label htmlFor="lw-active">通知を有効にする</Label>
              </div>

              <div className="space-y-2">
                <Label>通知設定</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">P1アラート</p>
                      <p className="text-xs text-muted-foreground">重大なアラートを即座に通知</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">P2アラート</p>
                      <p className="text-xs text-muted-foreground">警告レベルのアラートを通知</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="text-sm font-medium">日次サマリ</p>
                      <p className="text-xs text-muted-foreground">毎日朝9時にサマリを送信</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleLineWorksTest} variant="outline">
                  <TestTube className="h-4 w-4 mr-2" />
                  テスト送信
                </Button>
                <Button onClick={() => handleSaveConfig('LINE WORKS')}>
                  <Save className="h-4 w-4 mr-2" />
                  設定を保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}