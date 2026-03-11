// Phase 3 承認・経営・トレーサビリティ・ISCC・税務・経費・仕訳・契約・CTS ダミーデータ

// === 承認ワークフロー ===
export type ApprovalStatus = "承認待ち" | "承認済" | "却下" | "差戻し";
export type ApprovalCategory = "手配" | "請求書" | "支払" | "経費" | "単価変更" | "その他";
export const approvalItems = [
  { id: "1", category: "手配" as ApprovalCategory, title: "出荷手配 SHP-2026-0158", description: "東洋プラスチック PP-PEL-N-A1 10,000kg", amount: 1850000, applicant: "井上 浩二", applicantRole: "営業", date: "2026-03-12", status: "承認待ち" as ApprovalStatus, currentStep: 2, steps: [
    { role: "営業アシスタント", user: "山田 花子", status: "承認済" as ApprovalStatus, date: "2026-03-12 09:15" },
    { role: "営業マネージャー", user: "高橋 健二", status: "承認済" as ApprovalStatus, date: "2026-03-12 10:30" },
    { role: "社長", user: "福田 奈美絵", status: "承認待ち" as ApprovalStatus, date: null },
  ]},
  { id: "2", category: "請求書" as ApprovalCategory, title: "請求書発行 INV-2026-0089", description: "東洋プラスチック 3月度請求 ¥1,017,500", amount: 1017500, applicant: "信岡 真理", applicantRole: "経理", date: "2026-03-12", status: "承認待ち" as ApprovalStatus, currentStep: 1, steps: [
    { role: "営業", user: "井上 浩二", status: "承認済" as ApprovalStatus, date: "2026-03-12 11:00" },
    { role: "社長", user: "福田 奈美絵", status: "承認待ち" as ApprovalStatus, date: null },
  ]},
  { id: "3", category: "支払" as ApprovalCategory, title: "支払承認 3月度仕入 九州リサイクル", description: "原料仕入 PP廃プラ 8,000kg ¥320,000", amount: 320000, applicant: "信岡 真理", applicantRole: "経理", date: "2026-03-11", status: "承認待ち" as ApprovalStatus, currentStep: 0, steps: [
    { role: "社長", user: "福田 奈美絵", status: "承認待ち" as ApprovalStatus, date: null },
  ]},
  { id: "4", category: "経費" as ApprovalCategory, title: "出張精算 東京出張 3/8-9", description: "新幹線+宿泊+タクシー ¥58,200（3万円以上要承認）", amount: 58200, applicant: "高橋 健二", applicantRole: "営業マネージャー", date: "2026-03-11", status: "承認待ち" as ApprovalStatus, currentStep: 0, steps: [
    { role: "社長", user: "福田 奈美絵", status: "承認待ち" as ApprovalStatus, date: null },
  ]},
  { id: "5", category: "単価変更" as ApprovalCategory, title: "単価改定 関西化学工業 PS-PEL-W-A1", description: "¥175/kg → ¥180/kg（原料高騰対応）有効期間 4/1〜", amount: null, applicant: "井上 浩二", applicantRole: "営業", date: "2026-03-10", status: "承認済" as ApprovalStatus, currentStep: 2, steps: [
    { role: "営業マネージャー", user: "高橋 健二", status: "承認済" as ApprovalStatus, date: "2026-03-10 14:00" },
    { role: "社長", user: "福田 奈美絵", status: "承認済" as ApprovalStatus, date: "2026-03-10 16:30" },
  ]},
  { id: "6", category: "手配" as ApprovalCategory, title: "仕入手配 広島産業廃棄物処理 PE混合", description: "PE混合廃プラ 5,500kg @¥40/kg", amount: 220000, applicant: "田中 美咲", applicantRole: "営業", date: "2026-03-10", status: "却下" as ApprovalStatus, currentStep: 1, steps: [
    { role: "営業マネージャー", user: "高橋 健二", status: "承認済" as ApprovalStatus, date: "2026-03-10 09:00" },
    { role: "社長", user: "福田 奈美絵", status: "却下" as ApprovalStatus, date: "2026-03-10 11:00" },
  ]},
];
export const approvalStatusColors: Record<ApprovalStatus, string> = { "承認待ち": "bg-amber-50 text-amber-700", "承認済": "bg-emerald-50 text-emerald-700", "却下": "bg-red-50 text-red-700", "差戻し": "bg-blue-50 text-blue-700" };
export const approvalCategoryColors: Record<ApprovalCategory, string> = { "手配": "bg-blue-100 text-blue-800", "請求書": "bg-purple-100 text-purple-800", "支払": "bg-orange-100 text-orange-800", "経費": "bg-pink-100 text-pink-800", "単価変更": "bg-teal-100 text-teal-800", "その他": "bg-gray-100 text-gray-800" };

