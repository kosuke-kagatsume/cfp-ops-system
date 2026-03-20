import { prisma } from "@/lib/db";
import { parseCSV, decodeCSVBuffer } from "@/lib/csv-parser";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

type TransactionType = "revenue" | "purchases" | "invoices";

function isValidDate(s: string): boolean {
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function isValidNumber(s: string): boolean {
  return s !== "" && !isNaN(parseFloat(s));
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as TransactionType | null;

  if (!file || !type) {
    return NextResponse.json({ error: "file and type are required" }, { status: 400 });
  }

  if (!["revenue", "purchases", "invoices"].includes(type)) {
    return NextResponse.json({ error: "Invalid type. Use: revenue, purchases, invoices" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const text = decodeCSVBuffer(buffer);
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSVにデータがありません" }, { status: 400 });
  }

  // Validate required fields + types
  const errors: Array<{ row: number; errors: string[] }> = [];

  const REQUIRED_FIELDS: Record<TransactionType, string[]> = {
    revenue: ["customerCode", "amount", "revenueDate"],
    purchases: ["supplierCode", "productCode", "quantity", "unitPrice", "purchaseDate"],
    invoices: ["customerCode", "billingDate"],
  };

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // 1-indexed + header skip
    const row = rows[i];
    const rowErrors: string[] = [];

    // Required field check
    const missing = REQUIRED_FIELDS[type].filter((f) => !row[f]);
    if (missing.length > 0) {
      rowErrors.push(...missing.map((f) => `${f} は必須です`));
    }

    // Type validation
    if (type === "revenue") {
      if (row.amount && !isValidNumber(row.amount)) rowErrors.push("amount は数値で入力してください");
      if (row.revenueDate && !isValidDate(row.revenueDate)) rowErrors.push("revenueDate は有効な日付で入力してください");
      if (row.division && !["MR", "CR"].includes(row.division)) rowErrors.push("division は MR または CR で入力してください");
    } else if (type === "purchases") {
      if (row.quantity && !isValidNumber(row.quantity)) rowErrors.push("quantity は数値で入力してください");
      if (row.unitPrice && !isValidNumber(row.unitPrice)) rowErrors.push("unitPrice は数値で入力してください");
      if (row.purchaseDate && !isValidDate(row.purchaseDate)) rowErrors.push("purchaseDate は有効な日付で入力してください");
      if (row.division && !["MR", "CR"].includes(row.division)) rowErrors.push("division は MR または CR で入力してください");
    } else if (type === "invoices") {
      if (row.billingDate && !isValidDate(row.billingDate)) rowErrors.push("billingDate は有効な日付で入力してください");
      if (row.dueDate && !isValidDate(row.dueDate)) rowErrors.push("dueDate は有効な日付で入力してください");
      if (row.subtotal && !isValidNumber(row.subtotal)) rowErrors.push("subtotal は数値で入力してください");
      if (row.taxAmount && !isValidNumber(row.taxAmount)) rowErrors.push("taxAmount は数値で入力してください");
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, errors: rowErrors });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: "バリデーションエラー", total: rows.length, errorCount: errors.length, errors }, { status: 400 });
  }

  // Pre-resolve all FK references before transaction
  const fkErrors: Array<{ row: number; errors: string[] }> = [];

  if (type === "revenue" || type === "invoices") {
    const codes = [...new Set(rows.map((r) => r.customerCode))];
    const partners = await prisma.businessPartner.findMany({ where: { code: { in: codes } } });
    const codeMap = new Map(partners.map((p) => [p.code, p.id]));
    for (let i = 0; i < rows.length; i++) {
      if (!codeMap.has(rows[i].customerCode)) {
        fkErrors.push({ row: i + 2, errors: [`顧客コード ${rows[i].customerCode} が見つかりません`] });
      }
    }
  }

  if (type === "purchases") {
    const supplierCodes = [...new Set(rows.map((r) => r.supplierCode))];
    const productCodes = [...new Set(rows.map((r) => r.productCode))];
    const [suppliers, products] = await Promise.all([
      prisma.businessPartner.findMany({ where: { code: { in: supplierCodes } } }),
      prisma.product.findMany({ where: { code: { in: productCodes } } }),
    ]);
    const supplierMap = new Map(suppliers.map((s) => [s.code, s.id]));
    const productMap = new Map(products.map((p) => [p.code, p.id]));
    for (let i = 0; i < rows.length; i++) {
      const rowErrs: string[] = [];
      if (!supplierMap.has(rows[i].supplierCode)) rowErrs.push(`仕入先コード ${rows[i].supplierCode} が見つかりません`);
      if (!productMap.has(rows[i].productCode)) rowErrs.push(`商品コード ${rows[i].productCode} が見つかりません`);
      if (rowErrs.length > 0) fkErrors.push({ row: i + 2, errors: rowErrs });
    }
  }

  if (fkErrors.length > 0) {
    return NextResponse.json({ error: "参照エラー", total: rows.length, errorCount: fkErrors.length, errors: fkErrors }, { status: 400 });
  }

  // Build lookup maps for use in transaction
  const partnerMap = new Map<string, string>();
  const productMap = new Map<string, string>();

  if (type === "revenue" || type === "invoices") {
    const codes = [...new Set(rows.map((r) => r.customerCode))];
    const partners = await prisma.businessPartner.findMany({ where: { code: { in: codes } } });
    partners.forEach((p) => partnerMap.set(p.code, p.id));
  }
  if (type === "purchases") {
    const supplierCodes = [...new Set(rows.map((r) => r.supplierCode))];
    const productCodes = [...new Set(rows.map((r) => r.productCode))];
    const [suppliers, products] = await Promise.all([
      prisma.businessPartner.findMany({ where: { code: { in: supplierCodes } } }),
      prisma.product.findMany({ where: { code: { in: productCodes } } }),
    ]);
    suppliers.forEach((s) => partnerMap.set(s.code, s.id));
    products.forEach((p) => productMap.set(p.code, p.id));
  }

  // Process all rows in a transaction
  let created = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      switch (type) {
        case "revenue": {
          const revenueNumber = await getNextNumber("REV");
          await tx.revenue.create({
            data: {
              revenueNumber,
              customerId: partnerMap.get(row.customerCode)!,
              division: (row.division as "MR" | "CR") || "MR",
              revenueDate: new Date(row.revenueDate),
              salesCategory: "SALES",
              amount: parseFloat(row.amount),
              note: row.note || null,
            },
          });
          created++;
          break;
        }

        case "purchases": {
          const purchaseNumber = await getNextNumber("PUR");
          const quantity = parseFloat(row.quantity);
          const unitPrice = parseFloat(row.unitPrice);
          await tx.purchase.create({
            data: {
              purchaseNumber,
              supplierId: partnerMap.get(row.supplierCode)!,
              productId: productMap.get(row.productCode)!,
              division: (row.division as "MR" | "CR") || "MR",
              purchaseDate: new Date(row.purchaseDate),
              quantity,
              unitPrice,
              amount: quantity * unitPrice,
              status: "CONFIRMED",
              note: row.note || null,
            },
          });
          created++;
          break;
        }

        case "invoices": {
          const invoiceNumber = await getNextNumber("INV");
          const subtotal = parseFloat(row.subtotal || "0");
          const taxAmount = parseFloat(row.taxAmount || "0");
          await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: partnerMap.get(row.customerCode)!,
              billingDate: new Date(row.billingDate),
              dueDate: row.dueDate ? new Date(row.dueDate) : null,
              subtotal,
              taxAmount,
              total: subtotal + taxAmount,
              status: "DRAFT",
              note: row.note || null,
            },
          });
          created++;
          break;
        }
      }
    }
  });

  await createAuditLog({
    action: "CREATE",
    tableName: `Import_${type}`,
    recordId: "bulk",
    newData: { total: rows.length, created },
  });

  return NextResponse.json({ total: rows.length, created, errors: [] }, { status: 201 });
});
