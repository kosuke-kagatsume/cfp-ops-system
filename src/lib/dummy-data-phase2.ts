// Phase 2 販売管理 + CR事業部 + 研究室 ダミーデータ

// === 販売管理 ===
export type QuotationStatus = "下書き" | "申請中" | "承認済" | "却下";
export const quotations = [
  { id: "1", number: "QT-2026-0045", customer: "東洋プラスチック株式会社", date: "2026-03-08", validUntil: "2026-04-07", totalAmount: 1850000, currency: "JPY", status: "承認済" as QuotationStatus, approvedBy: "高橋 健二", items: [{ product: "PP-PEL-N-A1", name: "PP ペレット ナチュラル A級", qty: 10000, price: 185 }] },
  { id: "2", number: "QT-2026-0046", customer: "関西化学工業株式会社", date: "2026-03-10", validUntil: "2026-04-09", totalAmount: 504000, currency: "JPY", status: "申請中" as QuotationStatus, approvedBy: null, items: [{ product: "PMMA-FLM-YL-B1", name: "PMMA フィルム 黄 B級", qty: 2400, price: 210 }] },
  { id: "3", number: "QT-2026-0047", customer: "HINDUSTAN POLYMERS PVT. LTD.", date: "2026-03-11", validUntil: "2026-04-10", totalAmount: 17000, currency: "USD", status: "下書き" as QuotationStatus, approvedBy: null, items: [{ product: "PP-PEL-N-A1", name: "PP Pellet Natural Grade A", qty: 20000, price: 850 }] },
  { id: "4", number: "QT-2026-0044", customer: "株式会社丸紅プラスチック", date: "2026-03-05", validUntil: "2026-04-04", totalAmount: 376200, currency: "JPY", status: "承認済" as QuotationStatus, approvedBy: "福田 奈美絵", items: [{ product: "ABS-PEL-BK-A1", name: "ABS ペレット 黒 A級", qty: 2280, price: 165 }] },
];
export const quotationStatusColors: Record<QuotationStatus, string> = { "下書き": "bg-gray-50 text-gray-700", "申請中": "bg-amber-50 text-amber-700", "承認済": "bg-emerald-50 text-emerald-700", "却下": "bg-red-50 text-red-700" };

export type OrderStatus = "登録済" | "出荷中" | "完了";
export const orders = [
  { id: "1", orderNumber: "ORD-2026-0112", contractNumber: "CT-2026-0089", customer: "東洋プラスチック株式会社", orderDate: "2026-03-09", deliveryDate: "2026-03-15", product: "PP-PEL-N-A1", productName: "PP ペレット ナチュラル A級", quantity: 10000, unitPrice: 185, amount: 1850000, status: "出荷中" as OrderStatus },
  { id: "2", orderNumber: "ORD-2026-0113", contractNumber: "CT-2026-0090", customer: "株式会社丸紅プラスチック", orderDate: "2026-03-10", deliveryDate: "2026-03-14", product: "ABS-PEL-BK-A1", productName: "ABS ペレット 黒 A級", quantity: 2280, unitPrice: 165, amount: 376200, status: "登録済" as OrderStatus },
  { id: "3", orderNumber: "ORD-2026-0111", contractNumber: "CT-2026-0088", customer: "関西化学工業株式会社", orderDate: "2026-03-05", deliveryDate: "2026-03-10", product: "PS-PEL-W-A1", productName: "PS ペレット 白 A級", quantity: 4100, unitPrice: 175, amount: 717500, status: "完了" as OrderStatus },
  { id: "4", orderNumber: "ORD-2026-0114", contractNumber: "CT-2026-0091", customer: "HINDUSTAN POLYMERS PVT. LTD.", orderDate: "2026-03-11", deliveryDate: "2026-04-05", product: "PP-PEL-N-A1", productName: "PP Pellet Natural Grade A", quantity: 20000, unitPrice: 850, amount: 17000, status: "登録済" as OrderStatus },
];
export const orderStatusColors: Record<OrderStatus, string> = { "登録済": "bg-blue-50 text-blue-700", "出荷中": "bg-amber-50 text-amber-700", "完了": "bg-emerald-50 text-emerald-700" };