// === 経営ダッシュボード ===
export const kpiData = {
  currentMonth: "2026年3月",
  revenue: { total: 12450000, prevMonth: 11800000, target: 15000000 },
  cost: { total: 8715000, prevMonth: 8260000 },
  grossProfit: { total: 3735000, prevMonth: 3540000, margin: 30.0 },
  inventory: { totalKg: 245000, valuationJpy: 18200000, turnover: 1.4 },
  production: {
    mr: [
      { plant: "美の浜工場", produced: 42000, unit: "kg", yieldRate: 97.5 },
      { plant: "高松工場", produced: 38000, unit: "kg", yieldRate: 96.8 },
      { plant: "四日市工場", produced: 12000, unit: "kg", yieldRate: 98.2 },
    ],
    cr: [
      { plant: "岡山ケミカルセンター", inputKg: 58000, outputOilKg: 44950, outputResidueKg: 2320, yieldRate: 77.5 },
      { plant: "美の浜工場", inputKg: 18000, outputOilKg: 13860, outputResidueKg: 720, yieldRate: 77.0 },
    ],
  },
  monthlyTrend: [
    { month: "2025-10", revenue: 13200000, cost: 9240000, profit: 3960000 },
    { month: "2025-11", revenue: 11500000, cost: 8050000, profit: 3450000 },
    { month: "2025-12", revenue: 14100000, cost: 9870000, profit: 4230000 },
    { month: "2026-01", revenue: 15680000, cost: 10976000, profit: 4704000 },
    { month: "2026-02", revenue: 11800000, cost: 8260000, profit: 3540000 },
    { month: "2026-03", revenue: 12450000, cost: 8715000, profit: 3735000 },
  ],
  tankUtilization: [
    { name: "軽質油A", percentage: 65, plant: "岡ケミ" },
    { name: "軽質油B", percentage: 24, plant: "岡ケミ" },
    { name: "重質油", percentage: 62, plant: "岡ケミ" },
    { name: "混合油", percentage: 21, plant: "岡ケミ" },
    { name: "軽質油", percentage: 73, plant: "美の浜" },
  ],
};

