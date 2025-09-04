import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { 
  KpiSnapshot, 
  Tank, 
  Alert, 
  Shipment,
  InboundLot,
  QualityRecord,
  ExternalMonthly,
  Reading
} from '@/types';

// Get mock data directory path
const getMockPath = (relativePath: string) => {
  return path.join(process.cwd(), 'mocks', relativePath);
};

// Load JSON data
export const loadJsonData = <T>(filePath: string): T => {
  const fullPath = getMockPath(filePath);
  const data = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(data);
};

// Load CSV data
export const loadCsvData = async (filePath: string): Promise<any[]> => {
  const fullPath = getMockPath(filePath);
  const csvText = fs.readFileSync(fullPath, 'utf-8');
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
};

// Calculate KPI from sensor readings
export const calculateKpiFromReadings = (readings: Reading[]): Partial<KpiSnapshot> => {
  if (readings.length === 0) return {};
  
  // Simple mock calculations
  const avgTemp = readings.reduce((sum, r) => sum + (r.tag === 'temp_reactor_c' ? r.value : 0), 0) / readings.length;
  const avgPressure = readings.reduce((sum, r) => sum + (r.tag === 'pressure_reactor_kpa' ? r.value : 0), 0) / readings.length;
  const avgFeedRate = readings.reduce((sum, r) => sum + (r.tag === 'feed_rate_kgph' ? r.value : 0), 0) / readings.length;
  const avgPower = readings.reduce((sum, r) => sum + (r.tag === 'power_kw' ? r.value : 0), 0) / readings.length;
  
  // Mock formulas
  const availability = Math.min(100, 80 + (avgTemp - 400) * 0.5 + Math.random() * 5);
  const conversionEff = Math.min(100, 70 + (avgTemp - 400) * 0.3 + (avgPressure - 130) * 0.2);
  const throughput_tph = avgFeedRate / 1000; // Convert kg/h to t/h
  const energyPerTon_kWh = avgPower / throughput_tph;
  
  return {
    availability: Math.round(availability * 10) / 10,
    conversionEff: Math.round(conversionEff * 10) / 10,
    throughput_tph: Math.round(throughput_tph * 100) / 100,
    energyPerTon_kWh: Math.round(energyPerTon_kWh * 10) / 10
  };
};

// Add random variation to data
export const addVariation = (value: number, maxVariation: number = 0.05): number => {
  const variation = (Math.random() - 0.5) * 2 * maxVariation;
  return value * (1 + variation);
};

// Generate time series data
export const generateTimeSeries = (
  startTime: Date,
  endTime: Date,
  intervalMinutes: number,
  generator: (timestamp: Date) => any
): any[] => {
  const data = [];
  const current = new Date(startTime);
  
  while (current <= endTime) {
    data.push(generator(current));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return data;
};

// Simulate data delay
export const getDelayedTimestamp = (): string => {
  const delayMin = parseInt(process.env.NEXT_PUBLIC_DATA_DELAY_MIN || '30');
  const delayMax = parseInt(process.env.NEXT_PUBLIC_DATA_DELAY_MAX || '60');
  const delay = delayMin + Math.random() * (delayMax - delayMin);
  
  const now = new Date();
  now.setMinutes(now.getMinutes() - delay);
  
  return now.toISOString();
};

// Format timestamp for display
export const formatTimestamp = (ts: string, locale: string = 'ja-JP'): string => {
  return new Date(ts).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};