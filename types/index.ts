// Plant types
export type PlantId = 'okayama' | 'minohama' | 'arashiyama' | 'takamatsu';

export interface Plant {
  id: PlantId;
  name: string;
  isEnabled: boolean;
}

// Sensor & Reading types
export interface SensorPoint {
  tag: string;
  unit?: string;
  desc?: string;
}

export interface Reading {
  ts: string;
  tag: string;
  value: number;
  plantId: PlantId;
}

// KPI types
export interface KpiSnapshot {
  ts: string;
  plantId: PlantId;
  availability: number;
  conversionEff: number;
  throughput_tph: number;
  energyPerTon_kWh: number;
}

// Tank types
export interface Tank {
  id: string;
  plantId: PlantId;
  name: string;
  level_pct: number;
  est_mass_t: number;
  capacity_m3: number;
  density?: number;
  note?: string;
}

// Lot & Quality types
export interface InboundLot {
  id: string;
  kintoneRecordId: string;
  supplier: string;
  code: {
    name: string;
    shape: string;
    color: string;
    grade: string;
  };
  arrivalTs: string;
  mass_t: number;
  plantId: PlantId;
}

export interface QualityRecord {
  id: string;
  lotId: string;
  testTs: string;
  viscosity?: number;
  sulfur_ppm?: number;
  gcms?: string;
  result: 'pass' | 'fail' | 'warn';
  note?: string;
  plantId: PlantId;
}

// Shipment types
export type OilType = 'light' | 'heavy' | 'residue';

export interface Shipment {
  id: string;
  plantId: PlantId;
  shipTs: string;
  oil: OilType;
  mass_t: number;
  customer: string;
  destinationCode?: string;
  invoiceNo?: string;
}

// Alert types
export type AlertSeverity = 'P1' | 'P2';
export type AlertStatus = 'open' | 'ack' | 'closed';

export interface Alert {
  id: string;
  plantId: PlantId;
  ts: string;
  severity: AlertSeverity;
  tag: string;
  title: string;
  message: string;
  status: AlertStatus;
  ackBy?: string;
  ackTs?: string;
  comment?: string;
  rule?: string;
}

// External portal types
export interface ExternalMonthly {
  month: string;
  orgId: string;
  category: string;
  recycled_pct: number;
  co2_saved_t: number;
  shipment_t: number;
  note?: string;
}

// User & Auth types
export type UserRole = 
  | 'operator'
  | 'plant_manager'
  | 'hq_exec'
  | 'quality'
  | 'accounting'
  | 'external_viewer'
  | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plantId?: PlantId;
  orgId?: string; // For external users
  createdAt: string;
  lastLogin?: string;
}

// Integration types
export interface KintoneConfig {
  domain: string;
  appId: string;
  apiToken: string;
  isActive: boolean;
}

export interface LineWorksConfig {
  webhookUrl: string;
  isActive: boolean;
}

export interface IntegrationConfig {
  kintone?: KintoneConfig;
  lineWorks?: LineWorksConfig;
  obc?: {
    exportPath?: string;
    isActive: boolean;
  };
}

// Lineage types (系譜)
export interface LineageNode {
  id: string;
  type: 'inbound' | 'tank' | 'shipment';
  data: InboundLot | Tank | Shipment;
  timestamp: string;
}

export interface LineageLink {
  source: string; // node id
  target: string; // node id
  quantity?: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface Lineage {
  nodes: LineageNode[];
  links: LineageLink[];
}

// Report types
export interface MonthlyKpiReport {
  month: string;
  plantId: PlantId;
  avgAvailability: number;
  avgConversionEff: number;
  totalThroughput_t: number;
  avgEnergyPerTon_kWh: number;
  alertCount: {
    P1: number;
    P2: number;
  };
  shipmentSummary: {
    light_t: number;
    heavy_t: number;
    residue_t: number;
    total_t: number;
  };
}

// CSV Upload types
export interface CsvUploadLog {
  id: string;
  filename: string;
  uploadTs: string;
  status: 'success' | 'partial' | 'failed';
  rowsProcessed: number;
  rowsFailed: number;
  errors?: string[];
  uploadedBy: string;
}

// Permission Matrix
export const PERMISSIONS: Record<UserRole, {
  canViewDashboard: boolean;
  canViewAlerts: boolean;
  canAckAlerts: boolean;
  canEditThresholds: boolean;
  canViewInventory: boolean;
  canViewQuality: boolean;
  canEditQuality: boolean;
  canViewShipments: boolean;
  canExportData: boolean;
  canAccessAdmin: boolean;
  canViewExternal: boolean;
}> = {
  operator: {
    canViewDashboard: true,
    canViewAlerts: true,
    canAckAlerts: true,
    canEditThresholds: false,
    canViewInventory: true,
    canViewQuality: false,
    canEditQuality: false,
    canViewShipments: false,
    canExportData: false,
    canAccessAdmin: false,
    canViewExternal: false,
  },
  plant_manager: {
    canViewDashboard: true,
    canViewAlerts: true,
    canAckAlerts: true,
    canEditThresholds: true,
    canViewInventory: true,
    canViewQuality: true,
    canEditQuality: false,
    canViewShipments: true,
    canExportData: true,
    canAccessAdmin: false,
    canViewExternal: false,
  },
  hq_exec: {
    canViewDashboard: true,
    canViewAlerts: true,
    canAckAlerts: false,
    canEditThresholds: false,
    canViewInventory: true,
    canViewQuality: true,
    canEditQuality: false,
    canViewShipments: true,
    canExportData: true,
    canAccessAdmin: false,
    canViewExternal: false,
  },
  quality: {
    canViewDashboard: false,
    canViewAlerts: false,
    canAckAlerts: false,
    canEditThresholds: false,
    canViewInventory: false,
    canViewQuality: true,
    canEditQuality: true,
    canViewShipments: false,
    canExportData: true,
    canAccessAdmin: false,
    canViewExternal: false,
  },
  accounting: {
    canViewDashboard: false,
    canViewAlerts: false,
    canAckAlerts: false,
    canEditThresholds: false,
    canViewInventory: false,
    canViewQuality: false,
    canEditQuality: false,
    canViewShipments: true,
    canExportData: true,
    canAccessAdmin: false,
    canViewExternal: false,
  },
  external_viewer: {
    canViewDashboard: false,
    canViewAlerts: false,
    canAckAlerts: false,
    canEditThresholds: false,
    canViewInventory: false,
    canViewQuality: false,
    canEditQuality: false,
    canViewShipments: false,
    canExportData: false,
    canAccessAdmin: false,
    canViewExternal: true,
  },
  admin: {
    canViewDashboard: true,
    canViewAlerts: true,
    canAckAlerts: true,
    canEditThresholds: true,
    canViewInventory: true,
    canViewQuality: true,
    canEditQuality: true,
    canViewShipments: true,
    canExportData: true,
    canAccessAdmin: true,
    canViewExternal: true,
  },
};