// === トレーサビリティ ===
export const traceRecords = [
  {
    id: "1", traceId: "TRACE-2026-0089", product: "Circular Pyrolysis Oil（軽質）", lot: "260310-TC",
    stages: [
      { stage: "原料入荷", date: "2026-03-08", detail: "PP廃プラ 7,800kg", lot: "CR-260309-01", location: "岡山ケミカルセンター", isccCertified: true, sdNumber: "CFP-000189-CA" },
      { stage: "油化製造", date: "2026-03-11", detail: "CPO-2026-0033 投入7,800kg→生成油5,850kg", lot: "CPO-2026-0033", location: "岡山ケミカルセンター", isccCertified: true, sdNumber: null },
      { stage: "タンク貯蔵", date: "2026-03-11", detail: "TK-02 軽質油タンクB 5,850kg投入", lot: "TK-02", location: "岡山ケミカルセンター", isccCertified: true, sdNumber: null },
      { stage: "品質検査", date: "2026-03-11", detail: "SA-2026-0188 分析中", lot: "SA-2026-0188", location: "研究室", isccCertified: false, sdNumber: null },
    ]
  },
  {
    id: "2", traceId: "TRACE-2026-0088", product: "PP ペレット ナチュラル A級", lot: "MR-260310-01",
    stages: [
      { stage: "原料入荷", date: "2026-03-05", detail: "PP廃プラ 12,000kg 九州リサイクルより", lot: "PUR-260305-01", location: "美の浜工場", isccCertified: false, sdNumber: null },
      { stage: "ルーダー加工", date: "2026-03-07", detail: "PRD-2026-0042 投入12,000kg→完成品11,640kg (97%)", lot: "PRD-2026-0042", location: "美の浜工場", isccCertified: false, sdNumber: null },
      { stage: "製品在庫", date: "2026-03-07", detail: "美の浜第1倉庫 11,640kg PP-PEL-N-A1", lot: "INV-260307-01", location: "美の浜第1倉庫", isccCertified: false, sdNumber: null },
      { stage: "出荷", date: "2026-03-10", detail: "SHP-2026-0156 東洋プラスチック 5,000kg", lot: "SHP-2026-0156", location: "→川崎", isccCertified: false, sdNumber: null },
    ]
  },
  {
    id: "3", traceId: "TRACE-2026-0087", product: "Circular Pyrolysis Oil（混合）", lot: "260308-TC",
    stages: [
      { stage: "原料入荷", date: "2026-03-06", detail: "PE/PP混合廃プラ 6,000kg", lot: "CR-260308-01", location: "美の浜工場", isccCertified: true, sdNumber: "CFP-000188-CA" },
      { stage: "油化製造", date: "2026-03-10", detail: "CPO-2026-0032 投入6,000kg→生成油4,620kg", lot: "CPO-2026-0032", location: "美の浜工場", isccCertified: true, sdNumber: null },
      { stage: "品質検査", date: "2026-03-10", detail: "SA-2026-0187 合格", lot: "SA-2026-0187", location: "研究室", isccCertified: true, sdNumber: null },
      { stage: "出荷", date: "2026-03-08", detail: "OIL-2026-0043 丸紅プラスチック 10,000kg", lot: "OIL-2026-0043", location: "→大阪", isccCertified: true, sdNumber: "CFP-000190-CA" },
    ]
  },
];

// === ISCC PLUS管理 ===
export const isccCertificates = [
  { id: "1", number: "ISCC-EU-234567", site: "岡山ケミカルセンター", validFrom: "2025-10-01", validUntil: "2026-09-30", status: "有効", scope: "Circular Pyrolysis Oil (軽質/重質/混合)", lastAudit: "2025-09-15" },
  { id: "2", number: "ISCC-EU-234568", site: "美の浜工場", validFrom: "2025-11-01", validUntil: "2026-10-31", status: "有効", scope: "Circular Pyrolysis Oil (軽質)", lastAudit: "2025-10-20" },
];
export const massBalanceEntries = [
  { id: "1", period: "2026-03", site: "岡山ケミカルセンター", inputCertified: 14000, inputTotal: 22000, outputCertified: 10500, outputTotal: 17800, balance: 3500, sdDocuments: 4 },
  { id: "2", period: "2026-02", site: "岡山ケミカルセンター", inputCertified: 18000, inputTotal: 28000, outputCertified: 14200, outputTotal: 21500, balance: 3800, sdDocuments: 6 },
  { id: "3", period: "2026-03", site: "美の浜工場", inputCertified: 6000, inputTotal: 12000, outputCertified: 4500, outputTotal: 9200, balance: 1500, sdDocuments: 2 },
];
export const sdDocuments = [
  { id: "1", number: "CFP-000192-CA", type: "出荷", date: "2026-03-12", customer: "関西化学工業株式会社", product: "CPO（軽質）", quantity: 19000, isccNumber: "ISCC-EU-234567" },
  { id: "2", number: "CFP-000191-CA", type: "出荷", date: "2026-03-10", customer: "関西化学工業株式会社", product: "CPO（軽質）", quantity: 19000, isccNumber: "ISCC-EU-234568" },
  { id: "3", number: "CFP-000190-CA", type: "出荷", date: "2026-03-08", customer: "株式会社丸紅プラスチック", product: "CPO（混合）", quantity: 10000, isccNumber: "ISCC-EU-234567" },
  { id: "4", number: "CFP-000189-CA", type: "受入", date: "2026-03-08", customer: "九州リサイクル株式会社", product: "PP廃プラスチック", quantity: 7800, isccNumber: "ISCC-EU-234567" },
];

