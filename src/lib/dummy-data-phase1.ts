// Phase 1 MR事業部 UIモック用ダミーデータ

export type PurchaseStatus = "予定" | "入荷済" | "検査済" | "確定" | "返品";

export const purchases = [
  { id: "1", purchaseNumber: "PUR-2026-0312", supplier: "九州リサイクル株式会社", collectionSource: "福岡第一工場", plant: "美の浜工場", warehouse: "美の浜第1倉庫", date: "2026-03-12", product: "PP-CRS-W-B1", productName: "PP 粉砕 白 B級", quantity: 3200, unit: "kg", unitPrice: 85, amount: 272000, freight: 35000, status: "予定" as PurchaseStatus, packaging: "フレコン", lotNumber: "L260312-01" },
  { id: "2", purchaseNumber: "PUR-2026-0311", supplier: "広島産業廃棄物処理株式会社", collectionSource: "広島工場", plant: "四日市工場", warehouse: "四日市第1倉庫", date: "2026-03-11", product: "PE-FLM-N-A2", productName: "PE フィルム ナチュラル A級", quantity: 1800, unit: "kg", unitPrice: 45, amount: 81000, freight: 28000, status: "入荷済" as PurchaseStatus, packaging: "パレット", lotNumber: "L260311-01" },
  { id: "3", purchaseNumber: "PUR-2026-0310", supplier: "九州リサイクル株式会社", collectionSource: "北九州支店", plant: "高松工場", warehouse: "高松倉庫", date: "2026-03-10", product: "PP-PEL-N-A1", productName: "PP ペレット ナチュラル A級", quantity: 5000, unit: "kg", unitPrice: 120, amount: 600000, freight: 42000, status: "検査済" as PurchaseStatus, packaging: "フレコン", lotNumber: "L260310-01" },
  { id: "4", purchaseNumber: "PUR-2026-0309", supplier: "北陸ポリマー株式会社", collectionSource: "金沢本社", plant: "美の浜工場", warehouse: "美の浜第2倉庫", date: "2026-03-09", product: "ABS-INJ-BK-A1", productName: "ABS 射出 黒 A級", quantity: 2400, unit: "kg", unitPrice: 95, amount: 228000, freight: 32000, status: "確定" as PurchaseStatus, packaging: "スチール箱", lotNumber: "L260309-01" },
  { id: "5", purchaseNumber: "PUR-2026-0308", supplier: "広島産業廃棄物処理株式会社", collectionSource: "広島工場", plant: "美の浜工場", warehouse: "美の浜第1倉庫", date: "2026-03-08", product: "PMMA-FLM-YL-B1", productName: "PMMA フィルム 黄 B級", quantity: 1200, unit: "kg", unitPrice: 65, amount: 78000, freight: 25000, status: "確定" as PurchaseStatus, packaging: "パレット", lotNumber: "L260308-01" },
  { id: "6", purchaseNumber: "PUR-2026-0307", supplier: "九州リサイクル株式会社", collectionSource: "福岡第一工場", plant: "四日市工場", warehouse: "四日市第2倉庫", date: "2026-03-07", product: "PET-FLK-MIX-C1", productName: "PET フレーク 混合色 C級", quantity: 4500, unit: "kg", unitPrice: 30, amount: 135000, freight: 38000, status: "確定" as PurchaseStatus, packaging: "フレコン", lotNumber: "L260307-01" },
];

export const purchaseStatusColors: Record<PurchaseStatus, string> = {
  "予定": "bg-gray-50 text-gray-700",
  "入荷済": "bg-blue-50 text-blue-700",
  "検査済": "bg-amber-50 text-amber-700",
  "確定": "bg-emerald-50 text-emerald-700",
  "返品": "bg-red-50 text-red-700",
};

