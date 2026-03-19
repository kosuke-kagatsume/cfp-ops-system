import { vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock prisma - concrete mock objects so tests can configure return values
// ---------------------------------------------------------------------------
const createModelMock = () => ({
  findMany: vi.fn().mockResolvedValue([]),
  findUnique: vi.fn().mockResolvedValue(null),
  findFirst: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
  deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  count: vi.fn().mockResolvedValue(0),
  upsert: vi.fn().mockResolvedValue({ currentNumber: 1 }),
  updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  aggregate: vi.fn().mockResolvedValue({}),
  groupBy: vi.fn().mockResolvedValue([]),
});

type ModelMock = ReturnType<typeof createModelMock>;

const knownModels: Record<string, ModelMock> = {};

function getOrCreateModel(name: string): ModelMock {
  if (!knownModels[name]) {
    knownModels[name] = createModelMock();
  }
  return knownModels[name];
}

// Pre-register frequently used models
const modelNames = [
  "salesOrder", "salesOrderItem", "revenue", "invoice", "quotation",
  "dispatch", "paymentReceived", "paymentPayable", "exchangeRate",
  "monthlyClosing", "numberSequence", "journalEntry", "journalLine",
  "businessPartner", "product", "warehouse", "plant", "customerPrice",
  "purchase", "shipment", "processingOrder", "crMaterial",
  "crProductionOrder", "oilShipment", "labSample", "analysis",
  "certificate", "externalAnalysis", "approvalRequest", "approvalStep",
  "contract", "expense", "asset", "user", "notification",
  "traceRecord", "traceStage", "isccCertificate", "sustainabilityDeclaration",
  "productName", "productShape", "productColor", "productGrade",
  "productionCalendar", "companyTransaction", "subsidy", "residue", "tank",
  "partnerContact", "bankAccount",
];
for (const m of modelNames) {
  knownModels[m] = createModelMock();
}

export const prismaMock = new Proxy(knownModels as Record<string, unknown>, {
  get(target, prop: string) {
    if (prop === "$transaction") {
      return vi.fn((fn: (tx: unknown) => unknown) => fn(prismaMock));
    }
    return getOrCreateModel(prop);
  },
});

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

// Mock auto-number
vi.mock("@/lib/auto-number", () => ({
  getNextNumber: vi.fn().mockResolvedValue("TEST-2026-0001"),
}));

// Mock notifications (avoid side effects in tests)
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
  notifyApprovalCreated: vi.fn(),
  notifyApprovalActioned: vi.fn(),
}));

// Mock journal
vi.mock("@/lib/journal", () => ({
  generateRevenueJournal: vi.fn().mockResolvedValue(undefined),
  generatePaymentReceivedJournal: vi.fn().mockResolvedValue(undefined),
}));

// Mock invoice helpers
vi.mock("@/lib/invoice", () => ({
  getPreviousBalance: vi.fn().mockResolvedValue(0),
  calculateInvoiceBalance: vi.fn().mockResolvedValue(undefined),
}));

// Mock reconciliation
vi.mock("@/lib/reconciliation", () => ({
  autoReconcile: vi.fn().mockResolvedValue({ matched: [], unmatched: [] }),
  manualReconcile: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock monthly-closing
vi.mock("@/lib/monthly-closing", () => ({
  preCheckMonthlyClosing: vi.fn().mockResolvedValue({ canClose: true, warnings: [], errors: [], summary: {} }),
  executeMonthlyClosing: vi.fn().mockResolvedValue({ success: true }),
  reopenMonthlyClosing: vi.fn().mockResolvedValue({ success: true }),
}));