export type Site = "cfp_resin" | "cfp_oil" | "re";
export const siteLabels: Record<Site, string> = { cfp_resin: "CFP樹脂", cfp_oil: "CFP油化", re: "RE" };
export const siteColors: Record<Site, string> = { cfp_resin: "bg-blue-50 text-blue-700", cfp_oil: "bg-amber-50 text-amber-700", re: "bg-purple-50 text-purple-700" };

export type RevenueStatus = "計上" | "請求済" | "入金済";
export const revenues = [
  { id: "1", number: "SL-2026-0234", site: "cfp_resin" as Site, customer: "東洋プラスチック株式会社", salesDate: "2026-03-10", shipmentDate: "2026-03-10", deliveryDate: "2026-03-11", product: "PP-PEL-N-A1", quantity: 5000, unitPrice: 185, amount: 925000, tax: 92500, status: "計上" as RevenueStatus },
  { id: "2", number: "SL-2026-0233", site: "cfp_resin" as Site, customer: "関西化学工業株式会社", salesDate: "2026-03-08", shipmentDate: "2026-03-08", deliveryDate: "2026-03-09", product: "PS-PEL-W-A1", quantity: 4100, unitPrice: 175, amount: 717500, tax: 71750, status: "請求済" as RevenueStatus },
  { id: "3", number: "SL-2026-0232", site: "cfp_oil" as Site, customer: "関西化学工業株式会社", salesDate: "2026-03-05", shipmentDate: "2026-03-05", deliveryDate: "2026-03-06", product: "CPO-LIQ-N-OIL", quantity: 19000, unitPrice: 95, amount: 1805000, tax: 180500, status: "入金済" as RevenueStatus },
  { id: "4", number: "SL-2026-0231", site: "re" as Site, customer: "株式会社CFP", salesDate: "2026-03-01", shipmentDate: "2026-03-01", deliveryDate: "2026-03-01", product: "加工賃（ルーダー）", quantity: 5000, unitPrice: 15, amount: 75000, tax: 7500, status: "請求済" as RevenueStatus },
  { id: "5", number: "SL-2026-0235", site: "cfp_resin" as Site, customer: "HINDUSTAN POLYMERS PVT. LTD.", salesDate: "2026-03-10", shipmentDate: "2026-03-10", deliveryDate: "2026-03-25", product: "PP-PEL-N-A1", quantity: 20000, unitPrice: 850, amount: 17000, tax: 0, status: "計上" as RevenueStatus },
];
export const revenueStatusColors: Record<RevenueStatus, string> = { "計上": "bg-blue-50 text-blue-700", "請求済": "bg-amber-50 text-amber-700", "入金済": "bg-emerald-50 text-emerald-700" };

export type InvoiceStatus = "下書き" | "発行済" | "送付済" | "入金済";
export const invoices = [
  { id: "1", number: "INV-2026-0089", customer: "東洋プラスチック株式会社", site: "cfp_resin" as Site, closingDate: "2026-03-15", issueDate: "2026-03-16", dueDate: "2026-04-30", prevBalance: 1250000, paymentReceived: 1250000, carryover: 0, subtotal: 925000, tax: 92500, total: 1017500, status: "発行済" as InvoiceStatus },
  { id: "2", number: "INV-2026-0088", customer: "関西化学工業株式会社", site: "cfp_resin" as Site, closingDate: "2026-03-20", issueDate: "2026-03-21", dueDate: "2026-04-30", prevBalance: 789250, paymentReceived: 789250, carryover: 0, subtotal: 717500, tax: 71750, total: 789250, status: "送付済" as InvoiceStatus },
  { id: "3", number: "INV-2026-0087", customer: "関西化学工業株式会社", site: "cfp_oil" as Site, closingDate: "2026-02-28", issueDate: "2026-03-01", dueDate: "2026-03-31", prevBalance: 0, paymentReceived: 0, carryover: 0, subtotal: 1805000, tax: 180500, total: 1985500, status: "入金済" as InvoiceStatus },
];
export const invoiceStatusColors: Record<InvoiceStatus, string> = { "下書き": "bg-gray-50 text-gray-700", "発行済": "bg-blue-50 text-blue-700", "送付済": "bg-amber-50 text-amber-700", "入金済": "bg-emerald-50 text-emerald-700" };

