import { z } from "zod";

// --- Helpers ---
const optStr = z.string().optional().nullable();
const optNum = z.number().optional().nullable();
const optBool = z.boolean().optional();
const reqStr = z.string().min(1, "必須項目です");
const isoDate = z.string().min(1).or(z.coerce.date());
const optDate = z.string().optional().nullable().or(z.coerce.date().optional().nullable());

// ============================================================
// Masters
// ============================================================

export const partnerCreate = z.object({
  code: reqStr,
  name: reqStr,
  nameKana: optStr,
  shortName: optStr,
  isCustomer: optBool,
  isSupplier: optBool,
  isPickup: optBool,
  isDelivery: optBool,
  isCarrier: optBool,
  postalCode: optStr,
  prefecture: optStr,
  city: optStr,
  address: optStr,
  tel: optStr,
  fax: optStr,
  email: optStr,
  closingDay: optStr,
  paymentSiteMonths: optNum,
  currency: optStr,
  invoiceNumber: optStr,
  isIsccCertified: optBool,
  isccCertNumber: optStr,
  isOverseas: optBool,
  countryCode: optStr,
});

export const partnerUpdate = partnerCreate.partial().omit({ code: true });

export const productCreate = z.object({
  nameId: reqStr,
  shapeId: reqStr,
  colorId: reqStr,
  gradeId: reqStr,
  isIsccEligible: optBool,
});

export const productUpdate = z.object({
  isIsccEligible: optBool,
  displayName: optStr,
});

export const plantCreate = z.object({
  code: reqStr,
  name: reqStr,
  companyId: z.string().default("CFP"),
  address: optStr,
  tel: optStr,
});

export const plantUpdate = plantCreate.partial().omit({ code: true });

export const priceCreate = z.object({
  partnerId: reqStr,
  productId: reqStr,
  unitPrice: z.number(),
  currency: z.string().default("JPY"),
  validFrom: isoDate,
  validTo: optDate,
  note: optStr,
});

export const priceUpdate = priceCreate.partial();

export const warehouseCreate = z.object({
  code: reqStr,
  name: reqStr,
  type: z.string().default("INTERNAL"),
  plantId: optStr,
  address: optStr,
  capacity: optNum,
});

export const warehouseUpdate = warehouseCreate.partial().omit({ code: true });

export const productNameCreate = z.object({
  code: z.number().or(z.string()),
  name: reqStr,
  isccManageName: optStr,
  mixedProductCode: optStr,
  mixedRatio: optNum,
});

export const productNameUpdate = productNameCreate.partial().omit({ code: true });

export const simpleCodeName = z.object({
  code: z.number().or(z.string()),
  name: reqStr,
});

export const simpleNameUpdate = z.object({ name: reqStr });

// ============================================================
// Sales
// ============================================================

export const salesOrderCreate = z.object({
  customerId: reqStr,
  orderDate: isoDate,
  deliveryDate: optDate,
  productId: optStr,
  warehouseId: optStr,
  subtotal: z.number().optional(),
  taxAmount: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
  note: optStr,
  items: z.array(z.object({
    productId: reqStr,
    quantity: z.number(),
    unitPrice: z.number(),
    taxRate: z.number().optional(),
    note: optStr,
  })).optional(),
});

export const salesOrderUpdate = salesOrderCreate.partial().extend({
  status: z.string().optional(),
});

export const revenueCreate = z.object({
  customerId: optStr,
  productId: optStr,
  revenueDate: isoDate,
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  amount: z.number().optional(),
  taxRate: z.number().optional(),
  taxAmount: z.number().optional(),
  isExportExempt: z.boolean().optional(),
  division: z.string().optional(),
  salesCategory: z.string().default("SALES"),
  billingDate: optDate,
  shipmentDate: optDate,
  shipmentId: optStr,
  invoiceId: optStr,
  orderId: optStr,
  warehouseId: optStr,
  packagingType: optStr,
  note: optStr,
  currency: z.string().default("JPY"),
});

export const revenueUpdate = revenueCreate.partial();

