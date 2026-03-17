// =============================================================================
// CFP Ops System - Excel Export Generator (exceljs)
// =============================================================================

import type ExcelJS from "exceljs";
import { prisma } from "@/lib/db";

async function loadExcelJS() {
  const mod = await import("exceljs");
  return mod.default;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function applyHeaderStyle(ws: ExcelJS.Worksheet) {
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE8EDF5" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 40);
  });
}

async function toBuffer(wb: ExcelJS.Workbook): Promise<Uint8Array> {
  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf);
}

// ---------------------------------------------------------------------------
// 1. Revenue Excel (売上一覧)
// ---------------------------------------------------------------------------
export async function generateRevenueExcel(from: Date, to: Date): Promise<Uint8Array> {
  const revenues = await prisma.revenue.findMany({
    where: {
      revenueDate: { gte: from, lte: to },
    },
    include: {
      product: {
        include: {
          name: { select: { name: true } },
          shape: { select: { name: true } },
          color: { select: { name: true } },
          grade: { select: { name: true } },
        },
      },
      shipment: {
        include: { customer: { select: { name: true } } },
      },
      invoice: { select: { invoiceNumber: true } },
    },
    orderBy: { revenueDate: "asc" },
  });

  const ExcelJSLib = await loadExcelJS();
  const wb = new ExcelJSLib.Workbook();
  wb.creator = "CFP Ops System";
  const ws = wb.addWorksheet("売上一覧");

  ws.columns = [
    { header: "売上番号", key: "revenueNumber" },
    { header: "区分", key: "division" },
    { header: "売上区分", key: "salesCategory" },
    { header: "売上日", key: "revenueDate" },
    { header: "顧客名", key: "customer" },
    { header: "品目コード", key: "productCode" },
    { header: "品名", key: "productName" },
    { header: "数量(kg)", key: "quantity" },
    { header: "単価", key: "unitPrice" },
    { header: "金額（税抜）", key: "amount" },
    { header: "税率", key: "taxRate" },
    { header: "消費税額", key: "taxAmount" },
    { header: "合計（税込）", key: "total" },
    { header: "請求書番号", key: "invoiceNumber" },
    { header: "輸出免税", key: "isExportExempt" },
    { header: "備考", key: "note" },
  ];

  const categoryLabels: Record<string, string> = {
    SALES: "売上", RETURN: "返品", DISCOUNT: "値引", OTHER: "その他", TAX: "税",
  };

  for (const r of revenues) {
    ws.addRow({
      revenueNumber: r.revenueNumber,
      division: r.division,
      salesCategory: categoryLabels[r.salesCategory] ?? r.salesCategory,
      revenueDate: r.revenueDate,
      customer: r.shipment?.customer?.name ?? "",
      productCode: r.product?.code ?? "",
      productName: r.product?.name?.name ?? "",
      quantity: r.quantity,
      unitPrice: r.unitPrice,
      amount: r.amount,
      taxRate: r.taxRate,
      taxAmount: r.taxAmount,
      total: r.amount + r.taxAmount,
      invoiceNumber: r.invoice?.invoiceNumber ?? "",
      isExportExempt: r.isExportExempt ? "○" : "",
      note: r.note ?? "",
    });
  }

  applyHeaderStyle(ws);
  autoWidth(ws);
  return toBuffer(wb);
}

// ---------------------------------------------------------------------------
// 2. Invoice Excel (請求一覧)
// ---------------------------------------------------------------------------
export async function generateInvoiceExcel(from: Date, to: Date): Promise<Uint8Array> {
  const invoices = await prisma.invoice.findMany({
    where: {
      billingDate: { gte: from, lte: to },
    },
    include: {
      customer: { select: { code: true, name: true } },
    },
    orderBy: { billingDate: "asc" },
  });

  const ExcelJSLib = await loadExcelJS();
  const wb = new ExcelJSLib.Workbook();
  wb.creator = "CFP Ops System";
  const ws = wb.addWorksheet("請求一覧");

  ws.columns = [
    { header: "請求書番号", key: "invoiceNumber" },
    { header: "請求日", key: "billingDate" },
    { header: "支払期限", key: "dueDate" },
    { header: "顧客コード", key: "customerCode" },
    { header: "顧客名", key: "customerName" },
    { header: "前回残高", key: "prevBalance" },
    { header: "入金額", key: "paymentReceived" },
    { header: "繰越残高", key: "carryover" },
    { header: "小計（税抜）", key: "subtotal" },
    { header: "消費税", key: "taxAmount" },
    { header: "請求額", key: "total" },
    { header: "ステータス", key: "status" },
    { header: "通貨", key: "currency" },
    { header: "備考", key: "note" },
  ];

  const statusLabels: Record<string, string> = {
    DRAFT: "下書き", ISSUED: "発行済", SENT: "送付済", PAID: "入金済",
  };

  for (const inv of invoices) {
    ws.addRow({
      invoiceNumber: inv.invoiceNumber,
      billingDate: inv.billingDate,
      dueDate: inv.dueDate,
      customerCode: inv.customer.code,
      customerName: inv.customer.name,
      prevBalance: inv.prevBalance,
      paymentReceived: inv.paymentReceived,
      carryover: inv.carryover,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      total: inv.total,
      status: statusLabels[inv.status] ?? inv.status,
      currency: inv.currency,
      note: inv.note ?? "",
    });
  }

  applyHeaderStyle(ws);
  autoWidth(ws);
  return toBuffer(wb);
}