export type PaymentReceivedStatus = "未消込" | "消込済" | "確定";
export const paymentsReceived = [
  { id: "1", customer: "関西化学工業株式会社", date: "2026-03-10", amount: 1985500, bankRef: "MUFG-0310-001", matchedInvoice: "INV-2026-0087", status: "確定" as PaymentReceivedStatus },
  { id: "2", customer: "東洋プラスチック株式会社", date: "2026-03-10", amount: 1250000, bankRef: "MUFG-0310-002", matchedInvoice: "INV-2026-0085", status: "確定" as PaymentReceivedStatus },
  { id: "3", customer: "関西化学工業株式会社", date: "2026-03-15", amount: 789250, bankRef: "MUFG-0315-001", matchedInvoice: "INV-2026-0088", status: "消込済" as PaymentReceivedStatus },
  { id: "4", customer: "株式会社丸紅プラスチック", date: "2026-03-11", amount: 550000, bankRef: "MUFG-0311-001", matchedInvoice: null, status: "未消込" as PaymentReceivedStatus },
];

export type ClosingStatus = "オープン" | "クローズ";
export const monthlyClosings = [
  { yearMonth: "2026-03", status: "オープン" as ClosingStatus, salesCount: 5, salesTotal: 3522500, invoiceCount: 2, invoiceTotal: 1806750, paymentCount: 4, paymentTotal: 4574750 },
  { yearMonth: "2026-02", status: "クローズ" as ClosingStatus, salesCount: 18, salesTotal: 12450000, invoiceCount: 8, invoiceTotal: 13695000, paymentCount: 12, paymentTotal: 11200000 },
  { yearMonth: "2026-01", status: "クローズ" as ClosingStatus, salesCount: 22, salesTotal: 15680000, invoiceCount: 10, invoiceTotal: 17248000, paymentCount: 15, paymentTotal: 14500000 },
];

export const exchangeRates = [
  { id: "1", pair: "USD/JPY", rate: 150.25, yearMonth: "2026-03", updatedBy: "山田 花子", updatedAt: "2026-03-01" },
  { id: "2", pair: "SGD/JPY", rate: 112.80, yearMonth: "2026-03", updatedBy: "山田 花子", updatedAt: "2026-03-01" },
  { id: "3", pair: "USD/SGD", rate: 1.332, yearMonth: "2026-03", updatedBy: "山田 花子", updatedAt: "2026-03-01" },
  { id: "4", pair: "USD/JPY", rate: 149.50, yearMonth: "2026-02", updatedBy: "山田 花子", updatedAt: "2026-02-01" },
  { id: "5", pair: "SGD/JPY", rate: 111.90, yearMonth: "2026-02", updatedBy: "山田 花子", updatedAt: "2026-02-01" },
  { id: "6", pair: "USD/SGD", rate: 1.336, yearMonth: "2026-02", updatedBy: "山田 花子", updatedAt: "2026-02-01" },
];

export const freightItems = [
  { id: "1", shipmentNumber: "SHP-2026-0156", carrier: "中国運輸株式会社", route: "高松→川崎", amount: 45000, date: "2026-03-12", approved: false },
  { id: "2", shipmentNumber: "SHP-2026-0155", carrier: "中国運輸株式会社", route: "美の浜→大阪", amount: 28000, date: "2026-03-11", approved: true },
  { id: "3", shipmentNumber: "SHP-2026-0152", carrier: "中国運輸株式会社", route: "四日市→川崎", amount: 52000, date: "2026-03-09", approved: true },
  { id: "4", shipmentNumber: "SHP-2026-0151", carrier: "中国運輸株式会社", route: "美の浜→大阪", amount: 28000, date: "2026-03-08", approved: true },
];

