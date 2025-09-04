import { NextRequest, NextResponse } from 'next/server';
import { loadJsonData } from '@/lib/server-utils';
import { InboundLot, QualityRecord } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId') || 'okayama';
    const includeQuality = searchParams.get('includeQuality') === 'true';
    
    const lotsData = loadJsonData<{
      lots: InboundLot[];
      quality: QualityRecord[];
    }>('lots/quality.json');
    
    let lots = lotsData.lots.filter(lot => lot.plantId === plantId);
    
    if (includeQuality) {
      // Join quality data with lots
      const lotsWithQuality = lots.map(lot => {
        const qualityRecords = lotsData.quality.filter(q => q.lotId === lot.id);
        return {
          ...lot,
          quality: qualityRecords[0] || null
        };
      });
      
      return NextResponse.json({
        lots: lotsWithQuality,
        totalCount: lotsWithQuality.length
      });
    }
    
    return NextResponse.json({
      lots,
      quality: lotsData.quality.filter(q => q.plantId === plantId),
      totalCount: lots.length
    });
  } catch (error) {
    console.error('Error fetching lots data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lots data' },
      { status: 500 }
    );
  }
}