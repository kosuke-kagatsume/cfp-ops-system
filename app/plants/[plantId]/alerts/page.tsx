'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert as AlertType, AlertSeverity, AlertStatus } from '@/types';
import { AlertTriangle, CheckCircle, XCircle, Download, Filter, MessageSquare } from 'lucide-react';
import { exportToCsv } from '@/lib/client-utils';
import { toast } from 'sonner';

export default function AlertsPage() {
  const params = useParams();
  const plantId = params.plantId as string;
  
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);
  const [ackComment, setAckComment] = useState('');
  const [isAckDialogOpen, setIsAckDialogOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [plantId, statusFilter, severityFilter]);

  const fetchAlerts = async () => {
    try {
      const params = new URLSearchParams({ plantId });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      
      const response = await fetch(`/api/alerts?${params}`);
      const data = await response.json();
      setAlerts(data.alerts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      setLoading(false);
    }
  };

  const handleAck = async () => {
    if (!selectedAlert) return;
    
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: selectedAlert.id,
          action: 'ack',
          comment: ackComment,
          userId: 'operator01@cfp.jp'
        })
      });
      
      if (response.ok) {
        toast.success('アラートをACKしました');
        setIsAckDialogOpen(false);
        setAckComment('');
        setSelectedAlert(null);
        fetchAlerts();
      }
    } catch (error) {
      toast.error('ACKに失敗しました');
    }
  };

  const handleClose = async (alert: AlertType) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: alert.id,
          action: 'close',
          userId: 'operator01@cfp.jp'
        })
      });
      
      if (response.ok) {
        toast.success('アラートをクローズしました');
        fetchAlerts();
      }
    } catch (error) {
      toast.error('クローズに失敗しました');
    }
  };

  const exportAlerts = () => {
    const exportData = alerts.map(alert => ({
      ID: alert.id,
      時刻: new Date(alert.ts).toLocaleString('ja-JP'),
      重要度: alert.severity,
      タグ: alert.tag,
      タイトル: alert.title,
      メッセージ: alert.message,
      状態: alert.status === 'open' ? '未対応' : alert.status === 'ack' ? '確認済み' : 'クローズ',
      確認者: alert.ackBy || '',
      コメント: alert.comment || ''
    }));
    
    exportToCsv(exportData, `alerts_${plantId}_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('CSVエクスポートを開始しました');
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    return severity === 'P1' ? 
      <AlertTriangle className="h-5 w-5 text-red-600" /> : 
      <AlertTriangle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">未対応</Badge>;
      case 'ack':
        return <Badge variant="secondary">確認済み</Badge>;
      case 'closed':
        return <Badge variant="outline">クローズ</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">アラート管理</h1>
        <p className="text-muted-foreground mt-1">
          {plantId === 'okayama' ? '岡山ケミカルセンター' : plantId} のアラート一覧
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>アラート一覧</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="重要度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="P1">P1</SelectItem>
                  <SelectItem value="P2">P2</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="open">未対応</SelectItem>
                  <SelectItem value="ack">確認済み</SelectItem>
                  <SelectItem value="closed">クローズ</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={exportAlerts}>
                <Download className="h-4 w-4 mr-1" />
                CSV出力
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>時刻</TableHead>
                <TableHead>重要度</TableHead>
                <TableHead>タグ</TableHead>
                <TableHead>タイトル</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>確認者</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {new Date(alert.ts).toLocaleString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.severity === 'P1' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{alert.tag}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      {alert.comment && (
                        <p className="text-sm text-blue-600 mt-1">
                          <MessageSquare className="h-3 w-3 inline mr-1" />
                          {alert.comment}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(alert.status)}</TableCell>
                  <TableCell className="text-sm">
                    {alert.ackBy && (
                      <div>
                        <p>{alert.ackBy.split('@')[0]}</p>
                        {alert.ackTs && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.ackTs).toLocaleString('ja-JP')}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {alert.status === 'open' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setIsAckDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          ACK
                        </Button>
                      )}
                      {alert.status === 'ack' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleClose(alert)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          クローズ
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              該当するアラートがありません
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACK Dialog */}
      <Dialog open={isAckDialogOpen} onOpenChange={setIsAckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アラート確認 (ACK)</DialogTitle>
            <DialogDescription>
              このアラートを確認済みにします。必要に応じてコメントを追加してください。
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>アラート詳細</Label>
                <div className="p-3 border rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedAlert.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAlert.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(selectedAlert.ts).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">コメント (任意)</Label>
                <Textarea
                  id="comment"
                  placeholder="対応内容や備考を入力..."
                  value={ackComment}
                  onChange={(e) => setAckComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAckDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAck}>
              確認 (ACK)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}