// === CR事業部 ===
export type CrMaterialStatus = "受入待ち" | "検査中" | "合格" | "不合格";
export const crMaterials = [
  { id: "1", lotNumber: "CR-260312-01", supplier: "九州リサイクル株式会社", product: "PP廃プラスチック", quantity: 8000, unit: "kg", receiveDate: "2026-03-12", isIscCertified: true, isccNumber: "ISCC-EU-123456", sdNumber: "CFP-000190-CA", status: "受入待ち" as CrMaterialStatus },
  { id: "2", lotNumber: "CR-260311-01", supplier: "広島産業廃棄物処理株式会社", product: "PE混合廃プラ", quantity: 5500, unit: "kg", receiveDate: "2026-03-11", isIscCertified: false, isccNumber: null, sdNumber: null, status: "合格" as CrMaterialStatus },
  { id: "3", lotNumber: "CR-260310-01", supplier: "九州リサイクル株式会社", product: "PS廃プラスチック", quantity: 6200, unit: "kg", receiveDate: "2026-03-10", isIscCertified: true, isccNumber: "ISCC-EU-123457", sdNumber: "CFP-000191-CA", status: "合格" as CrMaterialStatus },
];
export const crMaterialStatusColors: Record<CrMaterialStatus, string> = { "受入待ち": "bg-gray-50 text-gray-700", "検査中": "bg-amber-50 text-amber-700", "合格": "bg-emerald-50 text-emerald-700", "不合格": "bg-red-50 text-red-700" };

export type ProductionOrderStatus = "指示済" | "投入中" | "生産中" | "完了";
export const crProductionOrders = [
  { id: "1", orderNumber: "CPO-2026-0034", plant: "岡山ケミカルセンター", date: "2026-03-12", inputLots: ["CR-260311-01", "CR-260310-01"], inputTotal: 11700, outputOil: null, outputResidue: null, yieldRate: null, status: "指示済" as ProductionOrderStatus, operator: "佐藤 次郎", instructions: "投入比率 PE:PS = 47:53、温度450℃" },
  { id: "2", orderNumber: "CPO-2026-0033", plant: "岡山ケミカルセンター", date: "2026-03-11", inputLots: ["CR-260309-01"], inputTotal: 7800, outputOil: 5850, outputResidue: 390, yieldRate: 75.0, status: "完了" as ProductionOrderStatus, operator: "佐藤 次郎", instructions: "PP単独投入、温度430℃" },
  { id: "3", orderNumber: "CPO-2026-0032", plant: "美の浜工場", date: "2026-03-10", inputLots: ["CR-260308-01"], inputTotal: 6000, outputOil: 4620, outputResidue: 240, yieldRate: 77.0, status: "完了" as ProductionOrderStatus, operator: "田中 美咲", instructions: "PE/PP混合、温度440℃" },
];
export const crProductionStatusColors: Record<ProductionOrderStatus, string> = { "指示済": "bg-gray-50 text-gray-700", "投入中": "bg-blue-50 text-blue-700", "生産中": "bg-amber-50 text-amber-700", "完了": "bg-emerald-50 text-emerald-700" };

export type TankType = "軽質油" | "重質油" | "混合油" | "残渣";
export const tanks = [
  { id: "1", code: "TK-01", name: "軽質油タンクA", plant: "岡山ケミカルセンター", type: "軽質油" as TankType, capacityKl: 50, currentKl: 32.5, currentKg: 26000, specificGravity: 0.80, percentage: 65 },
  { id: "2", code: "TK-02", name: "軽質油タンクB", plant: "岡山ケミカルセンター", type: "軽質油" as TankType, capacityKl: 50, currentKl: 12.0, currentKg: 9600, specificGravity: 0.80, percentage: 24 },
  { id: "3", code: "TK-03", name: "重質油タンク", plant: "岡山ケミカルセンター", type: "重質油" as TankType, capacityKl: 30, currentKl: 18.5, currentKg: 16650, specificGravity: 0.90, percentage: 62 },
  { id: "4", code: "TK-04", name: "混合油タンク", plant: "岡山ケミカルセンター", type: "混合油" as TankType, capacityKl: 40, currentKl: 8.2, currentKg: 6970, specificGravity: 0.85, percentage: 21 },
  { id: "5", code: "TK-05", name: "残渣タンク", plant: "岡山ケミカルセンター", type: "残渣" as TankType, capacityKl: 20, currentKl: 14.0, currentKg: 15400, specificGravity: 1.10, percentage: 70 },
  { id: "6", code: "TK-06", name: "軽質油タンク", plant: "美の浜工場", type: "軽質油" as TankType, capacityKl: 30, currentKl: 22.0, currentKg: 17600, specificGravity: 0.80, percentage: 73 },
];
export const tankTypeColors: Record<TankType, string> = { "軽質油": "bg-yellow-100 text-yellow-800", "重質油": "bg-orange-100 text-orange-800", "混合油": "bg-blue-100 text-blue-800", "残渣": "bg-gray-200 text-gray-800" };

