'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Shipment, OilType } from '@/types';
import { Truck, Package, Download, Calendar, Factory, Droplets } from 'lucide-react';
import { exportToCsv } from '@/lib/client-utils';
import { toast } from 'sonner';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [oilTypeFilter, setOilTypeFilter] = useState<OilType | 'all'>('all');
  const [plantIdFilter, setPlantIdFilter] = useState('okayama');
  const [summary, setSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    fetchShipments();
  }, [oilTypeFilter, plantIdFilter, dateRange]);

  const fetchShipments = async () => {
    try {
      const params = new URLSearchParams({ plantId: plantIdFilter });
      if (oilTypeFilter !== 'all') params.append('oilType', oilTypeFilter);
      if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange.to) params.append('endDate', dateRange.to.toISOString());
      
      const response = await fetch(`/api/shipments?${params}`);
      const data = await response.json();
      setShipments(data.shipments);
      setSummary(data.summary);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      setLoading(false);
    }
  };

  const exportShipments = () => {
    const exportData = shipments.map(shipment => ({
      出荷ID: shipment.id,
      工場: shipment.plantId === 'okayama' ? '岡山ケミカル' : shipment.plantId,
      出荷日時: new Date(shipment.shipTs).toLocaleString('ja-JP'),
      油種: shipment.oil === 'light' ? '軽質油' : shipment.oil === 'heavy' ? '重質油' : '残渣',
      質量: `${shipment.mass_t}t`,
      顧客: shipment.customer,
      配送先コード: shipment.destinationCode || '',
      請求書番号: shipment.invoiceNo || ''
    }));
    
    exportToCsv(exportData, `shipments_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('出荷データをエクスポートしました');
  };

  const getOilTypeBadge = (oil: OilType) => {
    switch (oil) {
      case 'light':
        return <Badge variant="default" className="bg-blue-600">軽質油</Badge>;
      case 'heavy':
        return <Badge variant="secondary" className="bg-amber-600 text-white">重質油</Badge>;
      case 'residue':
        return <Badge variant="outline" className="border-gray-600">残渣</Badge>;
    }
  };

  const getOilTypeIcon = (oil: OilType) => {
    const className = "h-4 w-4";
    switch (oil) {
      case 'light':
        return <Droplets className={`${className} text-blue-600`} />;
      case 'heavy':
        return <Droplets className={`${className} text-amber-600`} />;
      case 'residue':
        return <Package className={`${className} text-gray-600`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Truck className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">出荷データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">出荷管理</h1>
        <p className="text-muted-foreground mt-1">
          軽質油・重質油・残渣の出荷記録
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                月間出荷合計
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.currentMonth.total_t.toFixed(1)} t
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                前月: {summary.previousMonth.total_t.toFixed(1)} t
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                軽質油
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">
                  {summary.currentMonth.light_t.toFixed(1)} t
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                前月比: +{((summary.currentMonth.light_t - summary.previousMonth.light_t) / summary.previousMonth.light_t * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                重質油
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-amber-600" />
                <span className="text-2xl font-bold">
                  {summary.currentMonth.heavy_t.toFixed(1)} t
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                前月比: +{((summary.currentMonth.heavy_t - summary.previousMonth.heavy_t) / summary.previousMonth.heavy_t * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                残渣
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                <span className="text-2xl font-bold">
                  {summary.currentMonth.residue_t.toFixed(1)} t
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                前月比: +{((summary.currentMonth.residue_t - summary.previousMonth.residue_t) / summary.previousMonth.residue_t * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>出荷一覧</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={plantIdFilter} onValueChange={setPlantIdFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="工場" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="okayama">岡山ケミカル</SelectItem>
                  <SelectItem value="minohama" disabled>蓑浜工場</SelectItem>
                  <SelectItem value="arashiyama" disabled>嵐山工場</SelectItem>
                  <SelectItem value="takamatsu" disabled>高松ケミカル</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={oilTypeFilter} onValueChange={(v) => setOilTypeFilter(v as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="油種" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="light">軽質油</SelectItem>
                  <SelectItem value="heavy">重質油</SelectItem>
                  <SelectItem value="residue">残渣</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={exportShipments}>
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
                <TableHead>出荷ID</TableHead>
                <TableHead>出荷日時</TableHead>
                <TableHead>油種</TableHead>
                <TableHead>質量</TableHead>
                <TableHead>顧客</TableHead>
                <TableHead>配送先</TableHead>
                <TableHead>請求書番号</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell>{getOilTypeIcon(shipment.oil)}</TableCell>
                  <TableCell className="font-mono text-sm">{shipment.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(shipment.shipTs).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getOilTypeBadge(shipment.oil)}</TableCell>
                  <TableCell className="font-medium">{shipment.mass_t} t</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{shipment.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        <Factory className="h-3 w-3 inline mr-1" />
                        {shipment.plantId === 'okayama' ? '岡山' : shipment.plantId}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {shipment.destinationCode || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {shipment.invoiceNo || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {shipments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              該当する出荷データがありません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}