'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Calendar,
  Activity,
  Package,
  FlaskConical,
  Info
} from 'lucide-react';

interface UploadLog {
  id: string;
  filename: string;
  type: 'sensor' | 'lot' | 'quality';
  status: 'success' | 'partial' | 'failed';
  rowsProcessed: number;
  rowsFailed: number;
  timestamp: string;
  errors?: string[];
}

export default function DataIntakePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLogs, setUploadLogs] = useState<UploadLog[]>([
    {
      id: 'log-001',
      filename: '2025-07-31.csv',
      type: 'sensor',
      status: 'success',
      rowsProcessed: 1440,
      rowsFailed: 0,
      timestamp: '2025-08-01T09:00:00+09:00'
    },
    {
      id: 'log-002',
      filename: 'lots_202507.csv',
      type: 'lot',
      status: 'partial',
      rowsProcessed: 95,
      rowsFailed: 5,
      timestamp: '2025-08-01T08:30:00+09:00',
      errors: ['行23: 必須フィールド不足', '行45: 日付形式エラー']
    }
  ]);

  const dataTypes = [
    {
      type: 'sensor',
      label: 'センサーデータ',
      icon: Activity,
      description: '1日分のセンサー読み取り値（分単位）',
      template: 'sensor_template.csv'
    },
    {
      type: 'lot',
      label: 'ロット情報',
      icon: Package,
      description: '入荷ロットの詳細情報',
      template: 'lot_template.csv'
    },
    {
      type: 'quality',
      label: '品質データ',
      icon: FlaskConical,
      description: 'ロットごとの品質試験結果',
      template: 'quality_template.csv'
    }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('CSVファイルを選択してください');
        return;
      }
      setSelectedFile(file);
      toast.success(`${file.name} を選択しました`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      const newLog: UploadLog = {
        id: `log-${Date.now()}`,
        filename: selectedFile.name,
        type: 'sensor',
        status: Math.random() > 0.8 ? 'partial' : 'success',
        rowsProcessed: Math.floor(Math.random() * 1000) + 500,
        rowsFailed: Math.random() > 0.8 ? Math.floor(Math.random() * 10) : 0,
        timestamp: new Date().toISOString(),
        errors: Math.random() > 0.8 ? ['サンプルエラー'] : undefined
      };

      setUploadLogs([newLog, ...uploadLogs]);
      setUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      
      if (newLog.status === 'success') {
        toast.success('CSVファイルのアップロードが完了しました');
      } else {
        toast.warning(`CSVファイルの処理が部分的に完了しました（${newLog.rowsFailed}行エラー）`);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 2000);
  };

  const downloadTemplate = (template: string) => {
    // Mock template download
    const templates: Record<string, string> = {
      'sensor_template.csv': `ts,temp_reactor_c,pressure_reactor_kpa,feed_rate_kgph,power_kw,tank_A_level_pct,tank_B_level_pct
2025-08-01T00:00:00+09:00,415.2,135.0,820.4,210.1,44.2,61.8`,
      'lot_template.csv': `id,kintoneRecordId,supplier,name,shape,color,grade,arrivalTs,mass_t
lot-001,KT-2025-0801,エコリサイクル株式会社,PET-MIX-A,フレーク,透明混合,グレードA,2025-08-01T08:00:00+09:00,12.5`,
      'quality_template.csv': `id,lotId,testTs,viscosity,sulfur_ppm,result,note
qc-001,lot-001,2025-08-01T09:30:00+09:00,2.45,125,pass,基準値内`
    };

    const content = templates[template] || 'No template available';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', template);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${template} をダウンロードしました`);
  };

  const getStatusIcon = (status: UploadLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusBadge = (status: UploadLog['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">成功</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">部分成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失敗</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">データ取込</h1>
        <p className="text-muted-foreground mt-1">
          CSVファイルのアップロードとデータ同期
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          MVPではローカルファイルへの書き込みを行います。実際のデータベース連携は今後実装予定です。
        </AlertDescription>
      </Alert>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>CSVアップロード</CardTitle>
          <CardDescription>
            センサーデータ、ロット情報、品質データをアップロード
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              CSVファイルをドラッグ＆ドロップまたは選択
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>ファイルを選択</span>
              </Button>
            </label>
            
            {selectedFile && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'アップロード中...' : 'アップロード'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>アップロード中...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>CSVテンプレート</CardTitle>
          <CardDescription>
            データ形式に合わせたテンプレートをダウンロード
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {dataTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.type} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {type.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => downloadTemplate(type.template)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    テンプレート
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upload History */}
      <Card>
        <CardHeader>
          <CardTitle>アップロード履歴</CardTitle>
          <CardDescription>
            最近のCSVアップロード結果
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {uploadLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(log.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{log.filename}</span>
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(log.timestamp).toLocaleString('ja-JP')}
                    </span>
                    <span>
                      処理: {log.rowsProcessed}行
                    </span>
                    {log.rowsFailed > 0 && (
                      <span className="text-red-600">
                        エラー: {log.rowsFailed}行
                      </span>
                    )}
                  </div>
                  {log.errors && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                      {log.errors.map((error, i) => (
                        <p key={i} className="text-red-600">{error}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}