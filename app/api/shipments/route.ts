import { NextRequest, NextResponse } from 'next/server';
import { loadJsonData } from '@/lib/server-utils';
import { Shipment } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId') || 'okayama';
    const oilType = searchParams.get('oilType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const shipmentsData = loadJsonData<{
      shipments: Shipment[];
      summary: any;
    }>(`shipments/${plantId}.json`);
    
    let filteredShipments = shipmentsData.shipments;
    
    if (oilType) {
      filteredShipments = filteredShipments.filter(s => s.oil === oilType);
    }
    
    if (startDate) {
      filteredShipments = filteredShipments.filter(
        s => new Date(s.shipTs) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredShipments = filteredShipments.filter(
        s => new Date(s.shipTs) <= new Date(endDate)
      );
    }
    
    return NextResponse.json({
      shipments: filteredShipments,
      summary: shipmentsData.summary
    });
  } catch (error) {
    console.error('Error fetching shipment data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment data' },
      { status: 500 }
    );
  }
}