// ---------------------------------------------------------------------------
// 3. Purchase Excel (仕入一覧)
// ---------------------------------------------------------------------------
export async function generatePurchaseExcel(from: Date, to: Date): Promise<Uint8Array> {
  const purchases = await prisma.purchase.findMany({
    where: {
      purchaseDate: { gte: from, lte: to },
    },
    include: {
      supplier: { select: { code: true, name: true } },
      pickupPartner: { select: { name: true } },
      product: {
        include: {
          name: { select: { name: true } },
        },
      },
      warehouse: { select: { code: true, name: true } },
    },
    orderBy: { purchaseDate: "asc" },
  });

  const ExcelJSLib = await loadExcelJS();
  const wb = new ExcelJSLib.Workbook();
  wb.creator = "CFP Ops System";
  const ws = wb.addWorksheet("仕入一覧");

  ws.columns = [
    { header: "仕入番号", key: "purchaseNumber" },
    { header: "仕入日", key: "purchaseDate" },
    { header: "仕入先コード", key: "supplierCode" },
    { header: "仕入先名", key: "supplierName" },
    { header: "引取先", key: "pickupPartner" },
    { header: "品目コード", key: "productCode" },
    { header: "品名", key: "productName" },
    { header: "数量(kg)", key: "quantity" },
    { header: "単価(円/kg)", key: "unitPrice" },
    { header: "金額", key: "amount" },
    { header: "運賃", key: "freightCost" },
    { header: "荷姿", key: "packagingType" },
    { header: "倉庫", key: "warehouse" },
    { header: "ステータス", key: "status" },
    { header: "備考", key: "note" },
  ];

  const statusLabels: Record<string, string> = {
    PLANNED: "予定", RECEIVED: "入荷済", INSPECTED: "検査済", CONFIRMED: "確定", RETURNED: "返品",
  };
  const packLabels: Record<string, string> = {
    FLECON: "フレコン", PALLET: "パレット", STEEL_BOX: "スチール箱", PAPER_BAG: "紙袋", POST_PALLET: "ポストパレット",
  };

  for (const p of purchases) {
    ws.addRow({
      purchaseNumber: p.purchaseNumber,
      purchaseDate: p.purchaseDate,
      supplierCode: p.supplier.code,
      supplierName: p.supplier.name,
      pickupPartner: p.pickupPartner?.name ?? "",
      productCode: p.product.code,
      productName: p.product.name?.name ?? "",
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      amount: p.amount,
      freightCost: p.freightCost ?? "",
      packagingType: p.packagingType ? packLabels[p.packagingType] ?? p.packagingType : "",
      warehouse: p.warehouse?.name ?? "",
      status: statusLabels[p.status] ?? p.status,
      note: p.note ?? "",
    });
  }

  applyHeaderStyle(ws);
  autoWidth(ws);
  return toBuffer(wb);
}