export const inventoryItems = [
  { id: "1", warehouse: "美の浜第1倉庫", plant: "美の浜工場", collectionSource: "九州リサイクル 福岡第一", product: "PP-CRS-W-B1", productName: "PP 粉砕 白 B級", packaging: "フレコン", quantity: 12500, unitCost: 92, totalCost: 1150000 },
  { id: "2", warehouse: "美の浜第1倉庫", plant: "美の浜工場", collectionSource: "広島産廃処理 広島工場", product: "PMMA-FLM-YL-B1", productName: "PMMA フィルム 黄 B級", packaging: "パレット", quantity: 3400, unitCost: 72, totalCost: 244800 },
  { id: "3", warehouse: "美の浜第2倉庫", plant: "美の浜工場", collectionSource: "北陸ポリマー 金沢本社", product: "ABS-INJ-BK-A1", productName: "ABS 射出 黒 A級", packaging: "スチール箱", quantity: 8200, unitCost: 105, totalCost: 861000 },
  { id: "4", warehouse: "高松倉庫", plant: "高松工場", collectionSource: "九州リサイクル 北九州支店", product: "PP-PEL-N-A1", productName: "PP ペレット ナチュラル A級", packaging: "フレコン", quantity: 18700, unitCost: 135, totalCost: 2524500 },
  { id: "5", warehouse: "四日市第1倉庫", plant: "四日市工場", collectionSource: "広島産廃処理 広島工場", product: "PE-FLM-N-A2", productName: "PE フィルム ナチュラル A級", packaging: "パレット", quantity: 6300, unitCost: 58, totalCost: 365400 },
  { id: "6", warehouse: "四日市第2倉庫", plant: "四日市工場", collectionSource: "九州リサイクル 福岡第一", product: "PET-FLK-MIX-C1", productName: "PET フレーク 混合色 C級", packaging: "フレコン", quantity: 15200, unitCost: 38, totalCost: 577600 },
  { id: "7", warehouse: "岡ケミ第1倉庫", plant: "岡山ケミカルセンター", collectionSource: "九州リサイクル 福岡第一", product: "PP-CRS-W-B1", productName: "PP 粉砕 白 B級（油化用）", packaging: "フレコン", quantity: 9800, unitCost: 88, totalCost: 862400 },
  { id: "8", warehouse: "美の浜第1倉庫", plant: "美の浜工場", collectionSource: "九州リサイクル 北九州支店", product: "PS-PEL-W-A1", productName: "PS ペレット 白 A級", packaging: "紙袋", quantity: 4100, unitCost: 115, totalCost: 471500 },
];

export type ProcessType = "ルーダー" | "破砕" | "積替" | "詰替" | "研磨" | "リロール" | "ミミ巻き";
export type ProcessStatus = "計画" | "作業中" | "完了";

export const processingOrders = [
  { id: "1", orderNumber: "PRO-2026-0089", plant: "高松工場", processType: "ルーダー" as ProcessType, scheduledDate: "2026-03-12", status: "計画" as ProcessStatus, inputProduct: "PP-CRS-W-B1", inputProductName: "PP 粉砕 白 B級", inputQuantity: 5000, outputProduct: "PP-PEL-W-A1", outputProductName: "PP ペレット 白 A級", outputQuantity: null, yieldRate: null, instructions: "温度設定: 220℃、スクリュー回転数: 150rpm" },
  { id: "2", orderNumber: "PRO-2026-0088", plant: "高松工場", processType: "ルーダー" as ProcessType, scheduledDate: "2026-03-11", status: "作業中" as ProcessStatus, inputProduct: "PE-FLM-N-A2", inputProductName: "PE フィルム ナチュラル A級", inputQuantity: 3000, outputProduct: "PE-PEL-N-A1", outputProductName: "PE ペレット ナチュラル A級", outputQuantity: null, yieldRate: null, instructions: "温度設定: 180℃" },
  { id: "3", orderNumber: "PRO-2026-0087", plant: "美の浜工場", processType: "ルーダー" as ProcessType, scheduledDate: "2026-03-10", status: "完了" as ProcessStatus, inputProduct: "ABS-INJ-BK-A1", inputProductName: "ABS 射出 黒 A級", inputQuantity: 2400, outputProduct: "ABS-PEL-BK-A1", outputProductName: "ABS ペレット 黒 A級", outputQuantity: 2280, yieldRate: 95.0, instructions: "温度設定: 230℃" },
  { id: "4", orderNumber: "PRO-2026-0086", plant: "四日市工場", processType: "破砕" as ProcessType, scheduledDate: "2026-03-10", status: "完了" as ProcessStatus, inputProduct: "PP-INJ-N-B1", inputProductName: "PP 射出 ナチュラル B級", inputQuantity: 4000, outputProduct: "PP-CRS-N-B1", outputProductName: "PP 粉砕 ナチュラル B級", outputQuantity: 3920, yieldRate: 98.0, instructions: "メッシュ: 15mm" },
  { id: "5", orderNumber: "PRO-2026-0085", plant: "美の浜工場", processType: "詰替" as ProcessType, scheduledDate: "2026-03-09", status: "完了" as ProcessStatus, inputProduct: "PP-PEL-N-A1", inputProductName: "PP ペレット ナチュラル A級", inputQuantity: 1000, outputProduct: "PP-PEL-N-A1", outputProductName: "PP ペレット ナチュラル A級", outputQuantity: 995, yieldRate: 99.5, instructions: "フレコン→紙袋25kg×40袋" },
];

