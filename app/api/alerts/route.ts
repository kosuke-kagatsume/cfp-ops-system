import { NextRequest, NextResponse } from 'next/server';
import { loadJsonData } from '@/lib/server-utils';
import { Alert } from '@/types';

let alertsData = loadJsonData<{
  alerts: Alert[];
  statistics: any;
}>('alerts/seed.json');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const plantId = searchParams.get('plantId') || 'okayama';
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    
    let filteredAlerts = alertsData.alerts.filter(a => a.plantId === plantId);
    
    if (status) {
      filteredAlerts = filteredAlerts.filter(a => a.status === status);
    }
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
    }
    
    return NextResponse.json({
      alerts: filteredAlerts,
      statistics: alertsData.statistics
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, action, comment, userId } = body;
    
    const alertIndex = alertsData.alerts.findIndex(a => a.id === alertId);
    
    if (alertIndex === -1) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }
    
    const alert = alertsData.alerts[alertIndex];
    const now = new Date().toISOString();
    
    if (action === 'ack') {
      alert.status = 'ack';
      alert.ackBy = userId;
      alert.ackTs = now;
      if (comment) alert.comment = comment;
    } else if (action === 'close') {
      alert.status = 'closed';
      if (comment) alert.comment = comment;
    }
    
    alertsData.alerts[alertIndex] = alert;
    
    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}