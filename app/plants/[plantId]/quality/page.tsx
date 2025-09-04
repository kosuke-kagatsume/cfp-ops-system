'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InboundLot, QualityRecord } from '@/types';
import { CheckCircle, XCircle, AlertCircle, Download, FileText, Package, FlaskConical } from 'lucide-react';
import { exportToCsv } from '@/lib/client-utils';
import { toast } from 'sonner';

export default function QualityPage() {
  const params = useParams();
  const plantId = params.plantId as string;
  
  const [lots, setLots] = useState<InboundLot[]>([]);
  const [qualityRecords, setQualityRecords] = useState<QualityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lots');

  useEffect(() => {
    fetchQualityData();
  }, [plantId]);

  const fetchQualityData = async () => {
    try {
      const response = await fetch(`/api/lots?plantId=${plantId}&includeQuality=false`);
      const data = await response.json();
      setLots(data.lots);
      setQualityRecords(data.quality);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch quality data:', error);
      setLoading(false);
    }
  };

  const getResultIcon = (result: QualityRecord['result']) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warn':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getResultBadge = (result: QualityRecord['result']) => {
    switch (result) {
      case 'pass':
        return <Badge variant="default" className="bg-green-600">合格</Badge>;
      case 'warn':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">要注意</Badge>;
      case 'fail':
        return <Badge variant="destructive">不合格</Badge>;
    }
  };

  const exportLots = () => {
    const exportData = lots.map(lot => ({
      ロットID: lot.id,
      Kintone記録ID: lot.kintoneRecordId,
      サプライヤー: lot.supplier,
      品名: lot.code.name,
      形状: lot.code.shape,
      色: lot.code.color,
      グレード: lot.code.grade,
      到着日時: new Date(lot.arrivalTs).toLocaleString('ja-JP'),
      質量: `${lot.mass_t}t`
    }));
    
    exportToCsv(exportData, `lots_${plantId}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('ロットデータをエクスポートしました');
  };

  const exportQuality = () => {
    const exportData = qualityRecords.map(record => ({
      品質ID: record.id,
      ロットID: record.lotId,
      試験日時: new Date(record.testTs).toLocaleString('ja-JP'),
      粘度: record.viscosity || 'N/A',
      硫黄分: record.sulfur_ppm ? `${record.sulfur_ppm} ppm` : 'N/A',
      判定: record.result === 'pass' ? '合格' : record.result === 'warn' ? '要注意' : '不合格',
      備考: record.note || ''
    }));
    
    exportToCsv(exportData, `quality_${plantId}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('品質データをエクスポートしました');
  };

  const getQualityStats = () => {
    const total = qualityRecords.length;
    const pass = qualityRecords.filter(r => r.result === 'pass').length;
    const warn = qualityRecords.filter(r => r.result === 'warn').length;
    const fail = qualityRecords.filter(r => r.result === 'fail').length;
    
    return { total, pass, warn, fail, passRate: (pass / total * 100).toFixed(1) };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FlaskConical className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">品質データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const stats = getQualityStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">品質管理</h1>
        <p className="text-muted-foreground mt-1">
          {plantId === 'okayama' ? '岡山ケミカルセンター' : plantId} のロット品質管理
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総ロット数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lots.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              検査済み: {stats.total}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              合格率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.passRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              合格: {stats.pass} / {stats.total}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              要注意
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warn}</div>
            <p className="text-xs text-muted-foreground mt-1">
              追加検査推奨
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              不合格
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.fail}</div>
            <p className="text-xs text-muted-foreground mt-1">
              処理要検討
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>品質データ</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="lots">
                  <Package className="h-4 w-4 mr-2" />
                  入荷ロット
                </TabsTrigger>
                <TabsTrigger value="quality">
                  <FlaskConical className="h-4 w-4 mr-2" />
                  品質試験
                </TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={activeTab === 'lots' ? exportLots : exportQuality}>
                <Download className="h-4 w-4 mr-1" />
                CSV出力
              </Button>
            </div>

            <TabsContent value="lots" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ロットID</TableHead>
                    <TableHead>Kintone ID</TableHead>
                    <TableHead>サプライヤー</TableHead>
                    <TableHead>品名・仕様</TableHead>
                    <TableHead>到着日時</TableHead>
                    <TableHead className="text-right">質量</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-mono text-sm">{lot.id}</TableCell>
                      <TableCell className="font-mono text-sm">{lot.kintoneRecordId}</TableCell>
                      <TableCell>{lot.supplier}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lot.code.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {lot.code.shape} / {lot.code.color} / {lot.code.grade}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(lot.arrivalTs).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {lot.mass_t} t
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="quality" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>品質ID</TableHead>
                    <TableHead>ロットID</TableHead>
                    <TableHead>試験日時</TableHead>
                    <TableHead>粘度</TableHead>
                    <TableHead>硫黄分</TableHead>
                    <TableHead>GC/MS</TableHead>
                    <TableHead>判定</TableHead>
                    <TableHead>備考</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qualityRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{getResultIcon(record.result)}</TableCell>
                      <TableCell className="font-mono text-sm">{record.id}</TableCell>
                      <TableCell className="font-mono text-sm">{record.lotId}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(record.testTs).toLocaleString('ja-JP')}
                      </TableCell>
                      <TableCell>{record.viscosity || '-'}</TableCell>
                      <TableCell>
                        {record.sulfur_ppm ? `${record.sulfur_ppm} ppm` : '-'}
                      </TableCell>
                      <TableCell>
                        {record.gcms ? (
                          <a href={record.gcms} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getResultBadge(record.result)}</TableCell>
                      <TableCell className="text-sm">
                        {record.note || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}