export const oilShipments = [
  { id: "1", number: "OIL-2026-0045", customer: "関西化学工業株式会社", product: "Circular Pyrolysis Oil（軽質）", quantity: 19000, unit: "kg", vehicleType: "ローリー 10t", date: "2026-03-12", tank: "TK-01", analysisLot: "260312-TC", sdNumber: "CFP-000192-CA", status: "出荷準備" },
  { id: "2", number: "OIL-2026-0044", customer: "関西化学工業株式会社", product: "Circular Pyrolysis Oil（軽質）", quantity: 19000, unit: "kg", vehicleType: "ISOコンテナ 19t", date: "2026-03-10", tank: "TK-02", analysisLot: "260310-TC", sdNumber: "CFP-000191-CA", status: "出荷完了" },
  { id: "3", number: "OIL-2026-0043", customer: "株式会社丸紅プラスチック", product: "Circular Pyrolysis Oil（混合）", quantity: 10000, unit: "kg", vehicleType: "ローリー 10t", date: "2026-03-08", tank: "TK-04", analysisLot: "260308-TC", sdNumber: "CFP-000190-CA", status: "出荷完了" },
];

// === 研究室 ===
export type SampleStatus = "受付済" | "分析中" | "判定済" | "報告済";
export const labSamples = [
  { id: "1", sampleId: "SA-2026-0189", lot: "260312-TC", product: "Circular Pyrolysis Oil（軽質）", process: "岡ケミ CR装置", requestDate: "2026-03-12", status: "受付済" as SampleStatus, assignedTo: "中村 理恵" },
  { id: "2", sampleId: "SA-2026-0188", lot: "260311-TC", product: "Circular Pyrolysis Oil（軽質）", process: "岡ケミ CR装置", requestDate: "2026-03-11", status: "分析中" as SampleStatus, assignedTo: "中村 理恵" },
  { id: "3", sampleId: "SA-2026-0187", lot: "260310-TC", product: "Circular Pyrolysis Oil（混合）", process: "美の浜 CR装置", requestDate: "2026-03-10", status: "判定済" as SampleStatus, assignedTo: "中村 理恵", result: "合格" },
  { id: "4", sampleId: "SA-2026-0186", lot: "260308-TC", product: "Circular Pyrolysis Oil（軽質）", process: "岡ケミ CR装置", requestDate: "2026-03-08", status: "報告済" as SampleStatus, assignedTo: "中村 理恵", result: "合格" },
];
export const sampleStatusColors: Record<SampleStatus, string> = { "受付済": "bg-gray-50 text-gray-700", "分析中": "bg-blue-50 text-blue-700", "判定済": "bg-amber-50 text-amber-700", "報告済": "bg-emerald-50 text-emerald-700" };

export const analysisResults = [
  { id: "1", sampleId: "SA-2026-0187", items: [
    { name: "比重 (15℃)", value: "0.812", unit: "", spec: "0.78-0.85", pass: true },
    { name: "動粘度 (40℃)", value: "2.15", unit: "mm²/s", spec: "≤5.0", pass: true },
    { name: "硫黄分", value: "0.008", unit: "%", spec: "≤0.05", pass: true },
    { name: "引火点", value: "42", unit: "℃", spec: "≥21", pass: true },
    { name: "水分", value: "0.03", unit: "%", spec: "≤0.1", pass: true },
    { name: "残留塩素", value: "15", unit: "ppm", spec: "≤100", pass: true },
  ], judgment: "合格" as const },
];