export const processStatusColors: Record<ProcessStatus, string> = {
  "計画": "bg-gray-50 text-gray-700",
  "作業中": "bg-blue-50 text-blue-700",
  "完了": "bg-emerald-50 text-emerald-700",
};

export type CalendarEventType = "生産" | "工事" | "休み" | "その他";

export const calendarEvents = [
  { id: "1", plant: "高松工場", date: "2026-03-10", type: "生産" as CalendarEventType, details: "PP ルーダー稼働（PP-CRS-W-B1 → PP-PEL-W-A1）" },
  { id: "2", plant: "高松工場", date: "2026-03-11", type: "生産" as CalendarEventType, details: "PE ルーダー稼働（PE-FLM-N-A2 → PE-PEL-N-A1）" },
  { id: "3", plant: "高松工場", date: "2026-03-12", type: "生産" as CalendarEventType, details: "PP ルーダー稼働（PP-CRS-W-B1 → PP-PEL-W-A1）" },
  { id: "4", plant: "高松工場", date: "2026-03-13", type: "工事" as CalendarEventType, details: "ルーダー定期メンテナンス" },
  { id: "5", plant: "高松工場", date: "2026-03-14", type: "休み" as CalendarEventType, details: "定休日" },
  { id: "6", plant: "高松工場", date: "2026-03-15", type: "休み" as CalendarEventType, details: "定休日" },
  { id: "7", plant: "高松工場", date: "2026-03-16", type: "生産" as CalendarEventType, details: "ABS ルーダー稼働" },
  { id: "8", plant: "美の浜工場", date: "2026-03-10", type: "生産" as CalendarEventType, details: "ABS ルーダー稼働（ABS-INJ-BK-A1 → ABS-PEL-BK-A1）" },
  { id: "9", plant: "美の浜工場", date: "2026-03-11", type: "生産" as CalendarEventType, details: "PMMA 粉砕加工" },
  { id: "10", plant: "美の浜工場", date: "2026-03-12", type: "その他" as CalendarEventType, details: "来客対応（東洋プラスチック様 工場見学）" },
  { id: "11", plant: "美の浜工場", date: "2026-03-13", type: "生産" as CalendarEventType, details: "PP ペレット詰替作業" },
  { id: "12", plant: "四日市工場", date: "2026-03-10", type: "生産" as CalendarEventType, details: "PP 破砕加工" },
  { id: "13", plant: "四日市工場", date: "2026-03-11", type: "生産" as CalendarEventType, details: "PE 破砕加工" },
  { id: "14", plant: "四日市工場", date: "2026-03-12", type: "休み" as CalendarEventType, details: "臨時休業" },
];

export const calendarEventColors: Record<CalendarEventType, string> = {
  "生産": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "工事": "bg-amber-100 text-amber-800 border-amber-300",
  "休み": "bg-red-100 text-red-800 border-red-300",
  "その他": "bg-blue-100 text-blue-800 border-blue-300",
};

