import { NextRequest, NextResponse } from 'next/server';
import { loadJsonData, getDelayedTimestamp } from '@/lib/server-utils';
import { KpiSnapshot } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId') || 'okayama';
    const period = searchParams.get('period') || '24h';
    
    // Load mock KPI data
    const kpiData = loadJsonData<{
      current: KpiSnapshot;
      history: KpiSnapshot[];
      targets: any;
    }>(`kpi/${plantId}.json`);
    
    // Add delayed timestamp
    const delayedTs = getDelayedTimestamp();
    kpiData.current.ts = delayedTs;
    
    // Filter history based on period
    let filteredHistory = kpiData.history;
    const now = new Date();
    
    if (period === '1h') {
      filteredHistory = kpiData.history.slice(0, 4);
    } else if (period === '24h') {
      filteredHistory = kpiData.history;
    } else if (period === '7d') {
      // Generate more historical data for 7 days
      filteredHistory = [...kpiData.history];
      for (let i = 1; i < 168; i++) { // 7 days * 24 hours
        const ts = new Date(now);
        ts.setHours(ts.getHours() - i);
        filteredHistory.push({
          ts: ts.toISOString(),
          plantId: plantId as any,
          availability: 90 + Math.random() * 10,
          conversionEff: 85 + Math.random() * 10,
          throughput_tph: 2.2 + Math.random() * 0.5,
          energyPerTon_kWh: 80 + Math.random() * 15
        });
      }
    }
    
    return NextResponse.json({
      current: kpiData.current,
      history: filteredHistory,
      targets: kpiData.targets,
      lastUpdate: delayedTs
    });
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    );
  }
}