// ---------------------------------------------------------------------------
// 4. Inventory Excel (在庫一覧)
// ---------------------------------------------------------------------------
export async function generateInventoryExcel(): Promise<Uint8Array> {
  const items = await prisma.inventory.findMany({
    include: {
      product: {
        include: {
          name: { select: { name: true } },
          shape: { select: { name: true } },
          color: { select: { name: true } },
          grade: { select: { name: true } },
        },
      },
      warehouse: {
        include: { plant: { select: { name: true } } },
      },
      pickupPartner: { select: { name: true } },
    },
    orderBy: [{ warehouse: { code: "asc" } }, { product: { code: "asc" } }],
  });

  const ExcelJSLib = await loadExcelJS();
  const wb = new ExcelJSLib.Workbook();
  wb.creator = "CFP Ops System";
  const ws = wb.addWorksheet("在庫一覧");

  ws.columns = [
    { header: "工場", key: "plant" },
    { header: "倉庫コード", key: "warehouseCode" },
    { header: "倉庫名", key: "warehouseName" },
    { header: "引取先", key: "pickupPartner" },
    { header: "品目コード", key: "productCode" },
    { header: "品名", key: "productName" },
    { header: "形状", key: "shape" },
    { header: "色", key: "color" },
    { header: "グレード", key: "grade" },
    { header: "荷姿", key: "packagingType" },
    { header: "在庫量(kg)", key: "quantity" },
    { header: "移動平均単価", key: "avgCost" },
    { header: "評価額", key: "value" },
  ];

  const packLabels: Record<string, string> = {
    FLECON: "フレコン", PALLET: "パレット", STEEL_BOX: "スチール箱", PAPER_BAG: "紙袋", POST_PALLET: "ポストパレット",
  };

  for (const i of items) {
    ws.addRow({
      plant: i.warehouse.plant?.name ?? "",
      warehouseCode: i.warehouse.code,
      warehouseName: i.warehouse.name,
      pickupPartner: i.pickupPartner?.name ?? "",
      productCode: i.product.code,
      productName: i.product.name?.name ?? "",
      shape: i.product.shape?.name ?? "",
      color: i.product.color?.name ?? "",
      grade: i.product.grade?.name ?? "",
      packagingType: i.packagingType ? packLabels[i.packagingType] ?? i.packagingType : "",
      quantity: i.quantity,
      avgCost: Math.round(i.movingAvgCost),
      value: Math.round(i.quantity * i.movingAvgCost),
    });
  }

  applyHeaderStyle(ws);
  autoWidth(ws);
  return toBuffer(wb);
}

// ---------------------------------------------------------------------------
// 5. Partner Excel (取引先一覧)
// ---------------------------------------------------------------------------
export async function generatePartnerExcel(): Promise<Uint8Array> {
  const partners = await prisma.businessPartner.findMany({
    orderBy: { code: "asc" },
  });

  const ExcelJSLib = await loadExcelJS();
  const wb = new ExcelJSLib.Workbook();
  wb.creator = "CFP Ops System";
  const ws = wb.addWorksheet("取引先一覧");

  ws.columns = [
    { header: "コード", key: "code" },
    { header: "取引先名", key: "name" },
    { header: "カナ", key: "nameKana" },
    { header: "顧客", key: "isCustomer" },
    { header: "仕入先", key: "isSupplier" },
    { header: "運送会社", key: "isCarrier" },
    { header: "締日", key: "closingDay" },
    { header: "都道府県", key: "prefecture" },
    { header: "市区町村", key: "city" },
    { header: "住所", key: "address" },
    { header: "電話番号", key: "tel" },
    { header: "FAX", key: "fax" },
    { header: "メール", key: "email" },
    { header: "ISCC認証", key: "isIsccCertified" },
    { header: "海外", key: "isOverseas" },
    { header: "有効", key: "isActive" },
  ];

  const closingLabels: Record<string, string> = {
    DAY_5: "5日", DAY_10: "10日", DAY_15: "15日", DAY_20: "20日", DAY_25: "25日", END_OF_MONTH: "末日",
  };

  for (const p of partners) {
    ws.addRow({
      code: p.code,
      name: p.name,
      nameKana: p.nameKana ?? "",
      isCustomer: p.isCustomer ? "○" : "",
      isSupplier: p.isSupplier ? "○" : "",
      isCarrier: p.isCarrier ? "○" : "",
      closingDay: p.closingDay ? closingLabels[p.closingDay] ?? p.closingDay : "",
      prefecture: p.prefecture ?? "",
      city: p.city ?? "",
      address: p.address ?? "",
      tel: p.tel ?? "",
      fax: p.fax ?? "",
      email: p.email ?? "",
      isIsccCertified: p.isIsccCertified ? "○" : "",
      isOverseas: p.isOverseas ? "○" : "",
      isActive: p.isActive ? "有効" : "無効",
    });
  }

  applyHeaderStyle(ws);
  autoWidth(ws);
  return toBuffer(wb);
}