export type ShipmentStatus = "出庫表作成" | "貨物選定" | "計量待ち" | "積込中" | "出荷完了";

export const shipments = [
  { id: "1", shipmentNumber: "SHP-2026-0156", customer: "東洋プラスチック株式会社", product: "PP-PEL-N-A1", productName: "PP ペレット ナチュラル A級", quantity: 5000, warehouse: "高松倉庫", shipDate: "2026-03-12", deliveryDate: "2026-03-13", status: "出庫表作成" as ShipmentStatus, carrier: "中国運輸株式会社", vehicleType: "10tウイング", deliveryNote: "CFP-22382-4022" },
  { id: "2", shipmentNumber: "SHP-2026-0155", customer: "関西化学工業株式会社", product: "PMMA-FLM-YL-B1", productName: "PMMA フィルム 黄 B級", quantity: 1200, warehouse: "美の浜第1倉庫", shipDate: "2026-03-11", deliveryDate: "2026-03-12", status: "貨物選定" as ShipmentStatus, carrier: "中国運輸株式会社", vehicleType: "4tウイング", deliveryNote: "CFP-22383-4023" },
  { id: "3", shipmentNumber: "SHP-2026-0154", customer: "株式会社丸紅プラスチック", product: "ABS-PEL-BK-A1", productName: "ABS ペレット 黒 A級", quantity: 2280, warehouse: "美の浜第2倉庫", shipDate: "2026-03-11", deliveryDate: "2026-03-12", status: "計量待ち" as ShipmentStatus, carrier: "自社手配", vehicleType: "4tユニック", deliveryNote: "CFP-22384-4024" },
  { id: "4", shipmentNumber: "SHP-2026-0153", customer: "HINDUSTAN POLYMERS PVT. LTD.", product: "PP-PEL-N-A1", productName: "PP ペレット ナチュラル A級", quantity: 20000, warehouse: "高松倉庫", shipDate: "2026-03-10", deliveryDate: "2026-03-25", status: "積込中" as ShipmentStatus, carrier: "顧客手配", vehicleType: "40ftコンテナ", deliveryNote: "HIND-CFP001/26-2" },
  { id: "5", shipmentNumber: "SHP-2026-0152", customer: "東洋プラスチック株式会社", product: "PE-FLM-N-A2", productName: "PE フィルム ナチュラル A級", quantity: 3000, warehouse: "四日市第1倉庫", shipDate: "2026-03-09", deliveryDate: "2026-03-10", status: "出荷完了" as ShipmentStatus, carrier: "中国運輸株式会社", vehicleType: "10tウイング", deliveryNote: "CFP-22381-4021" },
  { id: "6", shipmentNumber: "SHP-2026-0151", customer: "関西化学工業株式会社", product: "PS-PEL-W-A1", productName: "PS ペレット 白 A級", quantity: 4100, warehouse: "美の浜第1倉庫", shipDate: "2026-03-08", deliveryDate: "2026-03-09", status: "出荷完了" as ShipmentStatus, carrier: "中国運輸株式会社", vehicleType: "10tウイング", deliveryNote: "CFP-22380-4020" },
];

export const shipmentStatusColors: Record<ShipmentStatus, string> = {
  "出庫表作成": "bg-gray-50 text-gray-700",
  "貨物選定": "bg-blue-50 text-blue-700",
  "計量待ち": "bg-amber-50 text-amber-700",
  "積込中": "bg-purple-50 text-purple-700",
  "出荷完了": "bg-emerald-50 text-emerald-700",
};