export const invoiceCreate = z.object({
  customerId: reqStr,
  billingDate: isoDate,
  dueDate: optDate,
  closingDay: z.string().optional().nullable(),
  prevBalance: z.number().default(0),
  paymentReceived: z.number().default(0),
  subtotal: z.number().default(0),
  taxAmount: z.number().default(0),
  currency: z.string().optional(),
  note: optStr,
});

export const invoiceUpdate = invoiceCreate.partial().extend({
  status: z.string().optional(),
  currency: z.string().optional(),
  closingDay: z.string().optional().nullable(),
});

export const quotationCreate = z.object({
  customerId: optStr,
  quotationDate: isoDate,
  validUntil: optDate,
  subject: optStr,
  items: z.any().optional(),
  subtotal: z.number().default(0),
  taxAmount: z.number().default(0),
  total: z.number().default(0),
  note: optStr,
  currency: z.string().default("JPY"),
});

export const quotationUpdate = quotationCreate.partial().extend({
  status: z.string().optional(),
});

export const freightCreate = z.object({
  shipmentId: reqStr,
  carrierId: optStr,
  dispatchDate: isoDate,
  vehicleNumber: optStr,
  driverName: optStr,
  freightCost: optNum,
  note: optStr,
});

export const freightUpdate = freightCreate.partial();

export const paymentReceivedCreate = z.object({
  customerId: reqStr,
  paymentDate: isoDate,
  amount: z.number(),
  paymentMethod: z.string().optional(),
  method: optStr,
  bankAccountId: optStr,
  note: optStr,
});

export const paymentReceivedUpdate = paymentReceivedCreate.partial().extend({
  isReconciled: z.boolean().optional(),
});

export const paymentPayableCreate = z.object({
  supplierId: reqStr,
  paymentDate: isoDate,
  amount: z.number(),
  paymentMethod: z.string().optional(),
  method: optStr,
  bankAccountId: optStr,
  note: optStr,
});

export const paymentPayableUpdate = paymentPayableCreate.partial().extend({
  isReconciled: z.boolean().optional(),
});

export const exchangeRateCreate = z.object({
  fromCurrency: reqStr,
  toCurrency: z.string().default("JPY"),
  rate: z.number(),
  effectiveDate: isoDate,
  source: optStr,
});

export const exchangeRateUpdate = exchangeRateCreate.partial();

export const reconciliationAction = z.object({
  action: z.enum(["auto", "manual"]),
  paymentId: z.string().optional(),
  invoiceId: z.string().optional(),
  amount: z.number().optional(),
});

export const monthlyClosingAction = z.object({
  action: z.enum(["close", "reopen"]),
  customerId: optStr,
  year: z.number(),
  month: z.number(),
});

// ============================================================
// MR
// ============================================================

export const purchaseCreate = z.object({
  supplierId: reqStr,
  productId: reqStr,
  purchaseDate: isoDate,
  quantity: z.number(),
  unitPrice: z.number(),
  freightCost: z.number().default(0),
  packagingType: optStr,
  warehouseId: optStr,
  pickupPartnerId: optStr,
  note: optStr,
  status: z.string().default("ORDERED"),
});

export const purchaseUpdate = purchaseCreate.partial();

export const shipmentCreate = z.object({
  customerId: reqStr,
  productId: reqStr,
  quantity: z.number(),
  unitPrice: optNum,
  shipmentDate: optDate,
  packagingType: optStr,
  warehouseId: optStr,
  note: optStr,
});

export const shipmentUpdate = shipmentCreate.partial().extend({
  status: z.string().optional(),
});

export const dispatchCreate = z.object({
  shipmentId: reqStr,
  carrierId: optStr,
  dispatchDate: optDate,
  vehicleNumber: optStr,
  driverName: optStr,
  note: optStr,
});

export const dispatchUpdate = dispatchCreate.partial();

export const processingCreate = z.object({
  productId: reqStr,
  processType: reqStr,
  inputQuantity: z.number(),
  plantId: optStr,
  scheduledDate: optDate,
  note: optStr,
});

export const processingUpdate = processingCreate.partial().extend({
  status: z.string().optional(),
  outputQuantity: optNum,
  yieldRate: optNum,
  completedDate: optDate,
  equipmentName: optStr,
  reProcessingFee: optNum,
});

