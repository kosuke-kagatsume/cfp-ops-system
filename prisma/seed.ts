import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Company } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_URL_NON_POOLING });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ===== Roles =====
  const adminRole = await prisma.role.upsert({
    where: { name: "管理者" },
    update: {},
    create: {
      name: "管理者",
      description: "システム管理者",
      permissions: { all: true },
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "マネージャー" },
    update: {},
    create: {
      name: "マネージャー",
      description: "営業マネージャー",
      permissions: {
        read: true,
        write: true,
        approve: true,
        delete: false,
      },
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: "スタッフ" },
    update: {},
    create: {
      name: "スタッフ",
      description: "一般スタッフ",
      permissions: { read: true, write: true, approve: false, delete: false },
    },
  });

  // ===== Users =====
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cfp-group.co.jp" },
    update: {},
    create: {
      email: "admin@cfp-group.co.jp",
      name: "福田 隆",
      nameKana: "フクダ タカシ",
      department: "経営",
      position: "代表取締役",
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@cfp-group.co.jp" },
    update: {},
    create: {
      email: "manager@cfp-group.co.jp",
      name: "営業太郎",
      nameKana: "エイギョウ タロウ",
      department: "営業部",
      position: "マネージャー",
      roleId: managerRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@cfp-group.co.jp" },
    update: {},
    create: {
      email: "staff@cfp-group.co.jp",
      name: "営業花子",
      nameKana: "エイギョウ ハナコ",
      department: "営業部",
      position: "アシスタント",
      roleId: staffRole.id,
    },
  });

  // ===== 品名マスタ (ProductName) =====
  const productNames = [
    { code: 1, name: "PP（ポリプロピレン）" },
    { code: 2, name: "PE（ポリエチレン）" },
    { code: 3, name: "PET（ポリエチレンテレフタレート）" },
    { code: 4, name: "PS（ポリスチレン）" },
    { code: 5, name: "PMMA（アクリル）" },
    { code: 6, name: "ABS" },
    { code: 7, name: "PC（ポリカーボネート）" },
    { code: 8, name: "PA（ナイロン）" },
    { code: 9, name: "PVC（塩化ビニル）" },
    { code: 10, name: "HDPE（高密度PE）" },
    { code: 11, name: "LDPE（低密度PE）" },
    { code: 12, name: "LLDPE（直鎖状低密度PE）" },
    { code: 900, name: "Circular Pyrolysis Oil", isccManageName: "CPO" },
    { code: 901, name: "軽質油" },
    { code: 902, name: "重質油" },
    { code: 903, name: "混合油" },
  ];
  for (const pn of productNames) {
    await prisma.productName.upsert({
      where: { code: pn.code },
      update: {},
      create: pn,
    });
  }

  // ===== 形状マスタ (ProductShape) =====
  const shapes = [
    { code: 1, name: "ペレット" },
    { code: 2, name: "フレーク" },
    { code: 3, name: "粉砕" },
    { code: 4, name: "フィルム" },
    { code: 5, name: "射出" },
    { code: 6, name: "ブロー" },
    { code: 7, name: "液体" },
    { code: 8, name: "パウダー" },
    { code: 9, name: "シート" },
    { code: 10, name: "繊維" },
  ];
  for (const s of shapes) {
    await prisma.productShape.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  // ===== 色マスタ (ProductColor) =====
  const colors = [
    { code: 1, name: "ナチュラル" },
    { code: 2, name: "白" },
    { code: 3, name: "黒" },
    { code: 4, name: "グレー" },
    { code: 5, name: "青" },
    { code: 6, name: "赤" },
    { code: 7, name: "黄" },
    { code: 8, name: "緑" },
    { code: 9, name: "混合色" },
    { code: 10, name: "透明" },
  ];
  for (const c of colors) {
    await prisma.productColor.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // ===== グレードマスタ (ProductGrade) =====
  const grades = [
    { code: 1, name: "素材品" },
    { code: 2, name: "再生ペレット" },
    { code: 3, name: "バージン" },
    { code: 4, name: "オフグレード" },
    { code: 5, name: "廃プラ" },
    { code: 6, name: "RPF原料" },
  ];
  for (const g of grades) {
    await prisma.productGrade.upsert({
      where: { code: g.code },
      update: {},
      create: g,
    });
  }

  // ===== 工場マスタ (Plant) =====
  const plants = [
    {
      code: "P-CFP-HQ",
      name: "CFP本社工場",
      companyId: Company.CFP,
      address: "福山市",
    },
    {
      code: "P-CFP-CR",
      name: "CFP油化プラント",
      companyId: Company.CFP,
      address: "福山市",
    },
    {
      code: "P-RE-HQ",
      name: "RE本社工場",
      companyId: Company.RE,
      address: "福山市",
    },
    {
      code: "P-RE-EXT",
      name: "RE押出工場",
      companyId: Company.RE,
      address: "福山市",
    },
    {
      code: "P-CFP-LAB",
      name: "CFP研究室",
      companyId: Company.CFP,
      address: "福山市",
    },
  ];
  for (const p of plants) {
    await prisma.plant.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // ===== 倉庫マスタ (Warehouse) =====
  const cfpPlant = await prisma.plant.findUnique({
    where: { code: "P-CFP-HQ" },
  });
  const warehouses = [
    {
      code: "W-CFP-1",
      name: "CFP第1倉庫",
      type: "INTERNAL" as const,
      plantId: cfpPlant!.id,
    },
    {
      code: "W-CFP-2",
      name: "CFP第2倉庫",
      type: "INTERNAL" as const,
      plantId: cfpPlant!.id,
    },
    {
      code: "W-EXT-SAKAIDE",
      name: "坂出外部倉庫",
      type: "EXTERNAL" as const,
    },
    {
      code: "W-EXT-MIZUSHIMA",
      name: "水島外部倉庫",
      type: "EXTERNAL" as const,
    },
    { code: "W-EXT-KOBE", name: "神戸外部倉庫", type: "EXTERNAL" as const },
    {
      code: "W-EXT-YOKOHAMA",
      name: "横浜外部倉庫",
      type: "EXTERNAL" as const,
    },
  ];
  for (const w of warehouses) {
    await prisma.warehouse.upsert({
      where: { code: w.code },
      update: {},
      create: w,
    });
  }

  // ===== 銀行口座 (BankAccount) =====
  await prisma.bankAccount.upsert({
    where: { id: "bank-cfp-main" },
    update: {},
    create: {
      id: "bank-cfp-main",
      bankName: "広島銀行",
      branchName: "福山支店",
      accountType: "普通",
      accountNumber: "1234567",
      accountHolder: "カ）シーエフピー",
      companyId: Company.CFP,
      isDefault: true,
    },
  });

  // ===== 採番マスタ (NumberSequence) =====
  const sequences = [
    { prefix: "PUR", year: 2026 },
    { prefix: "SHP", year: 2026 },
    { prefix: "SLS", year: 2026 },
    { prefix: "INV", year: 2026 },
    { prefix: "PAY", year: 2026 },
    { prefix: "PRC", year: 2026 },
    { prefix: "CRM", year: 2026 },
    { prefix: "CPO", year: 2026 },
    { prefix: "LAB", year: 2026 },
    { prefix: "APR", year: 2026 },
    { prefix: "EXP", year: 2026 },
    { prefix: "QUO", year: 2026 },
    { prefix: "CNT", year: 2026 },
    { prefix: "TRC", year: 2026 },
  ];
  for (const seq of sequences) {
    await prisma.numberSequence.upsert({
      where: {
        prefix_year: { prefix: seq.prefix, year: seq.year },
      },
      update: {},
      create: seq,
    });
  }

  // ===== システム設定 (SystemSetting) =====
  const settings = [
    {
      key: "company.cfp.name",
      value: "株式会社CFP",
      category: "company",
    },
    {
      key: "company.re.name",
      value: "株式会社RE",
      category: "company",
    },
    {
      key: "company.cts.name",
      value: "CTS PTE. LTD.",
      category: "company",
    },
    {
      key: "tax.default_rate",
      value: "0.10",
      category: "tax",
    },
    {
      key: "tax.reduced_rate",
      value: "0.08",
      category: "tax",
    },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // ===== タンクマスタ (Tank) =====
  const crPlant = await prisma.plant.findUnique({
    where: { code: "P-CFP-CR" },
  });
  const tanks = [
    {
      code: "T-LO-1",
      name: "軽質油タンク1",
      tankType: "LIGHT_OIL" as const,
      plantId: crPlant!.id,
      capacity: 10000,
    },
    {
      code: "T-HO-1",
      name: "重質油タンク1",
      tankType: "HEAVY_OIL" as const,
      plantId: crPlant!.id,
      capacity: 10000,
    },
    {
      code: "T-MO-1",
      name: "混合油タンク1",
      tankType: "MIXED_OIL" as const,
      plantId: crPlant!.id,
      capacity: 20000,
    },
    {
      code: "T-RS-1",
      name: "残渣タンク1",
      tankType: "RESIDUE" as const,
      plantId: crPlant!.id,
      capacity: 5000,
    },
  ];
  for (const t of tanks) {
    await prisma.tank.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