// === 税務帳票 ===
export const taxReports = [
  { id: "1", type: "揮発油税" as const, period: "2026-03", plant: "岡山ケミカルセンター", productionLiters: 42000, shipmentLiters: 38000, taxRate: 53.8, taxAmount: 2044400, dueDate: "2026-04-30", status: "作成中" },
  { id: "2", type: "軽油引取税" as const, period: "2026-03", plant: "岡山ケミカルセンター", productionLiters: 18000, shipmentLiters: 15000, taxRate: 32.1, taxAmount: 481500, dueDate: "2026-04-30", status: "作成中" },
  { id: "3", type: "揮発油税" as const, period: "2026-02", plant: "岡山ケミカルセンター", productionLiters: 52000, shipmentLiters: 48000, taxRate: 53.8, taxAmount: 2582400, dueDate: "2026-03-31", status: "提出済" },
  { id: "4", type: "軽油引取税" as const, period: "2026-02", plant: "岡山ケミカルセンター", productionLiters: 22000, shipmentLiters: 19000, taxRate: 32.1, taxAmount: 609900, dueDate: "2026-03-31", status: "提出済" },
  { id: "5", type: "揮発油税" as const, period: "2026-03", plant: "美の浜工場", productionLiters: 14000, shipmentLiters: 12000, taxRate: 53.8, taxAmount: 645600, dueDate: "2026-04-30", status: "作成中" },
];
export type TaxReportType = "揮発油税" | "軽油引取税";

// === 外部受託分析 ===
export type ExternalAnalysisStatus = "依頼受付" | "サンプル受領" | "分析中" | "報告済" | "請求済";
export const externalAnalyses = [
  { id: "1", requestId: "EXT-2026-0012", customer: "関西化学工業株式会社", requestDate: "2026-03-10", sampleName: "再生油サンプルA", analysisItems: ["比重", "動粘度", "硫黄分", "引火点"], dueDate: "2026-03-17", price: 35000, status: "分析中" as ExternalAnalysisStatus, assignedTo: "中村 理恵" },
  { id: "2", requestId: "EXT-2026-0011", customer: "株式会社丸紅プラスチック", requestDate: "2026-03-08", sampleName: "CPO品質確認用", analysisItems: ["比重", "動粘度", "残留塩素", "水分"], dueDate: "2026-03-15", price: 28000, status: "報告済" as ExternalAnalysisStatus, assignedTo: "中村 理恵" },
  { id: "3", requestId: "EXT-2026-0010", customer: "中部石油化学株式会社", requestDate: "2026-03-05", sampleName: "ナフサ代替評価", analysisItems: ["GC/MS全項目", "比重", "動粘度", "硫黄分", "引火点", "水分", "残留塩素"], dueDate: "2026-03-12", price: 85000, status: "請求済" as ExternalAnalysisStatus, assignedTo: "中村 理恵" },
  { id: "4", requestId: "EXT-2026-0013", customer: "九州石油化学株式会社", requestDate: "2026-03-12", sampleName: "熱分解油評価", analysisItems: ["比重", "動粘度", "硫黄分"], dueDate: "2026-03-19", price: 22000, status: "依頼受付" as ExternalAnalysisStatus, assignedTo: null },
];
export const externalAnalysisStatusColors: Record<ExternalAnalysisStatus, string> = { "依頼受付": "bg-gray-50 text-gray-700", "サンプル受領": "bg-blue-50 text-blue-700", "分析中": "bg-amber-50 text-amber-700", "報告済": "bg-emerald-50 text-emerald-700", "請求済": "bg-purple-50 text-purple-700" };

