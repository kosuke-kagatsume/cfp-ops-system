import { prisma } from "@/lib/db";
import { parseCSV, decodeCSVBuffer } from "@/lib/csv-parser";
import { partnerCreate, productCreate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const warehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  plantId: z.string().optional(),
});

type ImportType = "partners" | "products" | "warehouses";

const SCHEMAS: Record<ImportType, z.ZodSchema> = {
  partners: partnerCreate,
  products: productCreate,
  warehouses: warehouseSchema,
};

export const POST = withErrorHandler(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as ImportType | null;

  if (!file || !type) {
    return NextResponse.json({ error: "file and type are required" }, { status: 400 });
  }

  if (!SCHEMAS[type]) {
    return NextResponse.json({ error: "Invalid type. Use: partners, products, warehouses" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const text = decodeCSVBuffer(buffer);
  const rows = parseCSV(text);

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSVにデータがありません" }, { status: 400 });
  }

  // Validate all rows first
  const schema = SCHEMAS[type];
  const errors: Array<{ row: number; errors: string[] }> = [];

  const validRows: unknown[] = [];
  for (let i = 0; i < rows.length; i++) {
    // Convert numeric strings to numbers for validation
    const row = convertTypes(rows[i], type);
    const result = schema.safeParse(row);
    if (!result.success) {
      errors.push({
        row: i + 2, // +2 because 1-indexed and skip header
        errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    } else {
      validRows.push(result.data);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({
      error: "バリデーションエラー",
      total: rows.length,
      errorCount: errors.length,
      errors,
    }, { status: 400 });
  }

  // Upsert all rows inside a transaction
  let created = 0;
  let updated = 0;

  await prisma.$transaction(async (tx) => {
    switch (type) {
      case "partners":
        for (const data of validRows) {
          const d = data as z.infer<typeof partnerCreate>;
          const existing = await tx.businessPartner.findUnique({ where: { code: d.code } });
          if (existing) {
            await tx.businessPartner.update({ where: { id: existing.id }, data: d as any });
            updated++;
          } else {
            await tx.businessPartner.create({ data: d as any });
            created++;
          }
        }
        break;

      case "warehouses":
        for (const data of validRows) {
          const d = data as z.infer<typeof warehouseSchema>;
          const existing = await tx.warehouse.findUnique({ where: { code: d.code } });
          if (existing) {
            await tx.warehouse.update({ where: { id: existing.id }, data: d as any });
            updated++;
          } else {
            await tx.warehouse.create({ data: d as any });
            created++;
          }
        }
        break;

      case "products":
        for (const data of validRows) {
          const d = data as z.infer<typeof productCreate>;
          await tx.product.create({ data: d as any });
          created++;
        }
        break;
    }
  });

  await createAuditLog({
    action: "CREATE",
    tableName: `Import_${type}`,
    recordId: "bulk",
    newData: { total: validRows.length, created, updated },
  });

  return NextResponse.json({ total: validRows.length, created, updated, errors: [] }, { status: 201 });
});

const BOOLEAN_FIELDS: Record<ImportType, string[]> = {
  partners: ["isCustomer", "isSupplier", "isPickup", "isDelivery", "isCarrier", "isIsccCertified", "isOverseas"],
  products: ["isIsccEligible"],
  warehouses: [],
};

const NUMERIC_FIELDS: Record<ImportType, string[]> = {
  partners: ["paymentSiteMonths"],
  products: [],
  warehouses: [],
};

function convertTypes(row: Record<string, string>, type: ImportType): Record<string, unknown> {
  const result: Record<string, unknown> = { ...row };
  const boolFields = new Set(BOOLEAN_FIELDS[type]);
  const numFields = new Set(NUMERIC_FIELDS[type]);

  for (const key of Object.keys(result)) {
    const val = result[key] as string;
    if (boolFields.has(key)) {
      if (val === "true" || val === "TRUE" || val === "1") result[key] = true;
      else if (val === "false" || val === "FALSE" || val === "0" || val === "") result[key] = false;
    } else if (numFields.has(key)) {
      const num = parseInt(val);
      result[key] = isNaN(num) ? undefined : num;
    }
  }

  return result;
}