export const bankTransferCreate = z.object({
  ids: z.array(z.string()).min(1),
  transferDate: z.string().min(4),
});

// ============================================================
// CR
// ============================================================

export const crMaterialCreate = z.object({
  supplierId: reqStr,
  productId: optStr,
  receivedDate: isoDate,
  quantity: z.number(),
  unitPrice: optNum,
  plantId: optStr,
  chlorineContent: optNum,
  moistureContent: optNum,
  foreignMatterRate: optNum,
  note: optStr,
});

export const crMaterialUpdate = crMaterialCreate.partial();

export const oilShipmentCreate = z.object({
  customerId: reqStr,
  productId: optStr,
  shipmentDate: isoDate,
  quantity: z.number(),
  unitPrice: optNum,
  tankId: optStr,
  note: optStr,
});

export const oilShipmentUpdate = oilShipmentCreate.partial();

export const crProductionCreate = z.object({
  plantId: reqStr,
  productionDate: isoDate,
  inputMaterialId: optStr,
  inputQuantity: z.number(),
  note: optStr,
});

export const crProductionUpdate = crProductionCreate.partial().extend({
  status: z.string().optional(),
  lightOilOutput: optNum,
  heavyOilOutput: optNum,
  mixedOilOutput: optNum,
  residueOutput: optNum,
});

export const residueCreate = z.object({
  productionOrderId: optStr,
  quantity: z.number(),
  disposalMethod: optStr,
  disposalDate: optDate,
  disposalPartner: optStr,
  cost: optNum,
  note: optStr,
});

export const residueUpdate = residueCreate.partial();

export const tankCreate = z.object({
  code: reqStr,
  name: reqStr,
  type: reqStr,
  plantId: reqStr,
  capacity: z.number(),
});

export const tankUpdate = tankCreate.partial().omit({ code: true });

// ============================================================
// Lab
// ============================================================

export const labSampleCreate = z.object({
  sampleName: reqStr,
  productId: optStr,
  source: optStr,
  receivedDate: optDate,
  note: optStr,
});

export const labSampleUpdate = labSampleCreate.partial().extend({
  status: z.string().optional(),
});

export const analysisCreate = z.object({
  sampleId: reqStr,
  testItem: reqStr,
  standard: optStr,
  result: optStr,
  unit: optStr,
  isPassed: optBool,
  analyzedBy: optStr,
  analyzedAt: optDate,
});

export const analysisUpdate = analysisCreate.partial();

export const certificateCreate = z.object({
  sampleId: reqStr,
  issueDate: optDate,
  note: optStr,
});

export const certificateUpdate = certificateCreate.partial();

export const externalAnalysisCreate = z.object({
  sampleId: reqStr,
  labName: reqStr,
  requestDate: optDate,
  expectedDate: optDate,
  cost: optNum,
  note: optStr,
});

export const externalAnalysisUpdate = externalAnalysisCreate.partial().extend({
  status: z.string().optional(),
  resultDate: optDate,
  resultSummary: optStr,
});

// ============================================================
// Other
// ============================================================

export const approvalCreate = z.object({
  category: reqStr,
  targetType: optStr,
  targetId: optStr,
  title: reqStr,
  description: optStr,
  createdBy: reqStr,
  steps: z.array(z.object({
    stepOrder: z.number(),
    approverId: reqStr,
  })).optional(),
});

export const approvalAction = z.object({
  action: z.enum(["approve", "reject"]),
  stepId: z.string().optional(),
  comment: optStr,
});

export const approvalUpdate = z.object({
  title: z.string().optional(),
  description: optStr,
  status: z.string().optional(),
});

export const contractCreate = z.object({
  partnerId: reqStr,
  contractType: reqStr,
  title: reqStr,
  startDate: isoDate,
  endDate: optDate,
  amount: optNum,
  currency: z.string().default("JPY"),
  autoRenew: optBool,
  note: optStr,
});

export const contractUpdate = contractCreate.partial().extend({
  status: z.string().optional(),
});

