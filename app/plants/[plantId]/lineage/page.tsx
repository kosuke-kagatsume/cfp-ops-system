'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InboundLot, Tank, Shipment, OilType } from '@/types';
import { 
  ArrowRight, 
  Package, 
  Truck, 
  Factory, 
  Info,
  Calendar,
  Weight,
  GitBranch
} from 'lucide-react';

interface LineageData {
  inbound: InboundLot[];
  tanks: Tank[];
  shipments: Shipment[];
}

export default function LineagePage() {
  const params = useParams();
  const plantId = params.plantId as string;
  
  const [lineageData, setLineageData] = useState<LineageData>({
    inbound: [],
    tanks: [],
    shipments: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<string | null>(null);

  useEffect(() => {
    fetchLineageData();
  }, [plantId]);

  const fetchLineageData = async () => {
    try {
      const [lotsRes, tanksRes, shipmentsRes] = await Promise.all([
        fetch(`/api/lots?plantId=${plantId}`),
        fetch(`/api/tanks?plantId=${plantId}`),
        fetch(`/api/shipments?plantId=${plantId}`)
      ]);

      const lotsData = await lotsRes.json();
      const tanksData = await tanksRes.json();
      const shipmentsData = await shipmentsRes.json();

      setLineageData({
        inbound: lotsData.lots || [],
        tanks: tanksData.tanks || [],
        shipments: shipmentsData.shipments || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch lineage data:', error);
      setLoading(false);
    }
  };

  const getOilTypeColor = (oil: OilType) => {
    switch (oil) {
      case 'light':
        return 'bg-blue-100 text-blue-800';
      case 'heavy':
        return 'bg-amber-100 text-amber-800';
      case 'residue':
        return 'bg-gray-100 text-gray-800';
    }
  };

  const estimateLineageConnection = (lot: InboundLot, shipment: Shipment) => {
    // 簡易的な時間ベースのマッチング（実際は詳細なトラッキングが必要）
    const lotTime = new Date(lot.arrivalTs).getTime();
    const shipTime = new Date(shipment.shipTs).getTime();
    const timeDiff = shipTime - lotTime;
    
    // 3日以内の処理を関連付けと推定
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    if (timeDiff > 0 && timeDiff < threeDays) {
      return 'high';
    } else if (timeDiff > 0 && timeDiff < threeDays * 2) {
      return 'medium';
    }
    return 'low';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <GitBranch className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">系譜データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">系譜ビュー</h1>
        <p className="text-muted-foreground mt-1">
          {plantId === 'okayama' ? '岡山ケミカルセンター' : plantId} の原料から製品への流れ
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          現在は時間ベースの粗粒度での関連付けです。詳細な系譜追跡は今後実装予定です。
        </AlertDescription>
      </Alert>

      {/* Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>処理フロー概要</CardTitle>
          <CardDescription>
            入荷 → 熱分解処理 → 出荷の流れ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg">
            <div className="flex-1 text-center">
              <Package className="h-12 w-12 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">入荷</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lineageData.inbound.length} ロット
              </p>
              <p className="text-xl font-bold mt-2">
                {lineageData.inbound.reduce((sum, lot) => sum + lot.mass_t, 0).toFixed(1)} t
              </p>
            </div>
            
            <ArrowRight className="h-8 w-8 text-muted-foreground mx-4" />
            
            <div className="flex-1 text-center">
              <Factory className="h-12 w-12 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">タンク処理</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lineageData.tanks.length} タンク
              </p>
              <p className="text-xl font-bold mt-2">
                {lineageData.tanks.reduce((sum, tank) => sum + tank.est_mass_t, 0).toFixed(1)} t
              </p>
            </div>
            
            <ArrowRight className="h-8 w-8 text-muted-foreground mx-4" />
            
            <div className="flex-1 text-center">
              <Truck className="h-12 w-12 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">出荷</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {lineageData.shipments.length} 件
              </p>
              <p className="text-xl font-bold mt-2">
                {lineageData.shipments.reduce((sum, ship) => sum + ship.mass_t, 0).toFixed(1)} t
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Lineage */}
      <Card>
        <CardHeader>
          <CardTitle>詳細トレーサビリティ</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recent">
            <TabsList>
              <TabsTrigger value="recent">最近の処理</TabsTrigger>
              <TabsTrigger value="byLot">ロット別</TabsTrigger>
              <TabsTrigger value="byShipment">出荷別</TabsTrigger>
            </TabsList>

            <TabsContent value="recent" className="mt-4">
              <div className="space-y-4">
                {lineageData.inbound.slice(0, 5).map((lot) => {
                  const relatedShipments = lineageData.shipments.filter(
                    ship => estimateLineageConnection(lot, ship) !== 'low'
                  );
                  
                  return (
                    <div key={lot.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4">
                        {/* Inbound */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">入荷</span>
                          </div>
                          <div className="bg-blue-50 rounded p-3">
                            <p className="font-mono text-sm">{lot.id}</p>
                            <p className="text-sm mt-1">{lot.supplier}</p>
                            <p className="text-sm font-medium mt-2">
                              {lot.code.name} / {lot.code.grade}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(lot.arrivalTs).toLocaleDateString('ja-JP')}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Weight className="h-3 w-3" />
                              {lot.mass_t} t
                            </div>
                          </div>
                        </div>

                        {/* Processing */}
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <ArrowRight className="h-6 w-6 text-muted-foreground mx-auto" />
                            <p className="text-xs text-muted-foreground mt-2">
                              熱分解処理
                            </p>
                            <p className="text-xs text-muted-foreground">
                              推定 24-48時間
                            </p>
                          </div>
                        </div>

                        {/* Shipments */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">出荷</span>
                          </div>
                          {relatedShipments.length > 0 ? (
                            <div className="space-y-2">
                              {relatedShipments.map((ship) => (
                                <div key={ship.id} className="bg-purple-50 rounded p-2">
                                  <Badge className={getOilTypeColor(ship.oil)}>
                                    {ship.oil === 'light' ? '軽質油' : 
                                     ship.oil === 'heavy' ? '重質油' : '残渣'}
                                  </Badge>
                                  <p className="text-xs mt-1">{ship.customer}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {ship.mass_t} t
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(ship.shipTs).toLocaleDateString('ja-JP')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-gray-50 rounded p-3 text-center text-sm text-muted-foreground">
                              処理中
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="byLot" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                {lineageData.inbound.map((lot) => (
                  <Card key={lot.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedLot(lot.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono">{lot.id}</CardTitle>
                        <Badge variant="outline">{lot.code.grade}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium">{lot.supplier}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lot.code.name} - {lot.code.shape} - {lot.code.color}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-medium">{lot.mass_t} t</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(lot.arrivalTs).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="byShipment" className="mt-4">
              <div className="space-y-2">
                {lineageData.shipments.map((ship) => (
                  <div key={ship.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Truck className={`h-5 w-5 ${
                        ship.oil === 'light' ? 'text-blue-600' :
                        ship.oil === 'heavy' ? 'text-amber-600' :
                        'text-gray-600'
                      }`} />
                      <div>
                        <p className="font-medium">{ship.customer}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getOilTypeColor(ship.oil)}>
                            {ship.oil === 'light' ? '軽質油' : 
                             ship.oil === 'heavy' ? '重質油' : '残渣'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {ship.mass_t} t
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{ship.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(ship.shipTs).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}