// === 経費管理 ===
export type ExpenseStatus = "下書き" | "申請中" | "承認済" | "却下" | "精算済";
export const expenses = [
  { id: "1", number: "EXP-2026-0089", title: "東京出張 3/8-9", applicant: "高橋 健二", department: "営業部", date: "2026-03-11", items: [
    { name: "新幹線 福山→東京（往復）", amount: 36800, category: "交通費" },
    { name: "ホテル 東京ビジネスイン", amount: 12400, category: "宿泊費" },
    { name: "タクシー（顧客訪問）", amount: 4200, category: "交通費" },
    { name: "会食（顧客接待）", amount: 4800, category: "接待費" },
  ], total: 58200, requiresApproval: true, status: "申請中" as ExpenseStatus, hasReceipts: true, electronicTimestamp: "2026-03-11 10:00:00" },
  { id: "2", number: "EXP-2026-0088", title: "事務用品購入", applicant: "山田 花子", department: "総務部", date: "2026-03-10", items: [
    { name: "コピー用紙 A4 10箱", amount: 12500, category: "事務用品" },
    { name: "トナーカートリッジ", amount: 8900, category: "事務用品" },
  ], total: 21400, requiresApproval: false, status: "承認済" as ExpenseStatus, hasReceipts: true, electronicTimestamp: "2026-03-10 14:30:00" },
  { id: "3", number: "EXP-2026-0087", title: "大阪出張 3/5", applicant: "井上 浩二", department: "営業部", date: "2026-03-06", items: [
    { name: "新幹線 福山→新大阪（往復）", amount: 18400, category: "交通費" },
    { name: "タクシー", amount: 2800, category: "交通費" },
    { name: "昼食（顧客同席）", amount: 3200, category: "接待費" },
  ], total: 24400, requiresApproval: false, status: "精算済" as ExpenseStatus, hasReceipts: true, electronicTimestamp: "2026-03-06 17:00:00" },
  { id: "4", number: "EXP-2026-0090", title: "工場備品購入", applicant: "佐藤 次郎", department: "製造部", date: "2026-03-12", items: [
    { name: "安全靴 3足", amount: 18600, category: "消耗品" },
    { name: "作業手袋 50双", amount: 12800, category: "消耗品" },
    { name: "フォークリフト部品", amount: 45000, category: "修繕費" },
  ], total: 76400, requiresApproval: true, status: "申請中" as ExpenseStatus, hasReceipts: true, electronicTimestamp: "2026-03-12 09:00:00" },
];
export const expenseStatusColors: Record<ExpenseStatus, string> = { "下書き": "bg-gray-50 text-gray-700", "申請中": "bg-amber-50 text-amber-700", "承認済": "bg-emerald-50 text-emerald-700", "却下": "bg-red-50 text-red-700", "精算済": "bg-blue-50 text-blue-700" };

// === 仕訳データ連携 ===
export type JournalStatus = "未連携" | "連携済" | "エラー";
export const journalEntries = [
  { id: "1", date: "2026-03-12", number: "JE-2026-0345", company: "CFP", debitAccount: "売掛金", debitCode: "1131", debitAmount: 1017500, creditAccount: "売上高", creditCode: "4111", creditAmount: 925000, taxAmount: 92500, description: "東洋プラスチック 3月度売上", source: "INV-2026-0089", status: "未連携" as JournalStatus },
  { id: "2", date: "2026-03-10", number: "JE-2026-0344", company: "CFP", debitAccount: "売掛金", debitCode: "1131", debitAmount: 789250, creditAccount: "売上高", creditCode: "4111", creditAmount: 717500, taxAmount: 71750, description: "関西化学工業 PS売上", source: "INV-2026-0088", status: "未連携" as JournalStatus },
  { id: "3", date: "2026-03-10", number: "JE-2026-0343", company: "CFP", debitAccount: "普通預金", debitCode: "1112", debitAmount: 1985500, creditAccount: "売掛金", creditCode: "1131", creditAmount: 1985500, taxAmount: 0, description: "関西化学工業 入金消込", source: "PAY-2026-0341", status: "連携済" as JournalStatus },
  { id: "4", date: "2026-03-08", number: "JE-2026-0342", company: "CFP", debitAccount: "仕入高", debitCode: "5111", debitAmount: 220000, creditAccount: "買掛金", creditCode: "2111", creditAmount: 220000, taxAmount: 0, description: "九州リサイクル PP廃プラ仕入", source: "PUR-2026-0178", status: "連携済" as JournalStatus },
  { id: "5", date: "2026-03-01", number: "JE-2026-0340", company: "RE", debitAccount: "売掛金", debitCode: "1131", debitAmount: 82500, creditAccount: "売上高", creditCode: "4111", creditAmount: 75000, taxAmount: 7500, description: "CFP向け加工賃（ルーダー）", source: "SL-2026-0231", status: "連携済" as JournalStatus },
];
export const journalStatusColors: Record<JournalStatus, string> = { "未連携": "bg-amber-50 text-amber-700", "連携済": "bg-emerald-50 text-emerald-700", "エラー": "bg-red-50 text-red-700" };