export const expenseCreate = z.object({
  title: reqStr,
  applicantId: reqStr,
  department: optStr,
  expenseDate: isoDate,
  note: optStr,
  items: z.array(z.object({
    category: reqStr,
    description: reqStr,
    amount: z.number(),
    taxRate: z.number().optional(),
    receipt: optBool,
  })).optional(),
});

export const expenseUpdate = expenseCreate.partial().extend({
  items: z.array(z.object({
    category: reqStr,
    description: reqStr,
    amount: z.number(),
    taxRate: z.number().optional(),
    receipt: optBool,
  })).optional(),
});

export const assetCreate = z.object({
  name: reqStr,
  category: reqStr,
  acquisitionDate: isoDate,
  acquisitionCost: z.number(),
  usefulLife: z.number(),
  depreciationMethod: z.string().default("STRAIGHT_LINE"),
  location: optStr,
  department: optStr,
  note: optStr,
});

export const assetUpdate = assetCreate.partial();

export const ctsCreate = z.object({
  transactionType: reqStr,
  fromEntity: reqStr,
  toEntity: reqStr,
  productId: optStr,
  quantity: optNum,
  unitPrice: optNum,
  amount: optNum,
  transactionDate: isoDate,
  currency: z.string().default("JPY"),
  note: optStr,
});

export const ctsUpdate = ctsCreate.partial();

export const isccCertCreate = z.object({
  partnerId: optStr,
  certificateNumber: reqStr,
  issueDate: isoDate,
  expiryDate: optDate,
  scope: optStr,
  status: z.string().default("VALID"),
  note: optStr,
});

export const isccCertUpdate = isccCertCreate.partial();

export const sdCreate = z.object({
  isccCertificateId: optStr,
  declarationNumber: reqStr,
  issueDate: isoDate,
  productId: optStr,
  quantity: optNum,
  sustainabilityInfo: z.any().optional(),
  note: optStr,
});

export const sdUpdate = sdCreate.partial();

export const traceCreate = z.object({
  sourceType: reqStr,
  sourceId: reqStr,
  stages: z.array(z.object({
    stageName: reqStr,
    stageOrder: z.number(),
    inputType: optStr,
    inputId: optStr,
    outputType: optStr,
    outputId: optStr,
    note: optStr,
  })).optional(),
});

export const traceUpdate = z.object({
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
});

export const subsidyCreate = z.object({
  name: reqStr,
  category: optStr,
  applicationDate: optDate,
  amount: optNum,
  status: z.string().default("DRAFT"),
  note: optStr,
});

export const subsidyUpdate = subsidyCreate.partial();

export const productionCalendarCreate = z.union([
  z.array(z.object({
    date: isoDate,
    plantId: reqStr,
    isOperating: z.boolean(),
    shift: optStr,
    note: optStr,
  })),
  z.object({
    date: isoDate,
    plantId: reqStr,
    isOperating: z.boolean(),
    shift: optStr,
    note: optStr,
  }),
]);

export const productionCalendarUpdate = z.object({
  isOperating: z.boolean().optional(),
  shift: optStr,
  note: optStr,
});

export const userCreate = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: reqStr,
  roleId: reqStr,
  department: optStr,
  position: optStr,
});

export const userUpdate = userCreate.partial();

export const notificationReadAll = z.object({}).optional();

// ============================================================
// Business Cards (名刺管理)
// ============================================================

export const businessCardCreate = z.object({
  companyName: optStr,
  department: optStr,
  position: optStr,
  personName: reqStr,
  email: optStr,
  phone: optStr,
  mobile: optStr,
  fax: optStr,
  address: optStr,
  website: optStr,
  imageUrl: optStr,
  note: optStr,
  partnerId: optStr,
  status: z.string().default("NEW"),
});

export const businessCardUpdate = businessCardCreate.partial();

// ============================================================
// Admin Calendar Events (管理カレンダー)
// ============================================================

export const adminCalendarEventCreate = z.object({
  title: reqStr,
  description: optStr,
  dueDate: isoDate,
  category: reqStr,
  priority: z.string().default("MEDIUM"),
  assignee: optStr,
  note: optStr,
});

export const adminCalendarEventUpdate = adminCalendarEventCreate.partial().extend({
  isCompleted: z.boolean().optional(),
});