export const dispatches = [
  { id: "1", shipmentNumber: "SHP-2026-0156", date: "2026-03-12", carrier: "中国運輸株式会社", vehicleType: "10tウイング", vehicleNumber: "福山 100 あ 1234", driverName: "山本 太郎", driverPhone: "090-1234-5678", pickup: "高松倉庫", delivery: "東洋プラスチック 川崎工場", freight: 45000, status: "手配済" },
  { id: "2", shipmentNumber: "SHP-2026-0155", date: "2026-03-11", carrier: "中国運輸株式会社", vehicleType: "4tウイング", vehicleNumber: "岡山 200 い 5678", driverName: "田中 一郎", driverPhone: "090-2345-6789", pickup: "美の浜第1倉庫", delivery: "関西化学工業 大阪工場", freight: 28000, status: "手配済" },
  { id: "3", shipmentNumber: "SHP-2026-0154", date: "2026-03-11", carrier: "自社手配", vehicleType: "4tユニック", vehicleNumber: "福山 300 う 9012", driverName: "佐藤 二郎", driverPhone: "090-3456-7890", pickup: "美の浜第2倉庫", delivery: "丸紅プラスチック 千葉倉庫", freight: 0, status: "配車待ち" },
  { id: "4", shipmentNumber: "SHP-2026-0153", date: "2026-03-10", carrier: "顧客手配", vehicleType: "40ftコンテナ", vehicleNumber: "MSKU1234567", driverName: "-", driverPhone: "-", pickup: "高松倉庫", delivery: "神戸港 → Mumbai, India", freight: 0, status: "手配済" },
];

export type DocumentType = "買受書" | "納品書（仮）" | "納品書（本）" | "送り状・受領書" | "引取連絡" | "運送指示書" | "搬入連絡" | "Invoice/PackingList" | "請求書";

export const documents = [
  { id: "1", type: "納品書（本）" as DocumentType, number: "CFP-22382-4022", date: "2026-03-10", partner: "東洋プラスチック株式会社", product: "PP ペレット ナチュラル A級", amount: "¥925,000", status: "発行済" },
  { id: "2", type: "請求書" as DocumentType, number: "INV-2026-0089", date: "2026-03-10", partner: "東洋プラスチック株式会社", product: "（3月前半分）", amount: "¥2,450,000", status: "発行済" },
  { id: "3", type: "買受書" as DocumentType, number: "0005618", date: "2026-03-09", partner: "関西化学工業株式会社", product: "PMMA フィルム 黄 B級", amount: "¥252,000", status: "発行済" },
  { id: "4", type: "Invoice/PackingList" as DocumentType, number: "HIND-CFP001/26-2", date: "2026-03-08", partner: "HINDUSTAN POLYMERS PVT. LTD.", product: "PP Pellet Natural Grade A", amount: "$17,000", status: "発行済" },
  { id: "5", type: "引取連絡" as DocumentType, number: "PU-2026-0312", date: "2026-03-12", partner: "九州リサイクル 福岡第一工場", product: "PP 粉砕 白 B級", amount: "-", status: "未発行" },
  { id: "6", type: "運送指示書" as DocumentType, number: "TR-2026-0156", date: "2026-03-12", partner: "中国運輸株式会社", product: "PP ペレット ナチュラル A級", amount: "¥45,000", status: "未発行" },
  { id: "7", type: "送り状・受領書" as DocumentType, number: "WB-2026-0155", date: "2026-03-11", partner: "関西化学工業 大阪工場", product: "PMMA フィルム 黄 B級", amount: "-", status: "作成中" },
  { id: "8", type: "搬入連絡" as DocumentType, number: "DL-2026-0311", date: "2026-03-11", partner: "CFP 美の浜工場", product: "PE フィルム ナチュラル A級", amount: "-", status: "発行済" },
  { id: "9", type: "納品書（仮）" as DocumentType, number: "0000685", date: "2026-03-11", partner: "関西化学工業株式会社", product: "Circular Pyrolysis Oil", amount: "¥1,890,000", status: "発行済" },
];

export const documentTypeColors: Record<DocumentType, string> = {
  "買受書": "bg-purple-50 text-purple-700",
  "納品書（仮）": "bg-blue-50 text-blue-700",
  "納品書（本）": "bg-blue-100 text-blue-800",
  "送り状・受領書": "bg-amber-50 text-amber-700",
  "引取連絡": "bg-emerald-50 text-emerald-700",
  "運送指示書": "bg-orange-50 text-orange-700",
  "搬入連絡": "bg-teal-50 text-teal-700",
  "Invoice/PackingList": "bg-indigo-50 text-indigo-700",
  "請求書": "bg-red-50 text-red-700",
};
