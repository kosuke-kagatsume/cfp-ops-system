'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { KpiCard } from '@/components/ui/kpi-card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { AlertTriangle, Activity, Zap, TrendingUp, Package } from 'lucide-react';
import { KpiSnapshot, Alert as AlertType, Tank } from '@/types';

export default function DashboardPage() {
  const [kpiData, setKpiData] = useState<{
    current: KpiSnapshot | null;
    history: KpiSnapshot[];
    targets: any;
  }>({ current: null, history: [], targets: {} });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [period, setPeriod] = useState<'1h' | '24h' | '7d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [period]);

  const fetchData = async () => {
    try {
      const [kpiRes, alertsRes, tanksRes] = await Promise.all([
        fetch(`/api/kpi?plantId=okayama&period=${period}`),
        fetch('/api/alerts?plantId=okayama&status=open'),
        fetch('/api/tanks?plantId=okayama')
      ]);

      const kpiJson = await kpiRes.json();
      const alertsJson = await alertsRes.json();
      const tanksJson = await tanksRes.json();

      setKpiData(kpiJson);
      setAlerts(alertsJson.alerts.slice(0, 5)); // Show only latest 5 alerts
      setTanks(tanksJson.tanks);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const formatChartData = () => {
    return kpiData.history.map(item => ({
      time: new Date(item.ts).toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      availability: item.availability,
      conversionEff: item.conversionEff,
      throughput: item.throughput_tph,
      energy: item.energyPerTon_kWh
    }));
  };

  const calculateDelta = (current: number, history: KpiSnapshot[]) => {
    if (history.length === 0) return undefined;
    const previous = history[0];
    return ((current - previous.availability) / previous.availability) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">岡山ケミカルセンター ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          リアルタイムKPI監視とオペレーション状況
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.current && (
          <>
            <KpiCard
              title="稼働率"
              value={kpiData.current.availability.toFixed(1)}
              unit="%"
              delta={calculateDelta(kpiData.current.availability, kpiData.history)}
              target={kpiData.targets.availability}
              description="過去24時間の平均稼働率"
              helpText="目標: 95%以上"
            />
            <KpiCard
              title="変換効率"
              value={kpiData.current.conversionEff.toFixed(1)}
              unit="%"
              delta={calculateDelta(kpiData.current.conversionEff, kpiData.history)}
              target={kpiData.targets.conversionEff}
              description="熱分解プロセスの効率"
              helpText="温度・圧力から算出"
            />
            <KpiCard
              title="スループット"
              value={kpiData.current.throughput_tph.toFixed(2)}
              unit="t/h"
              delta={calculateDelta(kpiData.current.throughput_tph, kpiData.history)}
              target={kpiData.targets.throughput_tph}
              description="時間あたり処理量"
            />
            <KpiCard
              title="エネルギー効率"
              value={kpiData.current.energyPerTon_kWh.toFixed(1)}
              unit="kWh/t"
              delta={calculateDelta(kpiData.current.energyPerTon_kWh, kpiData.history)}
              target={kpiData.targets.energyPerTon_kWh}
              description="トンあたり消費電力"
              helpText="低いほど効率的"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>KPIトレンド</CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="1h">1時間</TabsTrigger>
                <TabsTrigger value="24h">24時間</TabsTrigger>
                <TabsTrigger value="7d">7日間</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="availability"
                  stroke="#8884d8"
                  name="稼働率 (%)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="conversionEff"
                  stroke="#82ca9d"
                  name="変換効率 (%)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="throughput"
                  stroke="#ffc658"
                  name="スループット (t/h)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>最新アラート</CardTitle>
              <a href="/plants/okayama/alerts" className="text-sm text-blue-600 hover:underline">
                すべて表示 →
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  アクティブなアラートはありません
                </p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                      alert.severity === 'P1' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge variant={alert.severity === 'P1' ? 'destructive' : 'secondary'}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.ts).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tank Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>タンク状況</CardTitle>
              <a href="/plants/okayama/inventory" className="text-sm text-blue-600 hover:underline">
                詳細を見る →
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tanks.map((tank) => (
                <div key={tank.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tank.name}</span>
                    <span className="text-sm text-muted-foreground">{tank.note}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${
                          tank.level_pct > 80 ? 'bg-red-500' :
                          tank.level_pct > 60 ? 'bg-yellow-500' :
                          tank.level_pct > 20 ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${tank.level_pct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {tank.level_pct.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({tank.est_mass_t.toFixed(1)}t)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}