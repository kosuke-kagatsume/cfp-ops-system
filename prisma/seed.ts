import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Company, Division, PackagingType, PurchaseStatus, ShipmentStatus, InvoiceStatus, ProcessType, TankType, CrMaterialStatus, ProductionOrderStatus, SampleStatus, ApprovalStatus, ApprovalCategory, PaymentMethod, SalesCategory, ClosingDay, Currency, WarehouseType, ContractStatus, DocumentType } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ===== RESET =====
  console.log("🗑️  Cleaning existing data...");
  await prisma.traceStage.deleteMany();
  await prisma.traceRecord.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.approvalRequest.deleteMany();
  await prisma.massBalance.deleteMany();
  await prisma.sustainabilityDeclaration.deleteMany();
  await prisma.isccCertificate.deleteMany();
  await prisma.analysisCertificate.deleteMany();
  await prisma.analysisResult.deleteMany();
  await prisma.externalAnalysis.deleteMany();
  await prisma.labEquipmentInspection.deleteMany();
  await prisma.labSample.deleteMany();
  await prisma.tankMovement.deleteMany();
  await prisma.crProductionMaterial.deleteMany();
  await prisma.residue.deleteMany();
  await prisma.oilShipment.deleteMany();
  await prisma.crProductionOrder.deleteMany();
  await prisma.crMaterial.deleteMany();
  await prisma.expenseItem.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.ctsTransaction.deleteMany();
  await prisma.taxReport.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.monthlyClosing.deleteMany();
  await prisma.accountsReceivable.deleteMany();
  await prisma.paymentPayable.deleteMany();
  await prisma.paymentReceived.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.stocktakeItem.deleteMany();
  await prisma.stocktake.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.processingOrder.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.customerPrice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.document.deleteMany();
  await prisma.productionCalendar.deleteMany();
  await prisma.sensorData.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.exchangeRate.deleteMany();
  await prisma.partnerDocumentSetting.deleteMany();
  await prisma.partnerContact.deleteMany();
  await prisma.product.deleteMany();
  await prisma.tank.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.plant.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.businessPartner.deleteMany();
  await prisma.numberSequence.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.productName.deleteMany();
  await prisma.productShape.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productGrade.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log("✅ Clean complete");

  // ===== A. ROLES =====
  console.log("👤 Creating roles & users...");
  const adminRole = await prisma.role.create({ data: { name: "管理者", description: "システム管理者（社長・役員）", permissions: { all: true } } });
  const managerRole = await prisma.role.create({ data: { name: "マネージャー", description: "部門マネージャー", permissions: { read: true, write: true, approve: true, delete: false } } });
  const staffRole = await prisma.role.create({ data: { name: "スタッフ", description: "一般スタッフ", permissions: { read: true, write: true, approve: false, delete: false } } });
  const viewerRole = await prisma.role.create({ data: { name: "閲覧者", description: "閲覧のみ", permissions: { read: true, write: false, approve: false, delete: false } } });

  // ===== USERS (11名) =====
  const ceo = await prisma.user.create({ data: { email: "namie.fukuda@cfp-group.co.jp", name: "福田 奈美絵", nameKana: "フクダ ナミエ", department: "経営", position: "代表取締役社長", roleId: adminRole.id } });
  const chairman = await prisma.user.create({ data: { email: "takashi.fukuda@cfp-group.co.jp", name: "福田 隆", nameKana: "フクダ タカシ", department: "経営", position: "取締役会長", roleId: adminRole.id } });
  const salesMgr = await prisma.user.create({ data: { email: "kenji.takahashi@cfp-group.co.jp", name: "高橋 健二", nameKana: "タカハシ ケンジ", department: "営業部", position: "営業マネージャー", roleId: managerRole.id } });
  const sales1 = await prisma.user.create({ data: { email: "koji.inoue@cfp-group.co.jp", name: "井上 浩二", nameKana: "イノウエ コウジ", department: "営業部", position: "営業担当", roleId: staffRole.id } });
  const sales2 = await prisma.user.create({ data: { email: "misaki.tanaka@cfp-group.co.jp", name: "田中 美咲", nameKana: "タナカ ミサキ", department: "営業部", position: "営業担当", roleId: staffRole.id } });
  const assistant = await prisma.user.create({ data: { email: "hanako.yamada@cfp-group.co.jp", name: "山田 花子", nameKana: "ヤマダ ハナコ", department: "営業部", position: "営業アシスタント", roleId: staffRole.id } });
  const accounting = await prisma.user.create({ data: { email: "mari.nobuoka@cfp-group.co.jp", name: "信岡 真理", nameKana: "ノブオカ マリ", department: "経理部", position: "経理担当", roleId: staffRole.id } });
  const production = await prisma.user.create({ data: { email: "jiro.sato@cfp-group.co.jp", name: "佐藤 次郎", nameKana: "サトウ ジロウ", department: "製造部", position: "製造担当", roleId: staffRole.id } });
  const labUser = await prisma.user.create({ data: { email: "rie.nakamura@cfp-group.co.jp", name: "中村 理恵", nameKana: "ナカムラ リエ", department: "研究室", position: "分析担当", roleId: staffRole.id } });
  const itAcct = await prisma.user.create({ data: { email: "tatsuya.matsuba@cfp-group.co.jp", name: "松葉 達也", nameKana: "マツバ タツヤ", department: "管理部", position: "IT・経理", roleId: managerRole.id } });
  const factory = await prisma.user.create({ data: { email: "kenji.takeshi@cfp-group.co.jp", name: "建志 健二", nameKana: "タケシ ケンジ", department: "製造部", position: "工場長", roleId: managerRole.id } });

  // ===== B. MASTER DATA =====
  console.log("📦 Creating master data...");

  // 品名マスタ
  const pnData = [
    { code: 1, name: "PP（ポリプロピレン）" }, { code: 2, name: "PE（ポリエチレン）" },
    { code: 3, name: "PET（ポリエチレンテレフタレート）" }, { code: 4, name: "PS（ポリスチレン）" },
    { code: 5, name: "PMMA（アクリル）" }, { code: 6, name: "ABS" },
    { code: 7, name: "PC（ポリカーボネート）" }, { code: 8, name: "PA（ナイロン）" },
    { code: 9, name: "PVC（塩化ビニル）" }, { code: 10, name: "HDPE（高密度PE）" },
    { code: 11, name: "LDPE（低密度PE）" }, { code: 12, name: "LLDPE（直鎖状低密度PE）" },
    { code: 13, name: "TPU" }, { code: 14, name: "POM（ポリアセタール）" },
    { code: 900, name: "Circular Pyrolysis Oil", isccManageName: "CPO" },
    { code: 901, name: "軽質油（Circular Naphtha）", isccManageName: "Circular Naphtha" },
    { code: 902, name: "重質油" }, { code: 903, name: "混合油" },
    { code: 909, name: "Circular Carbon Black" },
  ];
  const pnMap: Record<number, string> = {};
  for (const pn of pnData) { const r = await prisma.productName.create({ data: pn }); pnMap[pn.code] = r.id; }

  // 形状マスタ
  const shData = [
    { code: 1, name: "ペレット" }, { code: 2, name: "フレーク" }, { code: 3, name: "粉砕" },
    { code: 4, name: "フィルム" }, { code: 5, name: "射出" }, { code: 6, name: "ブロー" },
    { code: 7, name: "液体" }, { code: 8, name: "パウダー" }, { code: 9, name: "シート" },
    { code: 10, name: "繊維" }, { code: 11, name: "再生ペレット" },
  ];
  const shMap: Record<number, string> = {};
  for (const s of shData) { const r = await prisma.productShape.create({ data: s }); shMap[s.code] = r.id; }

  // 色マスタ
  const clData = [
    { code: 1, name: "ナチュラル" }, { code: 2, name: "白" }, { code: 3, name: "黒" },
    { code: 4, name: "グレー" }, { code: 5, name: "青" }, { code: 6, name: "赤" },
    { code: 7, name: "黄" }, { code: 8, name: "緑" }, { code: 9, name: "混合色" },
    { code: 10, name: "透明" }, { code: 11, name: "スモーク" },
  ];
  const clMap: Record<number, string> = {};
  for (const c of clData) { const r = await prisma.productColor.create({ data: c }); clMap[c.code] = r.id; }

  // グレードマスタ
  const grData = [
    { code: 1, name: "素材品" }, { code: 2, name: "再生ペレット" }, { code: 3, name: "バージン" },
    { code: 4, name: "オフグレード" }, { code: 5, name: "廃プラ" }, { code: 6, name: "RPF原料" },
    { code: 7, name: "油化用原料" },
  ];
  const grMap: Record<number, string> = {};
  for (const g of grData) { const r = await prisma.productGrade.create({ data: g }); grMap[g.code] = r.id; }

  // 工場マスタ
  const plantMNH = await prisma.plant.create({ data: { code: "MNH", name: "美の浜工場", companyId: Company.CFP, address: "岡山県笠岡市美の浜", tel: "0865-XX-XXXX" } });
  const plantTKM = await prisma.plant.create({ data: { code: "TKM", name: "高松工場", companyId: Company.CFP, address: "香川県高松市", tel: "087-XXX-XXXX" } });
  const plantYKC = await prisma.plant.create({ data: { code: "YKC", name: "四日市工場", companyId: Company.CFP, address: "三重県四日市市", tel: "059-XXX-XXXX" } });
  const plantOCC = await prisma.plant.create({ data: { code: "OCC", name: "岡山ケミカルセンター", companyId: Company.CFP, address: "岡山県倉敷市", tel: "086-XXX-XXXX" } });
  const plantARM = await prisma.plant.create({ data: { code: "ARM", name: "嵐山工場", companyId: Company.CFP, address: "埼玉県嵐山町", tel: "0493-XX-XXXX" } });

  // 倉庫マスタ
  const wMNH1 = await prisma.warehouse.create({ data: { code: "W-MNH-1", name: "美の浜第1倉庫", type: WarehouseType.INTERNAL, plantId: plantMNH.id } });
  const wMNH2 = await prisma.warehouse.create({ data: { code: "W-MNH-2", name: "美の浜第2倉庫", type: WarehouseType.INTERNAL, plantId: plantMNH.id } });
  await prisma.warehouse.create({ data: { code: "W-MNH-3", name: "美の浜第3倉庫", type: WarehouseType.INTERNAL, plantId: plantMNH.id } });
  await prisma.warehouse.create({ data: { code: "W-MNH-4", name: "美の浜第4倉庫", type: WarehouseType.INTERNAL, plantId: plantMNH.id } });
  const wTKM = await prisma.warehouse.create({ data: { code: "W-TKM-1", name: "高松倉庫", type: WarehouseType.INTERNAL, plantId: plantTKM.id } });
  await prisma.warehouse.create({ data: { code: "W-TKM-2", name: "高松第2倉庫", type: WarehouseType.INTERNAL, plantId: plantTKM.id } });
  const wYKC1 = await prisma.warehouse.create({ data: { code: "W-YKC-1", name: "四日市第1倉庫", type: WarehouseType.INTERNAL, plantId: plantYKC.id } });
  await prisma.warehouse.create({ data: { code: "W-YKC-2", name: "四日市第2倉庫", type: WarehouseType.INTERNAL, plantId: plantYKC.id } });
  const wOCC = await prisma.warehouse.create({ data: { code: "W-OCC-1", name: "岡ケミ第1倉庫", type: WarehouseType.INTERNAL, plantId: plantOCC.id } });
  await prisma.warehouse.create({ data: { code: "W-EXT-SENKO", name: "センコー寄島倉庫", type: WarehouseType.EXTERNAL, address: "岡山県浅口市寄島町" } });
  await prisma.warehouse.create({ data: { code: "W-EXT-NIHON", name: "日本コンセプト阪神", type: WarehouseType.EXTERNAL, address: "兵庫県尼崎市" } });
  await prisma.warehouse.create({ data: { code: "W-EXT-NIYAK", name: "ニヤク尼崎", type: WarehouseType.EXTERNAL, address: "兵庫県尼崎市" } });
  await prisma.warehouse.create({ data: { code: "W-EXT-KOBE", name: "神戸港倉庫", type: WarehouseType.EXTERNAL, address: "兵庫県神戸市" } });
  await prisma.warehouse.create({ data: { code: "W-EXT-YOKOHAMA", name: "横浜港倉庫", type: WarehouseType.EXTERNAL, address: "神奈川県横浜市" } });

  // タンクマスタ
  const tk01 = await prisma.tank.create({ data: { code: "TK-01", name: "軽質油タンクA", tankType: TankType.LIGHT_OIL, plantId: plantOCC.id, capacity: 50000, currentLevel: 32500 } });
  const tk02 = await prisma.tank.create({ data: { code: "TK-02", name: "軽質油タンクB", tankType: TankType.LIGHT_OIL, plantId: plantOCC.id, capacity: 50000, currentLevel: 12000 } });
  await prisma.tank.create({ data: { code: "TK-03", name: "重質油タンク", tankType: TankType.HEAVY_OIL, plantId: plantOCC.id, capacity: 30000, currentLevel: 18500 } });
  await prisma.tank.create({ data: { code: "TK-04", name: "混合油タンク", tankType: TankType.MIXED_OIL, plantId: plantOCC.id, capacity: 40000, currentLevel: 8200 } });
  await prisma.tank.create({ data: { code: "TK-05", name: "残渣タンク", tankType: TankType.RESIDUE, plantId: plantOCC.id, capacity: 20000, currentLevel: 14000 } });
  await prisma.tank.create({ data: { code: "TK-06", name: "軽質油タンク", tankType: TankType.LIGHT_OIL, plantId: plantMNH.id, capacity: 30000, currentLevel: 22000 } });

  // 銀行口座
  await prisma.bankAccount.create({ data: { bankName: "広島銀行", branchName: "福山支店", accountType: "普通", accountNumber: "1234567", accountHolder: "カ）シーエフピー", companyId: Company.CFP, isDefault: true } });
  await prisma.bankAccount.create({ data: { bankName: "中国銀行", branchName: "笠岡支店", accountType: "普通", accountNumber: "2345678", accountHolder: "カ）シーエフピー", companyId: Company.CFP } });
  await prisma.bankAccount.create({ data: { bankName: "三菱UFJ銀行", branchName: "福山支店", accountType: "普通", accountNumber: "3456789", accountHolder: "カ）リサイクルエナジー", companyId: Company.RE } });

  // ===== 取引先マスタ (15社) =====
  console.log("🏢 Creating business partners...");
  const bpToyo = await prisma.businessPartner.create({ data: { code: "C-001", name: "東洋プラスチック株式会社", nameKana: "トウヨウプラスチック", isCustomer: true, isDelivery: true, postalCode: "103-0027", prefecture: "東京都", city: "中央区", address: "日本橋1-1-1", tel: "03-1234-5678", fax: "03-1234-5679", email: "order@toyo-plastic.co.jp", closingDay: ClosingDay.END_OF_MONTH, paymentSiteMonths: 1, paymentSiteDay: 31, invoiceNumber: "T1234567890123", isIsccCertified: true, isccCertNumber: "ISCC-EU-345678" } });
  const bpKansai = await prisma.businessPartner.create({ data: { code: "C-002", name: "関西化学工業株式会社", nameKana: "カンサイカガクコウギョウ", isCustomer: true, isDelivery: true, postalCode: "530-0001", prefecture: "大阪府", city: "大阪市北区", address: "梅田2-2-2", tel: "06-9876-5432", fax: "06-9876-5433", email: "purchase@kansai-chem.co.jp", closingDay: ClosingDay.DAY_20, paymentSiteMonths: 1, paymentSiteDay: 31 } });
  const bpMarubeni = await prisma.businessPartner.create({ data: { code: "C-003", name: "株式会社丸紅プラスチック", nameKana: "マルベニプラスチック", isCustomer: true, postalCode: "100-0004", prefecture: "東京都", city: "千代田区", address: "大手町1-6-1", tel: "03-2222-3333", closingDay: ClosingDay.END_OF_MONTH, paymentSiteMonths: 2, paymentSiteDay: 31, isIsccCertified: true, isccCertNumber: "ISCC-EU-345679" } });
  const bpHindustan = await prisma.businessPartner.create({ data: { code: "C-004", name: "HINDUSTAN POLYMERS PVT. LTD.", nameKana: "ヒンドゥスタンポリマーズ", isCustomer: true, isOverseas: true, countryCode: "IN", address: "Plot No.123, MIDC Industrial Area, Mumbai 400093, India", tel: "+91-22-1234-5678", email: "import@hindustan-polymers.com", currency: Currency.USD, closingDay: ClosingDay.END_OF_MONTH } });
  const bpChubu = await prisma.businessPartner.create({ data: { code: "C-005", name: "中部石油化学株式会社", nameKana: "チュウブセキユカガク", isCustomer: true, postalCode: "460-0008", prefecture: "愛知県", city: "名古屋市中区", address: "栄3-3-3", tel: "052-333-4444", closingDay: ClosingDay.DAY_25 } });
  const bpIndo = await prisma.businessPartner.create({ data: { code: "C-006", name: "PT. INDO PLASTICS", isCustomer: true, isOverseas: true, countryCode: "ID", address: "Jl. Industri No.45, Jakarta 12345, Indonesia", tel: "+62-21-5678-9012", currency: Currency.USD } });
  const bpThai = await prisma.businessPartner.create({ data: { code: "C-007", name: "THAI RECYCLING CO., LTD.", isCustomer: true, isOverseas: true, countryCode: "TH", address: "88/1 Moo 4, Bangna-Trad Rd, Bangkok 10260, Thailand", tel: "+66-2-345-6789", currency: Currency.USD } });

  const bpKyushu = await prisma.businessPartner.create({ data: { code: "S-001", name: "九州リサイクル株式会社", nameKana: "キュウシュウリサイクル", isSupplier: true, isPickup: true, postalCode: "812-0011", prefecture: "福岡県", city: "福岡市博多区", address: "博多駅前3-3-3", tel: "092-111-2222", closingDay: ClosingDay.END_OF_MONTH, isIsccCertified: true, isccCertNumber: "ISCC-EU-567890" } });
  const bpHiroshima = await prisma.businessPartner.create({ data: { code: "S-002", name: "広島産業廃棄物処理株式会社", nameKana: "ヒロシマサンギョウハイキブツショリ", isSupplier: true, isPickup: true, postalCode: "731-0138", prefecture: "広島県", city: "広島市安佐南区", address: "祇園4-4-4", tel: "082-333-4444", closingDay: ClosingDay.DAY_15 } });
  const bpHokuriku = await prisma.businessPartner.create({ data: { code: "S-003", name: "北陸ポリマー株式会社", nameKana: "ホクリクポリマー", isSupplier: true, isPickup: true, postalCode: "920-0031", prefecture: "石川県", city: "金沢市", address: "広岡1-1-1", tel: "076-444-5555", closingDay: ClosingDay.DAY_20 } });
  const bpKyushuOil = await prisma.businessPartner.create({ data: { code: "S-004", name: "九州石油化学株式会社", nameKana: "キュウシュウセキユカガク", isSupplier: true, postalCode: "802-0001", prefecture: "福岡県", city: "北九州市小倉北区", address: "浅野1-1-1", tel: "093-555-6666" } });
  const bpHiroshimaEnv = await prisma.businessPartner.create({ data: { code: "S-005", name: "広島環境サービス株式会社", nameKana: "ヒロシマカンキョウサービス", isSupplier: true, postalCode: "733-0002", prefecture: "広島県", city: "広島市西区", address: "楠木町1-1-1", tel: "082-555-6666" } });

  const bpChugoku = await prisma.businessPartner.create({ data: { code: "T-001", name: "中国運輸株式会社", nameKana: "チュウゴクウンユ", isCarrier: true, postalCode: "720-0812", prefecture: "広島県", city: "福山市", address: "東深津町5-5-5", tel: "084-555-6666", closingDay: ClosingDay.END_OF_MONTH } });
  const bpRE = await prisma.businessPartner.create({ data: { code: "RE-001", name: "株式会社リサイクルエナジー", nameKana: "リサイクルエナジー", shortName: "RE", companyId: Company.RE, isCustomer: true, isSupplier: true, postalCode: "720-0812", prefecture: "広島県", city: "福山市", address: "東深津町6-6-6", tel: "084-666-7777", closingDay: ClosingDay.END_OF_MONTH } });
  const bpCTS = await prisma.businessPartner.create({ data: { code: "CTS-001", name: "CTS PTE. LTD.", shortName: "CTS", companyId: Company.CTS, isCustomer: true, isSupplier: true, isOverseas: true, countryCode: "SG", address: "1 Raffles Place, #20-01, Singapore 048616", tel: "+65-6789-0123", currency: Currency.SGD } });

  // 取引先担当者
  await prisma.partnerContact.create({ data: { partnerId: bpToyo.id, name: "鈴木 太郎", department: "購買部", position: "部長", tel: "03-1234-5680", email: "suzuki@toyo-plastic.co.jp", isPrimary: true } });
  await prisma.partnerContact.create({ data: { partnerId: bpKansai.id, name: "佐々木 一郎", department: "資材調達部", position: "課長", tel: "06-9876-5434", email: "sasaki@kansai-chem.co.jp", isPrimary: true } });
  await prisma.partnerContact.create({ data: { partnerId: bpKyushu.id, name: "原田 次郎", department: "営業部", position: "担当", tel: "092-111-2223", email: "harada@kyushu-recycle.co.jp", isPrimary: true } });

  // ===== 商品マスタ (20品目) =====
  console.log("🏭 Creating products...");
  // code: "品名code-形状code-色code-グレードcode"
  const prodPPpelNA = await prisma.product.create({ data: { code: "1-1-1-1", nameId: pnMap[1], shapeId: shMap[1], colorId: clMap[1], gradeId: grMap[1], displayName: "PP ペレット ナチュラル 素材品" } });
  const prodPPcrsWB = await prisma.product.create({ data: { code: "1-3-2-2", nameId: pnMap[1], shapeId: shMap[3], colorId: clMap[2], gradeId: grMap[2], displayName: "PP 粉砕 白 再生ペレット" } });
  const prodPEflmNA = await prisma.product.create({ data: { code: "2-4-1-1", nameId: pnMap[2], shapeId: shMap[4], colorId: clMap[1], gradeId: grMap[1], displayName: "PE フィルム ナチュラル 素材品" } });
  const prodABSinjBK = await prisma.product.create({ data: { code: "6-5-3-1", nameId: pnMap[6], shapeId: shMap[5], colorId: clMap[3], gradeId: grMap[1], displayName: "ABS 射出 黒 素材品" } });
  const prodPSpelWA = await prisma.product.create({ data: { code: "4-1-2-1", nameId: pnMap[4], shapeId: shMap[1], colorId: clMap[2], gradeId: grMap[1], displayName: "PS ペレット 白 素材品" } });
  const prodPMMAflmYL = await prisma.product.create({ data: { code: "5-4-7-2", nameId: pnMap[5], shapeId: shMap[4], colorId: clMap[7], gradeId: grMap[2], displayName: "PMMA フィルム 黄 再生ペレット" } });
  const prodPETflkMIX = await prisma.product.create({ data: { code: "3-2-9-5", nameId: pnMap[3], shapeId: shMap[2], colorId: clMap[9], gradeId: grMap[5], displayName: "PET フレーク 混合色 廃プラ" } });
  const prodPPpelWA = await prisma.product.create({ data: { code: "1-1-2-1", nameId: pnMap[1], shapeId: shMap[1], colorId: clMap[2], gradeId: grMap[1], displayName: "PP ペレット 白 素材品" } });
  const prodPEpelNA = await prisma.product.create({ data: { code: "2-1-1-1", nameId: pnMap[2], shapeId: shMap[1], colorId: clMap[1], gradeId: grMap[1], displayName: "PE ペレット ナチュラル 素材品" } });
  const prodABSpelBK = await prisma.product.create({ data: { code: "6-1-3-2", nameId: pnMap[6], shapeId: shMap[1], colorId: clMap[3], gradeId: grMap[2], displayName: "ABS ペレット 黒 再生ペレット" } });
  const prodPPinjNB = await prisma.product.create({ data: { code: "1-5-1-4", nameId: pnMap[1], shapeId: shMap[5], colorId: clMap[1], gradeId: grMap[4], displayName: "PP 射出 ナチュラル オフグレード" } });
  const prodPPcrsNB = await prisma.product.create({ data: { code: "1-3-1-4", nameId: pnMap[1], shapeId: shMap[3], colorId: clMap[1], gradeId: grMap[4], displayName: "PP 粉砕 ナチュラル オフグレード" } });
  // 油化品目
  const prodCPO = await prisma.product.create({ data: { code: "900-7-1-7", nameId: pnMap[900], shapeId: shMap[7], colorId: clMap[1], gradeId: grMap[7], displayName: "Circular Pyrolysis Oil", isOilProduct: true, isIsccEligible: true } });
  const prodLightOil = await prisma.product.create({ data: { code: "901-7-1-7", nameId: pnMap[901], shapeId: shMap[7], colorId: clMap[1], gradeId: grMap[7], displayName: "軽質油（Circular Naphtha）", isOilProduct: true, isIsccEligible: true } });
  const prodHeavyOil = await prisma.product.create({ data: { code: "902-7-1-7", nameId: pnMap[902], shapeId: shMap[7], colorId: clMap[1], gradeId: grMap[7], displayName: "重質油", isOilProduct: true } });
  // 油化原料
  const prodPPwaste = await prisma.product.create({ data: { code: "1-3-9-5", nameId: pnMap[1], shapeId: shMap[3], colorId: clMap[9], gradeId: grMap[5], displayName: "PP廃プラスチック（油化用）" } });
  const prodPEwaste = await prisma.product.create({ data: { code: "2-3-9-5", nameId: pnMap[2], shapeId: shMap[3], colorId: clMap[9], gradeId: grMap[5], displayName: "PE混合廃プラ（油化用）" } });
  const prodPSwaste = await prisma.product.create({ data: { code: "4-3-9-5", nameId: pnMap[4], shapeId: shMap[3], colorId: clMap[9], gradeId: grMap[5], displayName: "PS廃プラスチック（油化用）" } });
  const prodHDPEpelNA = await prisma.product.create({ data: { code: "10-1-1-1", nameId: pnMap[10], shapeId: shMap[1], colorId: clMap[1], gradeId: grMap[1], displayName: "HDPE ペレット ナチュラル 素材品" } });
  const prodPCcrsT = await prisma.product.create({ data: { code: "7-3-10-4", nameId: pnMap[7], shapeId: shMap[3], colorId: clMap[10], gradeId: grMap[4], displayName: "PC 粉砕 透明 オフグレード" } });

  // ===== 顧客単価マスタ =====
  await prisma.customerPrice.createMany({ data: [
    { partnerId: bpToyo.id, productId: prodPPpelNA.id, unitPrice: 185, validFrom: new Date("2026-01-01") },
    { partnerId: bpToyo.id, productId: prodPEpelNA.id, unitPrice: 165, validFrom: new Date("2026-01-01") },
    { partnerId: bpKansai.id, productId: prodPSpelWA.id, unitPrice: 175, validFrom: new Date("2026-01-01") },
    { partnerId: bpKansai.id, productId: prodPMMAflmYL.id, unitPrice: 210, validFrom: new Date("2026-01-01") },
    { partnerId: bpMarubeni.id, productId: prodABSpelBK.id, unitPrice: 165, validFrom: new Date("2026-01-01") },
    { partnerId: bpKansai.id, productId: prodCPO.id, unitPrice: 95, validFrom: new Date("2026-01-01") },
    { partnerId: bpHindustan.id, productId: prodPPpelNA.id, unitPrice: 0.85, currency: Currency.USD, validFrom: new Date("2026-01-01") },
    { partnerId: bpChubu.id, productId: prodLightOil.id, unitPrice: 98, validFrom: new Date("2026-01-01") },
  ]});

  // ===== 為替レート =====
  await prisma.exchangeRate.createMany({ data: [
    { fromCurrency: Currency.USD, toCurrency: Currency.JPY, rate: 149.50, effectiveDate: new Date("2026-01-01") },
    { fromCurrency: Currency.SGD, toCurrency: Currency.JPY, rate: 111.90, effectiveDate: new Date("2026-01-01") },
    { fromCurrency: Currency.USD, toCurrency: Currency.JPY, rate: 149.80, effectiveDate: new Date("2026-02-01") },
    { fromCurrency: Currency.SGD, toCurrency: Currency.JPY, rate: 112.20, effectiveDate: new Date("2026-02-01") },
    { fromCurrency: Currency.USD, toCurrency: Currency.JPY, rate: 150.25, effectiveDate: new Date("2026-03-01") },
    { fromCurrency: Currency.SGD, toCurrency: Currency.JPY, rate: 112.80, effectiveDate: new Date("2026-03-01") },
  ]});

  // ===== 採番マスタ =====
  const seqPrefixes = ["PUR","SHP","SLS","INV","PAY","PRC","CRM","CPO","LAB","APR","EXP","QUO","CNT","TRC","OIL","DSP"];
  for (const prefix of seqPrefixes) {
    await prisma.numberSequence.create({ data: { prefix, year: 2026, currentNumber: 0 } });
  }

  // ===== システム設定 =====
  const settings = [
    { key: "company.cfp.name", value: "株式会社CFP", category: "company" },
    { key: "company.cfp.invoice_number", value: "T6-2400-0103-4983", category: "company" },
    { key: "company.re.name", value: "株式会社リサイクルエナジー", category: "company" },
    { key: "company.cts.name", value: "CTS PTE. LTD.", category: "company" },
    { key: "tax.default_rate", value: "0.10", category: "tax" },
    { key: "tax.reduced_rate", value: "0.08", category: "tax" },
  ];
  for (const s of settings) { await prisma.systemSetting.create({ data: s }); }

  // ===== C. TRANSACTIONS =====
  console.log("💰 Creating transactions...");

  // ----- 仕入 (10件) -----
  const pur1 = await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0001", supplierId: bpKyushu.id, productId: prodPPcrsWB.id, packagingType: PackagingType.FLECON, warehouseId: wMNH1.id, quantity: 3200, unitPrice: 85, amount: 272000, freightCost: 35000, purchaseDate: new Date("2026-01-15"), arrivalDate: new Date("2026-01-17"), status: PurchaseStatus.CONFIRMED, createdBy: sales1.id } });
  const pur2 = await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0002", supplierId: bpHiroshima.id, productId: prodPEflmNA.id, packagingType: PackagingType.PALLET, warehouseId: wYKC1.id, quantity: 1800, unitPrice: 45, amount: 81000, freightCost: 28000, purchaseDate: new Date("2026-01-20"), arrivalDate: new Date("2026-01-22"), status: PurchaseStatus.CONFIRMED, createdBy: sales2.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0003", supplierId: bpKyushu.id, productId: prodPPpelNA.id, packagingType: PackagingType.FLECON, warehouseId: wTKM.id, quantity: 5000, unitPrice: 120, amount: 600000, freightCost: 42000, purchaseDate: new Date("2026-02-05"), arrivalDate: new Date("2026-02-07"), status: PurchaseStatus.CONFIRMED, createdBy: sales1.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0004", supplierId: bpHokuriku.id, productId: prodABSinjBK.id, packagingType: PackagingType.STEEL_BOX, warehouseId: wMNH2.id, quantity: 2400, unitPrice: 95, amount: 228000, freightCost: 32000, purchaseDate: new Date("2026-02-10"), arrivalDate: new Date("2026-02-12"), status: PurchaseStatus.CONFIRMED, createdBy: sales2.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0005", supplierId: bpHiroshima.id, productId: prodPMMAflmYL.id, packagingType: PackagingType.PALLET, warehouseId: wMNH1.id, quantity: 1200, unitPrice: 65, amount: 78000, freightCost: 25000, purchaseDate: new Date("2026-02-15"), arrivalDate: new Date("2026-02-17"), status: PurchaseStatus.CONFIRMED, createdBy: sales1.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0006", supplierId: bpKyushu.id, productId: prodPETflkMIX.id, packagingType: PackagingType.FLECON, warehouseId: wYKC1.id, quantity: 4500, unitPrice: 30, amount: 135000, freightCost: 38000, purchaseDate: new Date("2026-02-20"), status: PurchaseStatus.CONFIRMED, createdBy: sales2.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0007", supplierId: bpKyushu.id, productId: prodPPcrsWB.id, packagingType: PackagingType.FLECON, warehouseId: wTKM.id, quantity: 5000, unitPrice: 88, amount: 440000, freightCost: 42000, purchaseDate: new Date("2026-03-05"), arrivalDate: new Date("2026-03-07"), status: PurchaseStatus.CONFIRMED, createdBy: sales1.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0008", supplierId: bpHiroshima.id, productId: prodPEflmNA.id, packagingType: PackagingType.PALLET, warehouseId: wMNH1.id, quantity: 2000, unitPrice: 48, amount: 96000, freightCost: 25000, purchaseDate: new Date("2026-03-10"), arrivalDate: new Date("2026-03-11"), status: PurchaseStatus.RECEIVED, createdBy: sales2.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0009", supplierId: bpHokuriku.id, productId: prodPCcrsT.id, packagingType: PackagingType.STEEL_BOX, warehouseId: wMNH2.id, quantity: 1500, unitPrice: 110, amount: 165000, purchaseDate: new Date("2026-03-12"), status: PurchaseStatus.PLANNED, createdBy: sales1.id } });
  await prisma.purchase.create({ data: { purchaseNumber: "PUR-2026-0010", supplierId: bpKyushu.id, productId: prodPSpelWA.id, packagingType: PackagingType.PAPER_BAG, warehouseId: wMNH1.id, quantity: 4100, unitPrice: 75, amount: 307500, purchaseDate: new Date("2026-03-14"), status: PurchaseStatus.PLANNED, createdBy: sales2.id } });

  // ----- 在庫 (8件) -----
  await prisma.inventory.create({ data: { productId: prodPPcrsWB.id, warehouseId: wMNH1.id, pickupPartnerId: bpKyushu.id, packagingType: PackagingType.FLECON, quantity: 12500, movingAvgCost: 92 } });
  await prisma.inventory.create({ data: { productId: prodPMMAflmYL.id, warehouseId: wMNH1.id, pickupPartnerId: bpHiroshima.id, packagingType: PackagingType.PALLET, quantity: 3400, movingAvgCost: 72 } });
  await prisma.inventory.create({ data: { productId: prodABSinjBK.id, warehouseId: wMNH2.id, pickupPartnerId: bpHokuriku.id, packagingType: PackagingType.STEEL_BOX, quantity: 8200, movingAvgCost: 105 } });
  await prisma.inventory.create({ data: { productId: prodPPpelNA.id, warehouseId: wTKM.id, pickupPartnerId: bpKyushu.id, packagingType: PackagingType.FLECON, quantity: 18700, movingAvgCost: 135 } });
  await prisma.inventory.create({ data: { productId: prodPEflmNA.id, warehouseId: wYKC1.id, pickupPartnerId: bpHiroshima.id, packagingType: PackagingType.PALLET, quantity: 6300, movingAvgCost: 58 } });
  await prisma.inventory.create({ data: { productId: prodPETflkMIX.id, warehouseId: wYKC1.id, pickupPartnerId: bpKyushu.id, packagingType: PackagingType.FLECON, quantity: 15200, movingAvgCost: 38 } });
  await prisma.inventory.create({ data: { productId: prodPPcrsWB.id, warehouseId: wOCC.id, pickupPartnerId: bpKyushu.id, packagingType: PackagingType.FLECON, quantity: 9800, movingAvgCost: 88 } });
  await prisma.inventory.create({ data: { productId: prodPSpelWA.id, warehouseId: wMNH1.id, pickupPartnerId: bpKyushu.id, packagingType: PackagingType.PAPER_BAG, quantity: 4100, movingAvgCost: 115 } });

  // ----- 加工指示 (5件) -----
  await prisma.processingOrder.create({ data: { orderNumber: "PRC-2026-0001", plantId: plantTKM.id, processType: ProcessType.EXTRUDER, inputProductId: prodPPcrsWB.id, inputQuantity: 5000, outputProductId: prodPPpelWA.id, outputQuantity: 4900, yieldRate: 98.0, orderDate: new Date("2026-02-10"), completedDate: new Date("2026-02-12"), status: "COMPLETED", note: "温度設定: 220℃、スクリュー回転数: 150rpm", createdBy: production.id } });
  await prisma.processingOrder.create({ data: { orderNumber: "PRC-2026-0002", plantId: plantMNH.id, processType: ProcessType.EXTRUDER, inputProductId: prodABSinjBK.id, inputQuantity: 2400, outputProductId: prodABSpelBK.id, outputQuantity: 2280, yieldRate: 95.0, orderDate: new Date("2026-02-20"), completedDate: new Date("2026-02-22"), status: "COMPLETED", note: "温度設定: 230℃", createdBy: production.id } });
  await prisma.processingOrder.create({ data: { orderNumber: "PRC-2026-0003", plantId: plantYKC.id, processType: ProcessType.CRUSHING, inputProductId: prodPPinjNB.id, inputQuantity: 4000, outputProductId: prodPPcrsNB.id, outputQuantity: 3920, yieldRate: 98.0, orderDate: new Date("2026-03-05"), completedDate: new Date("2026-03-06"), status: "COMPLETED", note: "メッシュ: 15mm", createdBy: production.id } });
  await prisma.processingOrder.create({ data: { orderNumber: "PRC-2026-0004", plantId: plantTKM.id, processType: ProcessType.EXTRUDER, inputProductId: prodPPcrsWB.id, inputQuantity: 5000, outputProductId: prodPPpelWA.id, orderDate: new Date("2026-03-12"), status: "IN_PROGRESS", note: "温度設定: 220℃", createdBy: production.id } });
  await prisma.processingOrder.create({ data: { orderNumber: "PRC-2026-0005", plantId: plantMNH.id, processType: ProcessType.REPACK, inputProductId: prodPPpelNA.id, inputQuantity: 1000, outputProductId: prodPPpelNA.id, outputQuantity: 995, yieldRate: 99.5, orderDate: new Date("2026-03-10"), completedDate: new Date("2026-03-10"), status: "COMPLETED", note: "フレコン→紙袋25kg×40袋", createdBy: production.id } });

  // ----- 出荷 (6件) -----
  const shp1 = await prisma.shipment.create({ data: { shipmentNumber: "SHP-2026-0001", customerId: bpToyo.id, productId: prodPPpelNA.id, packagingType: PackagingType.FLECON, warehouseId: wTKM.id, quantity: 5000, unitPrice: 185, amount: 925000, deliveryDate: new Date("2026-03-10"), shipmentDate: new Date("2026-03-10"), status: ShipmentStatus.COMPLETED, createdBy: sales1.id } });
  const shp2 = await prisma.shipment.create({ data: { shipmentNumber: "SHP-2026-0002", customerId: bpKansai.id, productId: prodPSpelWA.id, warehouseId: wMNH1.id, quantity: 4100, unitPrice: 175, amount: 717500, deliveryDate: new Date("2026-03-08"), shipmentDate: new Date("2026-03-08"), status: ShipmentStatus.COMPLETED, createdBy: sales1.id } });
  const shp3 = await prisma.shipment.create({ data: { shipmentNumber: "SHP-2026-0003", customerId: bpMarubeni.id, productId: prodABSpelBK.id, warehouseId: wMNH2.id, quantity: 2280, unitPrice: 165, amount: 376200, deliveryDate: new Date("2026-03-11"), shipmentDate: new Date("2026-03-11"), status: ShipmentStatus.WEIGHING, createdBy: sales2.id } });
  const shp4 = await prisma.shipment.create({ data: { shipmentNumber: "SHP-2026-0004", customerId: bpHindustan.id, productId: prodPPpelNA.id, warehouseId: wTKM.id, quantity: 20000, unitPrice: 0.85, amount: 17000, vanningDate: new Date("2026-03-10"), shipmentDate: new Date("2026-03-10"), status: ShipmentStatus.LOADING, isIsccEligible: false, note: "FOB Kobe / 40ft Container", createdBy: sales1.id } });
  const shp5 = await prisma.shipment.create({ data: { shipmentNumber: "SHP-2026-0005", customerId: bpToyo.id, productId: prodPEflmNA.id, warehouseId: wYKC1.id, quantity: 3000, unitPrice: 165, amount: 495000, deliveryDate: new Date("2026-03-13"), status: ShipmentStatus.SHIPPING_LIST, createdBy: sales2.id } });
  const shp6 = await prisma.shipment.create({ data: { shipmentNumber: "SHP-2026-0006", customerId: bpKansai.id, productId: prodPMMAflmYL.id, warehouseId: wMNH1.id, quantity: 1200, unitPrice: 210, amount: 252000, deliveryDate: new Date("2026-03-14"), status: ShipmentStatus.CARGO_SELECTED, createdBy: sales1.id } });

  // ----- 配車 (4件) -----
  await prisma.dispatch.create({ data: { shipmentId: shp1.id, carrierId: bpChugoku.id, vehicleNumber: "福山 100 あ 1234", driverName: "山本 太郎", freightCost: 45000, dispatchDate: new Date("2026-03-10"), createdBy: assistant.id } });
  await prisma.dispatch.create({ data: { shipmentId: shp2.id, carrierId: bpChugoku.id, vehicleNumber: "岡山 200 い 5678", driverName: "田中 一郎", freightCost: 28000, dispatchDate: new Date("2026-03-08"), createdBy: assistant.id } });
  await prisma.dispatch.create({ data: { shipmentId: shp3.id, carrierId: bpChugoku.id, vehicleNumber: "福山 300 う 9012", driverName: "佐藤 二郎", freightCost: 52000, dispatchDate: new Date("2026-03-11"), createdBy: assistant.id } });
  await prisma.dispatch.create({ data: { shipmentId: shp4.id, carrierId: bpChugoku.id, vehicleNumber: "MSKU1234567", driverName: "（顧客手配）", freightCost: 0, dispatchDate: new Date("2026-03-10"), note: "神戸港→Mumbai", createdBy: assistant.id } });

  // ----- 受注 (4件) -----
  const so1 = await prisma.salesOrder.create({ data: { orderNumber: "SLS-2026-0001", customerId: bpToyo.id, orderDate: new Date("2026-03-05"), deliveryDate: new Date("2026-03-10"), subtotal: 925000, taxAmount: 92500, total: 1017500, status: "SHIPPED", createdBy: sales1.id, items: { create: [{ productId: prodPPpelNA.id, quantity: 5000, unitPrice: 185, amount: 925000, taxRate: 0.10 }] } } });
  await prisma.salesOrder.create({ data: { orderNumber: "SLS-2026-0002", customerId: bpKansai.id, orderDate: new Date("2026-03-06"), deliveryDate: new Date("2026-03-08"), subtotal: 717500, taxAmount: 71750, total: 789250, status: "COMPLETED", createdBy: sales1.id, items: { create: [{ productId: prodPSpelWA.id, quantity: 4100, unitPrice: 175, amount: 717500, taxRate: 0.10 }] } } });
  await prisma.salesOrder.create({ data: { orderNumber: "SLS-2026-0003", customerId: bpHindustan.id, orderDate: new Date("2026-03-08"), deliveryDate: new Date("2026-04-05"), subtotal: 17000, taxAmount: 0, total: 17000, currency: Currency.USD, status: "CONFIRMED", note: "FOB Kobe", createdBy: sales1.id, items: { create: [{ productId: prodPPpelNA.id, quantity: 20000, unitPrice: 0.85, amount: 17000, taxRate: 0 }] } } });
  await prisma.salesOrder.create({ data: { orderNumber: "SLS-2026-0004", customerId: bpMarubeni.id, orderDate: new Date("2026-03-10"), deliveryDate: new Date("2026-03-14"), subtotal: 376200, taxAmount: 37620, total: 413820, status: "CONFIRMED", createdBy: sales2.id, items: { create: [{ productId: prodABSpelBK.id, quantity: 2280, unitPrice: 165, amount: 376200, taxRate: 0.10 }] } } });

  // ----- 売上 (8件) -----
  const inv1 = await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-0001", customerId: bpToyo.id, prevBalance: 1250000, paymentReceived: 1250000, carryover: 0, subtotal: 925000, taxAmount: 92500, total: 1017500, billingDate: new Date("2026-03-15"), dueDate: new Date("2026-04-30"), closingDay: ClosingDay.END_OF_MONTH, status: InvoiceStatus.ISSUED, createdBy: accounting.id } });
  const inv2 = await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-0002", customerId: bpKansai.id, prevBalance: 789250, paymentReceived: 789250, carryover: 0, subtotal: 717500, taxAmount: 71750, total: 789250, billingDate: new Date("2026-03-20"), dueDate: new Date("2026-04-30"), closingDay: ClosingDay.DAY_20, status: InvoiceStatus.SENT, createdBy: accounting.id } });
  const inv3 = await prisma.invoice.create({ data: { invoiceNumber: "INV-2026-0003", customerId: bpKansai.id, prevBalance: 0, paymentReceived: 0, carryover: 0, subtotal: 1805000, taxAmount: 180500, total: 1985500, billingDate: new Date("2026-02-28"), dueDate: new Date("2026-03-31"), status: InvoiceStatus.PAID, createdBy: accounting.id } });

  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0001", division: Division.MR, productId: prodPPpelNA.id, shipmentId: shp1.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-03-10"), billingDate: new Date("2026-03-15"), shipmentDate: new Date("2026-03-10"), quantity: 5000, unitPrice: 185, amount: 925000, taxAmount: 92500, invoiceId: inv1.id, createdBy: accounting.id } });
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0002", division: Division.MR, productId: prodPSpelWA.id, shipmentId: shp2.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-03-08"), billingDate: new Date("2026-03-20"), shipmentDate: new Date("2026-03-08"), quantity: 4100, unitPrice: 175, amount: 717500, taxAmount: 71750, invoiceId: inv2.id, createdBy: accounting.id } });
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0003", division: Division.CR, productId: prodCPO.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-03-05"), billingDate: new Date("2026-02-28"), shipmentDate: new Date("2026-03-05"), quantity: 19000, unitPrice: 95, amount: 1805000, taxAmount: 180500, invoiceId: inv3.id, createdBy: accounting.id } });
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0004", companyId: Company.RE, division: Division.MR, productId: prodPPpelWA.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-03-01"), quantity: 5000, unitPrice: 15, amount: 75000, taxAmount: 7500, note: "加工賃（ルーダー）", createdBy: accounting.id } });
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0005", division: Division.MR, productId: prodPPpelNA.id, shipmentId: shp4.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-03-10"), shipmentDate: new Date("2026-03-10"), quantity: 20000, unitPrice: 0.85, amount: 17000, taxAmount: 0, isExportExempt: true, note: "HINDUSTAN POLYMERS FOB Kobe", createdBy: accounting.id } });
  // 1月・2月分売上
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0006", division: Division.MR, productId: prodPPpelNA.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-01-15"), quantity: 8000, unitPrice: 185, amount: 1480000, taxAmount: 148000, createdBy: accounting.id } });
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0007", division: Division.MR, productId: prodABSpelBK.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-01-20"), quantity: 3000, unitPrice: 165, amount: 495000, taxAmount: 49500, createdBy: accounting.id } });
  await prisma.revenue.create({ data: { revenueNumber: "SL-2026-0008", division: Division.MR, productId: prodPEflmNA.id, salesCategory: SalesCategory.SALES, revenueDate: new Date("2026-02-10"), quantity: 5000, unitPrice: 165, amount: 825000, taxAmount: 82500, createdBy: accounting.id } });

  // ----- 入金 (4件) -----
  await prisma.paymentReceived.create({ data: { paymentNumber: "PAY-2026-0001", customerId: bpKansai.id, paymentDate: new Date("2026-03-10"), amount: 1985500, paymentMethod: PaymentMethod.TRANSFER, isReconciled: true, note: "INV-2026-0003消込", createdBy: accounting.id } });
  await prisma.paymentReceived.create({ data: { paymentNumber: "PAY-2026-0002", customerId: bpToyo.id, paymentDate: new Date("2026-03-10"), amount: 1250000, paymentMethod: PaymentMethod.TRANSFER, isReconciled: true, note: "前月分消込", createdBy: accounting.id } });
  await prisma.paymentReceived.create({ data: { paymentNumber: "PAY-2026-0003", customerId: bpKansai.id, paymentDate: new Date("2026-03-15"), amount: 789250, paymentMethod: PaymentMethod.TRANSFER, isReconciled: false, createdBy: accounting.id } });
  await prisma.paymentReceived.create({ data: { paymentNumber: "PAY-2026-0004", customerId: bpMarubeni.id, paymentDate: new Date("2026-03-11"), amount: 550000, paymentMethod: PaymentMethod.TRANSFER, isReconciled: false, note: "一部入金", createdBy: accounting.id } });

  // ----- 支払 (3件) -----
  await prisma.paymentPayable.create({ data: { paymentNumber: "PP-2026-0001", supplierId: bpKyushu.id, paymentDate: new Date("2026-02-28"), amount: 872000, paymentMethod: PaymentMethod.TRANSFER, isReconciled: true, createdBy: accounting.id } });
  await prisma.paymentPayable.create({ data: { paymentNumber: "PP-2026-0002", supplierId: bpHiroshima.id, paymentDate: new Date("2026-02-28"), amount: 159000, paymentMethod: PaymentMethod.TRANSFER, isReconciled: true, createdBy: accounting.id } });
  await prisma.paymentPayable.create({ data: { paymentNumber: "PP-2026-0003", supplierId: bpChugoku.id, paymentDate: new Date("2026-03-31"), amount: 125000, paymentMethod: PaymentMethod.TRANSFER, isReconciled: false, note: "3月分運賃", createdBy: accounting.id } });

  // ===== D. CR事業（油化） =====
  console.log("🛢️  Creating CR (oil) data...");
  const crm1 = await prisma.crMaterial.create({ data: { materialNumber: "CRM-2026-0001", supplierId: bpKyushu.id, materialName: "PP廃プラスチック", quantity: 8000, arrivalDate: new Date("2026-03-08"), status: CrMaterialStatus.PASSED, chlorineContent: 0.005, moistureContent: 1.2, createdBy: production.id } });
  const crm2 = await prisma.crMaterial.create({ data: { materialNumber: "CRM-2026-0002", supplierId: bpHiroshima.id, materialName: "PE混合廃プラ", quantity: 5500, arrivalDate: new Date("2026-03-10"), inspectionDate: new Date("2026-03-10"), status: CrMaterialStatus.PASSED, chlorineContent: 0.008, moistureContent: 1.5, createdBy: production.id } });
  const crm3 = await prisma.crMaterial.create({ data: { materialNumber: "CRM-2026-0003", supplierId: bpKyushu.id, materialName: "PS廃プラスチック", quantity: 6200, arrivalDate: new Date("2026-03-11"), status: CrMaterialStatus.INSPECTING, createdBy: production.id } });
  await prisma.crMaterial.create({ data: { materialNumber: "CRM-2026-0004", supplierId: bpKyushuOil.id, materialName: "PP/PE混合廃プラ", quantity: 7500, arrivalDate: new Date("2026-03-14"), status: CrMaterialStatus.PENDING, createdBy: production.id } });

  const cpo1 = await prisma.crProductionOrder.create({ data: { orderNumber: "CPO-2026-0001", plantId: plantOCC.id, orderDate: new Date("2026-03-08"), startDate: new Date("2026-03-09"), endDate: new Date("2026-03-10"), status: ProductionOrderStatus.COMPLETED, lightOilOutput: 4200, heavyOilOutput: 1400, residueOutput: 390, note: "PP単独投入、温度430℃", createdBy: production.id, materials: { create: [{ crMaterialId: crm1.id, quantity: 7800 }] } } });
  const cpo2 = await prisma.crProductionOrder.create({ data: { orderNumber: "CPO-2026-0002", plantId: plantOCC.id, orderDate: new Date("2026-03-11"), startDate: new Date("2026-03-12"), status: ProductionOrderStatus.PRODUCING, note: "PE:PS = 47:53、温度450℃", createdBy: production.id, materials: { create: [{ crMaterialId: crm2.id, quantity: 5500 }, { crMaterialId: crm3.id, quantity: 6200 }] } } });
  await prisma.crProductionOrder.create({ data: { orderNumber: "CPO-2026-0003", plantId: plantOCC.id, orderDate: new Date("2026-03-15"), status: ProductionOrderStatus.INSTRUCTED, note: "PP/PE混合、温度440℃", createdBy: production.id } });

  // 油出荷
  await prisma.oilShipment.create({ data: { shipmentNumber: "OIL-2026-0001", customerId: bpKansai.id, oilType: TankType.LIGHT_OIL, quantity: 19000, unitPrice: 95, amount: 1805000, shipmentDate: new Date("2026-03-05"), note: "ローリー 10t", createdBy: production.id } });
  await prisma.oilShipment.create({ data: { shipmentNumber: "OIL-2026-0002", customerId: bpChubu.id, oilType: TankType.LIGHT_OIL, quantity: 19000, unitPrice: 98, amount: 1862000, shipmentDate: new Date("2026-03-12"), note: "ISOコンテナ 19t", createdBy: production.id } });
  await prisma.oilShipment.create({ data: { shipmentNumber: "OIL-2026-0003", customerId: bpMarubeni.id, oilType: TankType.MIXED_OIL, quantity: 10000, unitPrice: 85, amount: 850000, shipmentDate: new Date("2026-03-08"), note: "ローリー 10t", createdBy: production.id } });

  // 残渣
  await prisma.residue.create({ data: { disposalDate: new Date("2026-02-15"), quantity: 1200, disposalMethod: "セメント原料化", disposalCost: 15000, contractor: "広島環境サービス" } });
  await prisma.residue.create({ data: { disposalDate: new Date("2026-03-10"), quantity: 390, disposalMethod: "有価物売却", contractor: "九州石油化学" } });

  // ===== E. 研究室 =====
  console.log("🔬 Creating lab data...");
  const sample1 = await prisma.labSample.create({ data: { sampleNumber: "LAB-2026-0001", sampleName: "CPO軽質油 260310ロット", productId: prodLightOil.id, source: "岡ケミ CR装置 CPO-2026-0001", receivedDate: new Date("2026-03-10"), status: SampleStatus.REPORTED, createdBy: labUser.id } });
  const sample2 = await prisma.labSample.create({ data: { sampleNumber: "LAB-2026-0002", sampleName: "CPO軽質油 260312ロット", productId: prodLightOil.id, source: "岡ケミ CR装置 CPO-2026-0002", receivedDate: new Date("2026-03-12"), status: SampleStatus.ANALYZING, createdBy: labUser.id } });
  const sample3 = await prisma.labSample.create({ data: { sampleNumber: "LAB-2026-0003", sampleName: "CPO混合油 260308ロット", productId: prodCPO.id, source: "美の浜 CR装置", receivedDate: new Date("2026-03-08"), status: SampleStatus.JUDGED, createdBy: labUser.id } });
  await prisma.labSample.create({ data: { sampleNumber: "LAB-2026-0004", sampleName: "PP再生ペレット品質確認", productId: prodPPpelNA.id, source: "高松工場 ルーダー", receivedDate: new Date("2026-03-11"), status: SampleStatus.RECEIVED, createdBy: labUser.id } });

  // 分析結果
  const tests = [
    { sampleId: sample1.id, testItem: "比重 (15℃)", result: "0.812", unit: "", standard: "0.78-0.85", isPassed: true, analysisDate: new Date("2026-03-10"), analyst: "中村 理恵" },
    { sampleId: sample1.id, testItem: "動粘度 (40℃)", result: "2.15", unit: "mm²/s", standard: "≤5.0", isPassed: true, analysisDate: new Date("2026-03-10"), analyst: "中村 理恵" },
    { sampleId: sample1.id, testItem: "硫黄分", result: "0.008", unit: "%", standard: "≤0.05", isPassed: true, analysisDate: new Date("2026-03-10"), analyst: "中村 理恵" },
    { sampleId: sample1.id, testItem: "引火点", result: "42", unit: "℃", standard: "≥21", isPassed: true, analysisDate: new Date("2026-03-10"), analyst: "中村 理恵" },
    { sampleId: sample1.id, testItem: "水分", result: "0.03", unit: "%", standard: "≤0.1", isPassed: true, analysisDate: new Date("2026-03-10"), analyst: "中村 理恵" },
    { sampleId: sample1.id, testItem: "残留塩素", result: "15", unit: "ppm", standard: "≤100", isPassed: true, analysisDate: new Date("2026-03-10"), analyst: "中村 理恵" },
    { sampleId: sample3.id, testItem: "比重 (15℃)", result: "0.845", unit: "", standard: "0.78-0.90", isPassed: true, analysisDate: new Date("2026-03-09"), analyst: "中村 理恵" },
    { sampleId: sample3.id, testItem: "動粘度 (40℃)", result: "3.42", unit: "mm²/s", standard: "≤5.0", isPassed: true, analysisDate: new Date("2026-03-09"), analyst: "中村 理恵" },
    { sampleId: sample3.id, testItem: "残留塩素", result: "28", unit: "ppm", standard: "≤100", isPassed: true, analysisDate: new Date("2026-03-09"), analyst: "中村 理恵" },
  ];
  await prisma.analysisResult.createMany({ data: tests });

  // 検査成績書
  await prisma.analysisCertificate.create({ data: { certificateNumber: "CERT-2026-0001", sampleId: sample1.id, issueDate: new Date("2026-03-11"), note: "関西化学工業向け" } });

  // 外部受託分析
  await prisma.externalAnalysis.create({ data: { sampleId: sample2.id, laboratoryName: "関西化学工業株式会社", requestDate: new Date("2026-03-12"), cost: 35000, note: "再生油サンプルA: 比重,動粘度,硫黄分,引火点" } });
  await prisma.externalAnalysis.create({ data: { sampleId: sample3.id, laboratoryName: "株式会社丸紅プラスチック", requestDate: new Date("2026-03-08"), resultDate: new Date("2026-03-12"), cost: 28000, note: "CPO品質確認用" } });
  await prisma.externalAnalysis.create({ data: { sampleId: sample1.id, laboratoryName: "中部石油化学株式会社", requestDate: new Date("2026-03-05"), resultDate: new Date("2026-03-10"), cost: 85000, note: "ナフサ代替評価 GC/MS全項目" } });

  // ===== G. ISCC・トレーサビリティ =====
  console.log("🌿 Creating ISCC & traceability...");
  const iscc1 = await prisma.isccCertificate.create({ data: { certNumber: "ISCC-EU-234567", partnerId: null, holderName: "株式会社CFP 岡山ケミカルセンター", scope: "Circular Pyrolysis Oil (軽質/重質/混合)", issueDate: new Date("2025-10-01"), expiryDate: new Date("2026-09-30"), status: "ACTIVE", createdBy: itAcct.id } });
  await prisma.isccCertificate.create({ data: { certNumber: "ISCC-EU-234568", partnerId: null, holderName: "株式会社CFP 美の浜工場", scope: "Circular Pyrolysis Oil (軽質)", issueDate: new Date("2025-11-01"), expiryDate: new Date("2026-10-31"), status: "ACTIVE", createdBy: itAcct.id } });

  await prisma.massBalance.create({ data: { period: "2026-03", certificateId: iscc1.id, productId: prodCPO.id, inputQuantity: 22000, outputQuantity: 17800, balanceQuantity: 4200, ghgEmission: 12.5, createdBy: itAcct.id } });
  await prisma.massBalance.create({ data: { period: "2026-02", certificateId: iscc1.id, productId: prodCPO.id, inputQuantity: 28000, outputQuantity: 21500, balanceQuantity: 6500, ghgEmission: 15.2, createdBy: itAcct.id } });

  await prisma.sustainabilityDeclaration.create({ data: { sdNumber: "CFP-000190-CA", issueDate: new Date("2026-03-08"), rawMaterial: "PP廃プラスチック", countryOfOrigin: "JP", ghgValue: 12.5 } });
  await prisma.sustainabilityDeclaration.create({ data: { sdNumber: "CFP-000191-CA", issueDate: new Date("2026-03-10"), rawMaterial: "PS廃プラスチック", countryOfOrigin: "JP", ghgValue: 13.1 } });
  await prisma.sustainabilityDeclaration.create({ data: { sdNumber: "CFP-000192-CA", issueDate: new Date("2026-03-12"), rawMaterial: "PE混合廃プラ", countryOfOrigin: "JP", ghgValue: 11.8 } });

  // トレーサビリティ
  await prisma.traceRecord.create({ data: { traceNumber: "TRC-2026-0001", sourceType: "CR_PRODUCTION", sourceId: cpo1.id, createdBy: itAcct.id, stages: { create: [
    { stageOrder: 1, stageName: "原料入荷", stageDate: new Date("2026-03-08"), location: "岡山ケミカルセンター", quantity: 7800, note: "PP廃プラ 7,800kg CRM-2026-0001" },
    { stageOrder: 2, stageName: "油化製造", stageDate: new Date("2026-03-09"), location: "岡山ケミカルセンター", quantity: 5600, note: "CPO-2026-0001 軽質油4,200L+重質油1,400L" },
    { stageOrder: 3, stageName: "タンク貯蔵", stageDate: new Date("2026-03-10"), location: "TK-01 軽質油タンクA", quantity: 4200 },
    { stageOrder: 4, stageName: "品質検査", stageDate: new Date("2026-03-10"), location: "研究室", note: "LAB-2026-0001 合格" },
    { stageOrder: 5, stageName: "出荷", stageDate: new Date("2026-03-12"), location: "→関西化学工業", quantity: 19000, note: "OIL-2026-0002" },
  ] } } });
  await prisma.traceRecord.create({ data: { traceNumber: "TRC-2026-0002", sourceType: "SHIPMENT", sourceId: shp1.id, createdBy: itAcct.id, stages: { create: [
    { stageOrder: 1, stageName: "原料入荷", stageDate: new Date("2026-02-05"), location: "高松工場", quantity: 5000, note: "PUR-2026-0003 PP 5,000kg" },
    { stageOrder: 2, stageName: "ルーダー加工", stageDate: new Date("2026-02-10"), location: "高松工場", quantity: 4900, note: "PRC-2026-0001 歩留まり98%" },
    { stageOrder: 3, stageName: "製品在庫", stageDate: new Date("2026-02-12"), location: "高松倉庫", quantity: 4900 },
    { stageOrder: 4, stageName: "出荷", stageDate: new Date("2026-03-10"), location: "→東洋プラスチック 川崎工場", quantity: 5000, note: "SHP-2026-0001" },
  ] } } });

  // ===== H. 承認 =====
  console.log("✅ Creating approvals...");
  await prisma.approvalRequest.create({ data: { requestNumber: "APR-2026-0001", category: ApprovalCategory.ORDER, targetType: "Shipment", targetId: shp5.id, title: "出荷手配 SHP-2026-0005", description: "東洋プラスチック PE-FLM-N-A1 3,000kg ¥495,000", status: ApprovalStatus.PENDING, createdBy: sales2.id, steps: { create: [
    { stepOrder: 1, approverId: assistant.id, status: ApprovalStatus.APPROVED, actionAt: new Date("2026-03-12T09:15:00") },
    { stepOrder: 2, approverId: salesMgr.id, status: ApprovalStatus.APPROVED, actionAt: new Date("2026-03-12T10:30:00") },
    { stepOrder: 3, approverId: ceo.id, status: ApprovalStatus.PENDING },
  ] } } });
  await prisma.approvalRequest.create({ data: { requestNumber: "APR-2026-0002", category: ApprovalCategory.INVOICE, targetType: "Invoice", targetId: inv1.id, title: "請求書発行 INV-2026-0001", description: "東洋プラスチック 3月度請求 ¥1,017,500", status: ApprovalStatus.PENDING, createdBy: accounting.id, steps: { create: [
    { stepOrder: 1, approverId: sales1.id, status: ApprovalStatus.APPROVED, actionAt: new Date("2026-03-12T11:00:00") },
    { stepOrder: 2, approverId: ceo.id, status: ApprovalStatus.PENDING },
  ] } } });
  await prisma.approvalRequest.create({ data: { requestNumber: "APR-2026-0003", category: ApprovalCategory.PAYMENT, targetType: "PaymentPayable", targetId: "", title: "支払承認 3月度仕入 九州リサイクル", description: "原料仕入 PP廃プラ ¥320,000", status: ApprovalStatus.PENDING, createdBy: accounting.id, steps: { create: [
    { stepOrder: 1, approverId: ceo.id, status: ApprovalStatus.PENDING },
  ] } } });
  await prisma.approvalRequest.create({ data: { requestNumber: "APR-2026-0004", category: ApprovalCategory.PRICE_CHANGE, targetType: "CustomerPrice", targetId: "", title: "単価改定 関西化学工業 PS-PEL-W-A1", description: "¥175/kg → ¥180/kg（原料高騰対応）有効期間 4/1〜", status: ApprovalStatus.APPROVED, createdBy: sales1.id, steps: { create: [
    { stepOrder: 1, approverId: salesMgr.id, status: ApprovalStatus.APPROVED, actionAt: new Date("2026-03-10T14:00:00") },
    { stepOrder: 2, approverId: ceo.id, status: ApprovalStatus.APPROVED, actionAt: new Date("2026-03-10T16:30:00") },
  ] } } });

  // ===== I. 経費・契約・管理 =====
  console.log("📋 Creating expenses, contracts, etc...");

  // 経費
  await prisma.expense.create({ data: { expenseNumber: "EXP-2026-0001", applicant: "高橋 健二", department: "営業部", expenseDate: new Date("2026-03-11"), totalAmount: 58200, status: "SUBMITTED", createdBy: salesMgr.id, items: { create: [
    { description: "新幹線 福山→東京（往復）", category: "交通費", amount: 36800 },
    { description: "ホテル 東京ビジネスイン", category: "宿泊費", amount: 12400 },
    { description: "タクシー（顧客訪問）", category: "交通費", amount: 4200 },
    { description: "会食（顧客接待）", category: "接待費", amount: 4800 },
  ] } } });
  await prisma.expense.create({ data: { expenseNumber: "EXP-2026-0002", applicant: "山田 花子", department: "総務部", expenseDate: new Date("2026-03-10"), totalAmount: 21400, status: "APPROVED", createdBy: assistant.id, items: { create: [
    { description: "コピー用紙 A4 10箱", category: "事務用品", amount: 12500 },
    { description: "トナーカートリッジ", category: "事務用品", amount: 8900 },
  ] } } });
  await prisma.expense.create({ data: { expenseNumber: "EXP-2026-0003", applicant: "佐藤 次郎", department: "製造部", expenseDate: new Date("2026-03-12"), totalAmount: 76400, status: "SUBMITTED", createdBy: production.id, items: { create: [
    { description: "安全靴 3足", category: "消耗品", amount: 18600 },
    { description: "作業手袋 50双", category: "消耗品", amount: 12800 },
    { description: "フォークリフト部品", category: "修繕費", amount: 45000 },
  ] } } });

  // 契約
  await prisma.contract.create({ data: { contractNumber: "CNT-2026-0001", partnerId: bpToyo.id, title: "PP再生ペレット販売基本契約", contractType: "販売契約", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), autoRenewal: true, status: ContractStatus.ACTIVE, note: "自動更新条項あり", createdBy: ceo.id } });
  await prisma.contract.create({ data: { contractNumber: "CNT-2025-0156", partnerId: bpKyushu.id, title: "廃プラスチック原料供給契約", contractType: "仕入契約", startDate: new Date("2025-04-01"), endDate: new Date("2026-03-31"), autoRenewal: false, status: ContractStatus.EXPIRING_SOON, note: "更新交渉中", createdBy: ceo.id } });
  await prisma.contract.create({ data: { contractNumber: "CNT-2026-0002", partnerId: bpHindustan.id, title: "Circular Pyrolysis Oil販売契約", contractType: "販売契約（海外）", startDate: new Date("2026-03-01"), endDate: new Date("2027-02-28"), status: ContractStatus.ACTIVE, note: "USD建て FOB", createdBy: ceo.id } });
  await prisma.contract.create({ data: { contractNumber: "CNT-2026-0003", partnerId: bpChugoku.id, title: "運送委託基本契約", contractType: "運送契約", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), autoRenewal: true, status: ContractStatus.ACTIVE, createdBy: ceo.id } });
  await prisma.contract.create({ data: { contractNumber: "CNT-2026-0004", partnerId: bpRE.id, title: "加工委託基本契約（RE）", contractType: "加工委託", startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), autoRenewal: true, status: ContractStatus.ACTIVE, note: "グループ会社間契約", createdBy: ceo.id } });

  // 月次締め
  await prisma.monthlyClosing.create({ data: { year: 2026, month: 1, isClosed: true, closedAt: new Date("2026-02-05"), closedBy: accounting.id } });
  await prisma.monthlyClosing.create({ data: { year: 2026, month: 2, isClosed: true, closedAt: new Date("2026-03-05"), closedBy: accounting.id } });
  await prisma.monthlyClosing.create({ data: { year: 2026, month: 3, isClosed: false } });

  // 仕訳
  await prisma.journalEntry.createMany({ data: [
    { entryDate: new Date("2026-03-15"), debitAccount: "1131", debitAmount: 1017500, creditAccount: "4111", creditAmount: 925000, description: "東洋プラスチック 3月度売上 INV-2026-0001", sourceType: "INVOICE", isExported: false, createdBy: accounting.id },
    { entryDate: new Date("2026-03-10"), debitAccount: "1112", debitAmount: 1985500, creditAccount: "1131", creditAmount: 1985500, description: "関西化学工業 入金消込 PAY-2026-0001", sourceType: "PAYMENT", isExported: true, exportedAt: new Date("2026-03-11"), createdBy: accounting.id },
    { entryDate: new Date("2026-03-08"), debitAccount: "5111", debitAmount: 272000, creditAccount: "2111", creditAmount: 272000, description: "九州リサイクル PP廃プラ仕入 PUR-2026-0007", sourceType: "PURCHASE", isExported: true, exportedAt: new Date("2026-03-09"), createdBy: accounting.id },
    { entryDate: new Date("2026-03-01"), companyId: Company.RE, debitAccount: "1131", debitAmount: 82500, creditAccount: "4111", creditAmount: 75000, description: "CFP向け加工賃（ルーダー）SL-2026-0004", sourceType: "REVENUE", isExported: true, exportedAt: new Date("2026-03-02"), createdBy: accounting.id },
  ]});

  // 見積
  await prisma.quotation.create({ data: { quotationNumber: "QUO-2026-0001", customerId: bpToyo.id, quotationDate: new Date("2026-03-08"), validUntil: new Date("2026-04-07"), subject: "PP再生ペレット 10t", items: [{ product: "PP-PEL-N-A1", name: "PP ペレット ナチュラル A級", qty: 10000, price: 185 }], subtotal: 1850000, taxAmount: 185000, total: 2035000, status: "ACCEPTED", createdBy: sales1.id } });
  await prisma.quotation.create({ data: { quotationNumber: "QUO-2026-0002", customerId: bpHindustan.id, quotationDate: new Date("2026-03-11"), validUntil: new Date("2026-04-10"), subject: "PP Pellet Natural Grade A 20MT", items: [{ product: "PP-PEL-N-A1", name: "PP Pellet Natural Grade A", qty: 20000, price: 0.85 }], subtotal: 17000, total: 17000, currency: Currency.USD, status: "SENT", createdBy: sales1.id } });

  // CTS取引
  await prisma.ctsTransaction.create({ data: { companyId: Company.CTS, transactionType: "SALE", fromCountry: "SG", toCountry: "ID", currency: Currency.USD, amount: 34000, exchangeRate: 150.25, jpyAmount: 5108500, transactionDate: new Date("2026-03-10"), note: "PT. INDO PLASTICS PP Pellet 40t" } });
  await prisma.ctsTransaction.create({ data: { companyId: Company.CTS, transactionType: "SALE", fromCountry: "JP", toCountry: "TH", currency: Currency.USD, amount: 20240, exchangeRate: 150.25, jpyAmount: 3041060, transactionDate: new Date("2026-03-05"), note: "THAI RECYCLING ABS Pellet 22t" } });

  // 税務帳票
  await prisma.taxReport.create({ data: { reportType: "揮発油税", period: "2026-03", totalSales: 42000, totalTax: 2044400, status: "DRAFT", createdBy: accounting.id } });
  await prisma.taxReport.create({ data: { reportType: "軽油引取税", period: "2026-03", totalSales: 18000, totalTax: 481500, status: "DRAFT", createdBy: accounting.id } });
  await prisma.taxReport.create({ data: { reportType: "揮発油税", period: "2026-02", totalSales: 52000, totalTax: 2582400, filingDate: new Date("2026-03-15"), status: "FILED", createdBy: accounting.id } });

  // 生産カレンダー (3月)
  const calendarEntries = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(2026, 2, d);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    calendarEntries.push({
      date,
      isWorkday: !isWeekend,
      isHoliday: isWeekend,
      holidayName: isWeekend ? (dow === 0 ? "日曜" : "土曜") : undefined,
      note: !isWeekend && d === 21 ? "春分の日" : undefined,
    });
  }
  // 春分の日
  const idx20 = calendarEntries.findIndex(e => e.date.getDate() === 21);
  if (idx20 >= 0) { calendarEntries[idx20].isHoliday = true; calendarEntries[idx20].isWorkday = false; calendarEntries[idx20].holidayName = "春分の日"; }
  await prisma.productionCalendar.createMany({ data: calendarEntries });

  // 監査ログ
  await prisma.auditLog.createMany({ data: [
    { userId: sales1.id, action: "CREATE", tableName: "Purchase", recordId: pur1.id, createdAt: new Date("2026-03-12T09:00:00") },
    { userId: sales2.id, action: "CREATE", tableName: "Purchase", recordId: pur2.id, createdAt: new Date("2026-03-12T09:15:00") },
    { userId: accounting.id, action: "CREATE", tableName: "Invoice", recordId: inv1.id, createdAt: new Date("2026-03-15T10:00:00") },
    { userId: accounting.id, action: "UPDATE", tableName: "Invoice", recordId: inv3.id, newData: { status: "PAID" }, createdAt: new Date("2026-03-10T14:00:00") },
    { userId: ceo.id, action: "UPDATE", tableName: "ApprovalStep", recordId: "", newData: { status: "APPROVED" }, createdAt: new Date("2026-03-10T16:30:00") },
    { userId: production.id, action: "CREATE", tableName: "CrProductionOrder", recordId: cpo1.id, createdAt: new Date("2026-03-08T08:00:00") },
    { userId: labUser.id, action: "CREATE", tableName: "LabSample", recordId: sample1.id, createdAt: new Date("2026-03-10T08:30:00") },
    { userId: itAcct.id, action: "CREATE", tableName: "IsccCertificate", recordId: iscc1.id, createdAt: new Date("2025-10-01T10:00:00") },
  ]});

  // 採番更新
  const seqUpdates: Record<string, number> = { PUR: 10, SHP: 6, SLS: 4, INV: 3, PAY: 4, PRC: 5, CRM: 4, CPO: 3, LAB: 4, APR: 4, EXP: 3, QUO: 2, CNT: 4, TRC: 2, OIL: 3, DSP: 4 };
  for (const [prefix, num] of Object.entries(seqUpdates)) {
    await prisma.numberSequence.update({ where: { prefix_year: { prefix, year: 2026 } }, data: { currentNumber: num } });
  }

  console.log("✅ Seed completed successfully!");
  console.log("📊 Summary:");
  console.log("   Users: 11, Partners: 15, Products: 20");
  console.log("   Purchases: 10, Inventory: 8, Processing: 5, Shipments: 6");
  console.log("   Orders: 4, Revenue: 8, Invoices: 3, Payments: 7");
  console.log("   CR Materials: 4, Production Orders: 3, Oil Shipments: 3");
  console.log("   Lab Samples: 4, Analysis Results: 9, Approvals: 4");
  console.log("   Contracts: 5, Expenses: 3, Trace Records: 2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
