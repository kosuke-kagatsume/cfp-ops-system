import { NextRequest, NextResponse } from 'next/server';
import { loadJsonData, getDelayedTimestamp } from '@/lib/server-utils';
import { Tank } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId') || 'okayama';
    
    const tanksData = loadJsonData<{
      tanks: Tank[];
      lastUpdate: string;
    }>(`tanks/${plantId}.json`);
    
    // Update timestamp to simulate delay
    tanksData.lastUpdate = getDelayedTimestamp();
    
    // Add some random variation to simulate real-time changes
    tanksData.tanks = tanksData.tanks.map(tank => ({
      ...tank,
      level_pct: Math.min(100, Math.max(0, tank.level_pct + (Math.random() - 0.5) * 2)),
      est_mass_t: tank.level_pct * tank.capacity_m3 * (tank.density || 0.85) / 100
    }));
    
    return NextResponse.json(tanksData);
  } catch (error) {
    console.error('Error fetching tank data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tank data' },
      { status: 500 }
    );
  }
}