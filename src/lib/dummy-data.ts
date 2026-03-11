// Phase 0 UIモック用ダミーデータ

export const partners = [
  { id: "1", code: "C-001", name: "東洋プラスチック株式会社", nameKana: "トウヨウプラスチック", type: "customer" as const, closingDay: "末日", tel: "03-1234-5678", address: "東京都中央区日本橋1-1-1", isIscCertified: true, status: "active" as const },
  { id: "2", code: "C-002", name: "関西化学工業株式会社", nameKana: "カンサイカガクコウギョウ", type: "customer" as const, closingDay: "20日", tel: "06-9876-5432", address: "大阪府大阪市北区梅田2-2-2", isIscCertified: false, status: "active" as const },
  { id: "3", code: "S-001", name: "九州リサイクル株式会社", nameKana: "キュウシュウリサイクル", type: "supplier" as const, closingDay: "末日", tel: "092-111-2222", address: "福岡県福岡市博多区博多駅前3-3-3", isIscCertified: true, status: "active" as const },
  { id: "4", code: "S-002", name: "広島産業廃棄物処理株式会社", nameKana: "ヒロシマサンギョウハイキブツショリ", type: "supplier" as const, closingDay: "15日", tel: "082-333-4444", address: "広島県広島市安佐南区祇園4-4-4", isIscCertified: false, status: "active" as const },
  { id: "5", code: "T-001", name: "中国運輸株式会社", nameKana: "チュウゴクウンユ", type: "carrier" as const, closingDay: "末日", tel: "084-555-6666", address: "広島県福山市東深津町5-5-5", isIscCertified: false, status: "active" as const },
  { id: "6", code: "C-003", name: "HINDUSTAN POLYMERS PVT. LTD.", nameKana: "ヒンドゥスタンポリマーズ", type: "customer" as const, closingDay: "末日", tel: "+91-22-1234-5678", address: "Mumbai, India", isIscCertified: false, status: "active" as const },
  { id: "7", code: "C-004", name: "株式会社丸紅プラスチック", nameKana: "マルベニプラスチック", type: "customer" as const, closingDay: "末日", tel: "03-2222-3333", address: "東京都千代田区大手町1-6-1", isIscCertified: true, status: "active" as const },
  { id: "8", code: "S-003", name: "北陸ポリマー株式会社", nameKana: "ホクリクポリマー", type: "supplier" as const, closingDay: "20日", tel: "076-444-5555", address: "石川県金沢市広岡1-1-1", isIscCertified: false, status: "inactive" as const },
];

export const partnerTypeLabels: Record<string, string> = {
  customer: "顧客",
  supplier: "仕入先",
  carrier: "運送会社",
  mixed: "複合",
};

export const productNames = [
  { id: "1", code: "PP", name: "PP（ポリプロピレン）", category: "PP系" },
  { id: "2", code: "PE", name: "PE（ポリエチレン）", category: "PE系" },
  { id: "3", code: "PET", name: "PET（ポリエチレンテレフタレート）", category: "PET系" },
  { id: "4", code: "PS", name: "PS（ポリスチレン）", category: "PS系" },
  { id: "5", code: "PMMA", name: "PMMA（アクリル）", category: "エンプラ系" },
  { id: "6", code: "ABS", name: "ABS", category: "エンプラ系" },
  { id: "7", code: "PC", name: "PC（ポリカーボネート）", category: "エンプラ系" },
  { id: "8", code: "CPO", name: "Circular Pyrolysis Oil", category: "油化生成油" },
];

export const shapes = [
  { id: "1", code: "PEL", name: "ペレット" },
  { id: "2", code: "FLK", name: "フレーク" },
  { id: "3", code: "CRS", name: "粉砕" },
  { id: "4", code: "FLM", name: "フィルム" },
  { id: "5", code: "INJ", name: "射出" },
  { id: "6", code: "BLO", name: "ブロー" },
  { id: "7", code: "LIQ", name: "液体" },
];

export const colors = [
  { id: "1", code: "N", name: "ナチュラル" },
  { id: "2", code: "W", name: "白" },
  { id: "3", code: "BK", name: "黒" },
  { id: "4", code: "GR", name: "グレー" },
  { id: "5", code: "BL", name: "青" },
  { id: "6", code: "RD", name: "赤" },
  { id: "7", code: "YL", name: "黄" },
  { id: "8", code: "GN", name: "緑" },
  { id: "9", code: "MIX", name: "混合色" },
];

export const grades = [
  { id: "1", code: "A1", name: "A級（異物混入なし）", nameEn: "Grade A (No contamination)" },
  { id: "2", code: "A2", name: "A級（軽微異物）", nameEn: "Grade A (Minor contamination)" },
  { id: "3", code: "B1", name: "B級（標準）", nameEn: "Grade B (Standard)" },
  { id: "4", code: "B2", name: "B級（選別要）", nameEn: "Grade B (Sorting required)" },
  { id: "5", code: "C1", name: "C級（低品質）", nameEn: "Grade C (Low quality)" },
  { id: "6", code: "OIL", name: "油化用原料", nameEn: "Oil conversion feedstock" },
  { id: "7", code: "RSR", name: "再処理品", nameEn: "Reprocessed" },
];