// === 契約書管理 ===
export type ContractStatus = "有効" | "期限間近" | "期限切れ" | "下書き";
export const contracts = [
  { id: "1", number: "CT-2026-0089", title: "PP再生ペレット販売基本契約", partner: "東洋プラスチック株式会社", type: "販売契約", startDate: "2026-01-01", endDate: "2026-12-31", autoRenew: true, amount: null, status: "有効" as ContractStatus, signedBy: "福田 奈美絵", note: "自動更新条項あり" },
  { id: "2", number: "CT-2025-0156", title: "廃プラスチック原料供給契約", partner: "九州リサイクル株式会社", type: "仕入契約", startDate: "2025-04-01", endDate: "2026-03-31", autoRenew: false, amount: null, status: "期限間近" as ContractStatus, signedBy: "福田 奈美絵", note: "更新交渉中" },
  { id: "3", number: "CT-2026-0091", title: "Circular Pyrolysis Oil販売契約", partner: "HINDUSTAN POLYMERS PVT. LTD.", type: "販売契約（海外）", startDate: "2026-03-01", endDate: "2027-02-28", autoRenew: false, amount: 204000, status: "有効" as ContractStatus, signedBy: "福田 奈美絵", note: "USD建て FOB" },
  { id: "4", number: "CT-2026-0045", title: "運送委託基本契約", partner: "中国運輸株式会社", type: "運送契約", startDate: "2026-01-01", endDate: "2026-12-31", autoRenew: true, amount: null, status: "有効" as ContractStatus, signedBy: "福田 奈美絵", note: "運賃改定条項あり" },
  { id: "5", number: "CT-2024-0098", title: "産業廃棄物処理委託契約", partner: "広島環境サービス株式会社", type: "処理委託", startDate: "2024-10-01", endDate: "2025-09-30", autoRenew: true, amount: null, status: "期限切れ" as ContractStatus, signedBy: "福田 奈美絵", note: "自動更新済み（更新契約書未取得）" },
  { id: "6", number: "CT-2026-0092", title: "加工委託基本契約（RE）", partner: "株式会社リサイクルエナジー", type: "加工委託", startDate: "2026-01-01", endDate: "2026-12-31", autoRenew: true, amount: null, status: "有効" as ContractStatus, signedBy: "福田 奈美絵", note: "グループ会社間契約" },
];
export const contractStatusColors: Record<ContractStatus, string> = { "有効": "bg-emerald-50 text-emerald-700", "期限間近": "bg-amber-50 text-amber-700", "期限切れ": "bg-red-50 text-red-700", "下書き": "bg-gray-50 text-gray-700" };

// === CTS管理 ===
export type CtsTransactionStatus = "見積" | "契約済" | "出荷中" | "完了";
export const ctsTransactions = [
  { id: "1", number: "CTS-2026-0008", customer: "PT. INDO PLASTICS", origin: "シンガポール", destination: "インドネシア", product: "PP Pellet Natural A", quantityKg: 40000, unitPriceUsd: 0.85, amountUsd: 34000, amountSgd: 45288, rateUsdSgd: 1.332, amountJpy: 5108500, rateUsdJpy: 150.25, date: "2026-03-10", status: "出荷中" as CtsTransactionStatus },
  { id: "2", number: "CTS-2026-0007", customer: "THAI RECYCLING CO., LTD.", origin: "日本", destination: "タイ", product: "ABS Pellet Black A", quantityKg: 22000, unitPriceUsd: 0.92, amountUsd: 20240, amountSgd: 26960, rateUsdSgd: 1.332, amountJpy: 3041060, rateUsdJpy: 150.25, date: "2026-03-05", status: "完了" as CtsTransactionStatus },
  { id: "3", number: "CTS-2026-0009", customer: "HINDUSTAN POLYMERS PVT. LTD.", origin: "日本", destination: "インド", product: "PP Pellet Natural A", quantityKg: 60000, unitPriceUsd: 0.85, amountUsd: 51000, amountSgd: 67932, rateUsdSgd: 1.332, amountJpy: 7662750, rateUsdJpy: 150.25, date: "2026-03-12", status: "見積" as CtsTransactionStatus },
];
export const ctsStatusColors: Record<CtsTransactionStatus, string> = { "見積": "bg-gray-50 text-gray-700", "契約済": "bg-blue-50 text-blue-700", "出荷中": "bg-amber-50 text-amber-700", "完了": "bg-emerald-50 text-emerald-700" };
