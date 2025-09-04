'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tank } from '@/types';
import { Droplets, Info, TrendingDown, TrendingUp } from 'lucide-react';

export default function InventoryPage() {
  const params = useParams();
  const plantId = params.plantId as string;
  
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchTankData();
    const interval = setInterval(fetchTankData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [plantId]);

  const fetchTankData = async () => {
    try {
      const response = await fetch(`/api/tanks?plantId=${plantId}`);
      const data = await response.json();
      setTanks(data.tanks);
      setLastUpdate(data.lastUpdate);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tank data:', error);
      setLoading(false);
    }
  };

  const getTankStatusColor = (levelPct: number) => {
    if (levelPct > 85) return 'text-red-600 bg-red-50';
    if (levelPct > 70) return 'text-yellow-600 bg-yellow-50';
    if (levelPct < 20) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getTankProgressColor = (levelPct: number) => {
    if (levelPct > 85) return 'bg-red-500';
    if (levelPct > 70) return 'bg-yellow-500';
    if (levelPct < 20) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getTankStatus = (levelPct: number) => {
    if (levelPct > 85) return { text: '高レベル', icon: <TrendingUp className="h-4 w-4" /> };
    if (levelPct > 70) return { text: '要注意', icon: <Info className="h-4 w-4" /> };
    if (levelPct < 20) return { text: '低レベル', icon: <TrendingDown className="h-4 w-4" /> };
    return { text: '正常', icon: <Droplets className="h-4 w-4" /> };
  };

  const calculateTotalCapacity = () => {
    const total = tanks.reduce((sum, tank) => sum + tank.capacity_m3, 0);
    const used = tanks.reduce((sum, tank) => sum + (tank.capacity_m3 * tank.level_pct / 100), 0);
    const mass = tanks.reduce((sum, tank) => sum + tank.est_mass_t, 0);
    return { total, used, mass, utilization: (used / total) * 100 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Droplets className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">タンクデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  const capacity = calculateTotalCapacity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">タンク在庫管理</h1>
        <p className="text-muted-foreground mt-1">
          {plantId === 'okayama' ? '岡山ケミカルセンター' : plantId} のタンク状況
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              総容量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity.total.toFixed(0)} m³</div>
            <p className="text-xs text-muted-foreground mt-1">
              タンク {tanks.length} 基
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              使用容量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity.used.toFixed(0)} m³</div>
            <p className="text-xs text-muted-foreground mt-1">
              利用率 {capacity.utilization.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              推定総質量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity.mass.toFixed(1)} t</div>
            <p className="text-xs text-muted-foreground mt-1">
              比重による推定値
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              最終更新
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(lastUpdate).toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              30-60分遅延
            </p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          タンク質量は容量×比重による推定値です。実際の値とは異なる場合があります。
        </AlertDescription>
      </Alert>

      {/* Tank Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tanks.map((tank) => {
          const status = getTankStatus(tank.level_pct);
          return (
            <Card key={tank.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tank.name}</CardTitle>
                  <Badge className={getTankStatusColor(tank.level_pct)}>
                    {status.icon}
                    <span className="ml-1">{status.text}</span>
                  </Badge>
                </div>
                <CardDescription>{tank.note}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Level Gauge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>レベル</span>
                    <span className="font-bold">{tank.level_pct.toFixed(1)}%</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={tank.level_pct} 
                      className="h-8"
                    />
                    <div 
                      className={`absolute inset-0 h-8 rounded-md ${getTankProgressColor(tank.level_pct)}`}
                      style={{ 
                        width: `${tank.level_pct}%`,
                        opacity: 0.8
                      }}
                    />
                  </div>
                </div>

                {/* Tank Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">容量</p>
                    <p className="font-medium">
                      {(tank.capacity_m3 * tank.level_pct / 100).toFixed(1)} / {tank.capacity_m3} m³
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">推定質量</p>
                    <p className="font-medium">{tank.est_mass_t.toFixed(1)} t</p>
                  </div>
                  {tank.density && (
                    <>
                      <div>
                        <p className="text-muted-foreground">比重</p>
                        <p className="font-medium">{tank.density.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ID</p>
                        <p className="font-mono text-xs">{tank.id}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Visual Tank */}
                <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className={`absolute bottom-0 left-0 right-0 ${getTankProgressColor(tank.level_pct)} opacity-60 transition-all duration-500`}
                    style={{ height: `${tank.level_pct}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">
                        {tank.level_pct.toFixed(0)}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {tank.est_mass_t.toFixed(0)}t
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}