export const products = [
  { id: "1", code: "PP-PEL-N-A1", productName: "PP（ポリプロピレン）", shape: "ペレット", color: "ナチュラル", grade: "A級（異物混入なし）", isIscEligible: false },
  { id: "2", code: "PP-CRS-W-B1", productName: "PP（ポリプロピレン）", shape: "粉砕", color: "白", grade: "B級（標準）", isIscEligible: false },
  { id: "3", code: "PE-FLM-N-A2", productName: "PE（ポリエチレン）", shape: "フィルム", color: "ナチュラル", grade: "A級（軽微異物）", isIscEligible: false },
  { id: "4", code: "PMMA-FLM-YL-B1", productName: "PMMA（アクリル）", shape: "フィルム", color: "黄", grade: "B級（標準）", isIscEligible: true },
  { id: "5", code: "ABS-INJ-BK-A1", productName: "ABS", shape: "射出", color: "黒", grade: "A級（異物混入なし）", isIscEligible: false },
  { id: "6", code: "CPO-LIQ-N-OIL", productName: "Circular Pyrolysis Oil", shape: "液体", color: "ナチュラル", grade: "油化用原料", isIscEligible: true },
  { id: "7", code: "PET-FLK-MIX-C1", productName: "PET（ポリエチレンテレフタレート）", shape: "フレーク", color: "混合色", grade: "C級（低品質）", isIscEligible: false },
  { id: "8", code: "PS-PEL-W-A1", productName: "PS（ポリスチレン）", shape: "ペレット", color: "白", grade: "A級（異物混入なし）", isIscEligible: false },
];

export const plants = [
  { id: "1", code: "OCC", name: "岡山ケミカルセンター", address: "岡山県", division: "CR" as const, warehouses: 3, tanks: 6 },
  { id: "2", code: "MNH", name: "美の浜工場", address: "岡山県", division: "both" as const, warehouses: 4, tanks: 2 },
  { id: "3", code: "ARM", name: "嵐山工場", address: "埼玉県", division: "CR" as const, warehouses: 2, tanks: 4 },
  { id: "4", code: "TKM", name: "高松工場", address: "香川県", division: "MR" as const, warehouses: 2, tanks: 0 },
  { id: "5", code: "YKC", name: "四日市工場", address: "三重県", division: "MR" as const, warehouses: 2, tanks: 0 },
];

export const divisionLabels: Record<string, string> = {
  MR: "MR事業部",
  CR: "CR事業部",
  both: "MR+CR",
};

export const warehouses = [
  { id: "1", code: "OCC-W1", name: "岡ケミ第1倉庫", plantName: "岡山ケミカルセンター", type: "internal" as const },
  { id: "2", code: "OCC-W2", name: "岡ケミ第2倉庫", plantName: "岡山ケミカルセンター", type: "internal" as const },
  { id: "3", code: "OCC-T", name: "岡ケミタンクヤード", plantName: "岡山ケミカルセンター", type: "internal" as const },
  { id: "4", code: "MNH-W1", name: "美の浜第1倉庫", plantName: "美の浜工場", type: "internal" as const },
  { id: "5", code: "MNH-W2", name: "美の浜第2倉庫", plantName: "美の浜工場", type: "internal" as const },
  { id: "6", code: "TKM-W1", name: "高松倉庫", plantName: "高松工場", type: "internal" as const },
  { id: "7", code: "YKC-W1", name: "四日市第1倉庫", plantName: "四日市工場", type: "internal" as const },
  { id: "8", code: "YKC-W2", name: "四日市第2倉庫", plantName: "四日市工場", type: "internal" as const },
  { id: "9", code: "EXT-01", name: "外部保管倉庫A", plantName: "（外部）", type: "external" as const },
];

export const users = [
  { id: "1", name: "福田 奈美絵", email: "fukuda@cfp-corp.co.jp", role: "admin", company: "CFP", status: "active" as const, lastLogin: "2026-03-11 09:15" },
  { id: "2", name: "松葉 健一", email: "matsuba@cfp-corp.co.jp", role: "admin", company: "CFP", status: "active" as const, lastLogin: "2026-03-11 10:30" },
  { id: "3", name: "井上 太郎", email: "inoue@cfp-corp.co.jp", role: "sales", company: "CFP", status: "active" as const, lastLogin: "2026-03-10 17:45" },
  { id: "4", name: "山田 花子", email: "yamada@cfp-corp.co.jp", role: "accounting", company: "CFP", status: "active" as const, lastLogin: "2026-03-11 08:50" },
  { id: "5", name: "佐藤 次郎", email: "sato@cfp-corp.co.jp", role: "factory", company: "CFP", status: "active" as const, lastLogin: "2026-03-11 06:00" },
  { id: "6", name: "田中 美咲", email: "tanaka@re-corp.co.jp", role: "factory", company: "RE", status: "active" as const, lastLogin: "2026-03-10 15:20" },
  { id: "7", name: "鈴木 一郎", email: "suzuki@cfp-corp.co.jp", role: "sales", company: "CFP", status: "inactive" as const, lastLogin: "2026-02-15 11:00" },
  { id: "8", name: "高橋 健二", email: "takahashi@cfp-corp.co.jp", role: "manager", company: "CFP", status: "active" as const, lastLogin: "2026-03-11 09:00" },
];

