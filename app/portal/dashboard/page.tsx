'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { 
  Building2,
  TrendingDown,
  Recycle,
  Download,
  Calendar,
  Leaf,
  Package,
  BarChart3,
  LogOut,
  Info
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CustomerData {
  customerId: string;
  customerName: string;
  monthlyData: {
    month: string;
    totalPlastic_t: number;
    lightOil_t: number;
    heavyOil_t: number;
    residue_t: number;
    co2Savings_kg: number;
    recycleRate: number;
  }[];
  yearlyTotals: {
    totalProcessed_t: number;
    co2Savings_kg: number;
    avgRecycleRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function PortalDashboard() {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    // Mock customer data
    const mockData: CustomerData = {
      customerId: 'C001',
      customerName: '三菱ケミカル株式会社',
      monthlyData: [
        {
          month: '2025-01',
          totalPlastic_t: 15.2,
          lightOil_t: 8.1,
          heavyOil_t: 4.3,
          residue_t: 2.8,
          co2Savings_kg: 12160,
          recycleRate: 84.2
        },
        {
          month: '2025-02',
          totalPlastic_t: 18.5,
          lightOil_t: 9.8,
          heavyOil_t: 5.1,
          residue_t: 3.6,
          co2Savings_kg: 14800,
          recycleRate: 82.7
        },
        {
          month: '2025-03',
          totalPlastic_t: 22.1,
          lightOil_t: 11.9,
          heavyOil_t: 6.2,
          residue_t: 4.0,
          co2Savings_kg: 17680,
          recycleRate: 85.1
        },
        {
          month: '2025-04',
          totalPlastic_t: 19.3,
          lightOil_t: 10.2,
          heavyOil_t: 5.8,
          residue_t: 3.3,
          co2Savings_kg: 15440,
          recycleRate: 83.9
        },
        {
          month: '2025-05',
          totalPlastic_t: 21.7,
          lightOil_t: 11.5,
          heavyOil_t: 6.4,
          residue_t: 3.8,
          co2Savings_kg: 17360,
          recycleRate: 84.8
        },
        {
          month: '2025-06',
          totalPlastic_t: 16.8,
          lightOil_t: 8.9,
          heavyOil_t: 4.7,
          residue_t: 3.2,
          co2Savings_kg: 13440,
          recycleRate: 83.3
        }
      ],
      yearlyTotals: {
        totalProcessed_t: 113.6,
        co2Savings_kg: 90880,
        avgRecycleRate: 84.0
      }
    };

    setTimeout(() => {
      setCustomerData(mockData);
      setLoading(false);
    }, 800);
  };

  const downloadReport = () => {
    if (!customerData) return;

    const csvData = [
      ['月', '投入量(t)', '軽質油(t)', '重質油(t)', '残渣(t)', 'CO₂削減量(kg)', 'リサイクル率(%)'],
      ...customerData.monthlyData.map(month => [
        month.month,
        month.totalPlastic_t,
        month.lightOil_t,
        month.heavyOil_t,
        month.residue_t,
        month.co2Savings_kg,
        month.recycleRate.toFixed(1)
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cfp_report_${customerData.customerId}_${new Date().getFullYear()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    return <div>データが見つかりません</div>;
  }

  const latestMonth = customerData.monthlyData[customerData.monthlyData.length - 1];
  const pieData = [
    { name: '軽質油', value: latestMonth.lightOil_t },
    { name: '重質油', value: latestMonth.heavyOil_t },
    { name: '残渣', value: latestMonth.residue_t }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">CFP顧客ポータル</h1>
              <p className="text-sm text-muted-foreground">{customerData.customerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              レポートダウンロード
            </Button>
            <Link href="/portal">
              <Button variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            データは月次で更新されます。リアルタイム処理状況は CFP 担当者にお問い合わせください。
          </AlertDescription>
        </Alert>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                年間処理量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{customerData.yearlyTotals.totalProcessed_t}t</span>
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CO₂削減効果
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {(customerData.yearlyTotals.co2Savings_kg / 1000).toFixed(1)}t
                </span>
                <TrendingDown className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                平均リサイクル率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-emerald-600">
                  {customerData.yearlyTotals.avgRecycleRate.toFixed(1)}%
                </span>
                <Recycle className="h-5 w-5 text-emerald-600" />
              </div>
              <Progress 
                value={customerData.yearlyTotals.avgRecycleRate} 
                className="mt-2 h-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                今月の処理状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="default" className="bg-green-600">
                  処理完了
                </Badge>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {latestMonth.totalPlastic_t}t 処理済み
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Details */}
        <Tabs defaultValue="trends">
          <TabsList>
            <TabsTrigger value="trends">処理推移</TabsTrigger>
            <TabsTrigger value="breakdown">製品内訳</TabsTrigger>
            <TabsTrigger value="co2">CO₂削減効果</TabsTrigger>
            <TabsTrigger value="data">データ詳細</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>月別処理量推移</CardTitle>
                <CardDescription>
                  廃プラスチック投入量とリサイクル製品産出量
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={customerData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="totalPlastic_t" 
                      stackId="1"
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      name="投入量(t)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lightOil_t" 
                      stackId="2"
                      stroke="#82ca9d" 
                      fill="#82ca9d" 
                      name="軽質油(t)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="heavyOil_t" 
                      stackId="2"
                      stroke="#ffc658" 
                      fill="#ffc658" 
                      name="重質油(t)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>製品内訳（今月）</CardTitle>
                  <CardDescription>
                    熱分解処理による製品比率
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>リサイクル率推移</CardTitle>
                  <CardDescription>
                    月別のリサイクル成功率
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={customerData.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[75, 90]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="recycleRate" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="リサイクル率(%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="co2" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>CO₂削減効果</CardTitle>
                <CardDescription>
                  廃プラスチックリサイクルによる環境貢献度
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={customerData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="co2Savings_kg" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          name="CO₂削減量(kg)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold text-green-800">環境効果</h3>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {(customerData.yearlyTotals.co2Savings_kg / 1000).toFixed(1)} t CO₂削減
                      </p>
                      <p className="text-sm text-green-700 mt-2">
                        これは約 {Math.round(customerData.yearlyTotals.co2Savings_kg / 20)} 本の
                        杉の木が1年間に吸収するCO₂量に相当します
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">削減効果の詳細</h3>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>• 焼却処理によるCO₂排出を回避</li>
                        <li>• 新規石油系製品製造量を削減</li>
                        <li>• 循環経済への貢献</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>月次データ詳細</CardTitle>
                <CardDescription>
                  処理実績の詳細データ
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">月</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">投入量(t)</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">軽質油(t)</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">重質油(t)</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">残渣(t)</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">CO₂削減(kg)</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">リサイクル率(%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerData.monthlyData.map((month) => (
                        <tr key={month.month}>
                          <td className="border border-gray-200 px-4 py-2">{month.month}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{month.totalPlastic_t}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{month.lightOil_t}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{month.heavyOil_t}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{month.residue_t}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{month.co2Savings_kg.toLocaleString()}</td>
                          <td className="border border-gray-200 px-4 py-2 text-right">{month.recycleRate.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}