export const roleLabels: Record<string, string> = {
  admin: "管理者",
  sales: "営業",
  accounting: "経理",
  factory: "工場",
  manager: "管理",
  readonly: "閲覧",
};

export const auditLogs = [
  { id: "1", timestamp: "2026-03-11 10:32:15", user: "松葉 健一", action: "UPDATE", table: "business_partners", recordId: "C-001", summary: "電話番号を変更", oldValue: "03-1234-5670", newValue: "03-1234-5678" },
  { id: "2", timestamp: "2026-03-11 10:15:00", user: "井上 太郎", action: "INSERT", table: "customer_prices", recordId: "CP-128", summary: "新規単価登録（東洋プラスチック×PP-PEL-N-A1）", oldValue: "-", newValue: "¥185/kg" },
  { id: "3", timestamp: "2026-03-11 09:45:30", user: "福田 奈美絵", action: "UPDATE", table: "users", recordId: "U-007", summary: "ステータスを無効化", oldValue: "active", newValue: "inactive" },
  { id: "4", timestamp: "2026-03-10 17:20:00", user: "山田 花子", action: "UPDATE", table: "exchange_rates", recordId: "ER-2026-03", summary: "3月レート更新（USD/JPY）", oldValue: "149.50", newValue: "150.25" },
  { id: "5", timestamp: "2026-03-10 16:05:00", user: "松葉 健一", action: "INSERT", table: "products", recordId: "P-009", summary: "新規品目登録（PC-PEL-N-A1）", oldValue: "-", newValue: "PC-PEL-N-A1" },
  { id: "6", timestamp: "2026-03-10 14:30:00", user: "佐藤 次郎", action: "UPDATE", table: "warehouses", recordId: "W-004", summary: "倉庫名を変更", oldValue: "美の浜倉庫A", newValue: "美の浜第1倉庫" },
  { id: "7", timestamp: "2026-03-10 11:00:00", user: "井上 太郎", action: "INSERT", table: "business_partners", recordId: "C-005", summary: "新規取引先登録", oldValue: "-", newValue: "株式会社丸紅プラスチック" },
  { id: "8", timestamp: "2026-03-10 09:15:00", user: "田中 美咲", action: "UPDATE", table: "plants", recordId: "P-002", summary: "事業部区分を変更", oldValue: "MR", newValue: "MR+CR" },
];

export const dashboardStats = {
  totalPartners: 156,
  activePartners: 142,
  totalProducts: 384,
  totalPlants: 5,
  totalWarehouses: 15,
  totalUsers: 62,
  activeUsers: 58,
  pendingApprovals: 3,
  recentChanges: 24,
};

export const prices = [
  { id: "1", partnerName: "東洋プラスチック株式会社", productCode: "PP-PEL-N-A1", productName: "PP ペレット ナチュラル A級", unitPrice: 185, currency: "JPY", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "2", partnerName: "東洋プラスチック株式会社", productCode: "PE-FLM-N-A2", productName: "PE フィルム ナチュラル A級", unitPrice: 120, currency: "JPY", validFrom: "2026-01-01", validTo: "2026-06-30" },
  { id: "3", partnerName: "関西化学工業株式会社", productCode: "PMMA-FLM-YL-B1", productName: "PMMA フィルム 黄 B級", unitPrice: 210, currency: "JPY", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "4", partnerName: "HINDUSTAN POLYMERS PVT. LTD.", productCode: "PP-PEL-N-A1", productName: "PP Pellet Natural Grade A", unitPrice: 850, currency: "USD", validFrom: "2026-01-01", validTo: "2026-12-31" },
  { id: "5", partnerName: "株式会社丸紅プラスチック", productCode: "CPO-LIQ-N-OIL", productName: "Circular Pyrolysis Oil", unitPrice: 95, currency: "JPY", validFrom: "2026-04-01", validTo: "2027-03-31" },
  { id: "6", partnerName: "関西化学工業株式会社", productCode: "ABS-INJ-BK-A1", productName: "ABS 射出 黒 A級", unitPrice: 165, currency: "JPY", validFrom: "2025-10-01", validTo: "2026-03-31" },
];
