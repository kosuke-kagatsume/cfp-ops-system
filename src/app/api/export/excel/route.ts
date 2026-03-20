import { NextRequest } from "next/server";
import {
  generateRevenueExcel,
  generateInvoiceExcel,
  generatePurchaseExcel,
  generateInventoryExcel,
  generatePartnerExcel,
} from "@/lib/excel-generator";
import { withErrorHandler } from "@/lib/api-error-handler";
import * as Sentry from "@sentry/nextjs";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");

  // Default date range: current year
  const now = new Date();
  const from = fromStr
    ? new Date(fromStr + "-01")
    : new Date(now.getFullYear(), 0, 1);
  const to = toStr
    ? new Date(
        new Date(toStr + "-01").getFullYear(),
        new Date(toStr + "-01").getMonth() + 1,
        0
      )
    : new Date(now.getFullYear(), 11, 31);

  let buffer: Uint8Array;
  let filename: string;

  try {
    switch (type) {
      case "revenue":
        buffer = await generateRevenueExcel(from, to);
        filename = `売上一覧_${fromStr ?? now.getFullYear()}.xlsx`;
        break;
      case "invoices":
        buffer = await generateInvoiceExcel(from, to);
        filename = `請求一覧_${fromStr ?? now.getFullYear()}.xlsx`;
        break;
      case "purchases":
        buffer = await generatePurchaseExcel(from, to);
        filename = `仕入一覧_${fromStr ?? now.getFullYear()}.xlsx`;
        break;
      case "inventory":
        buffer = await generateInventoryExcel();
        filename = `在庫一覧_${now.toISOString().slice(0, 10)}.xlsx`;
        break;
      case "partners":
        buffer = await generatePartnerExcel();
        filename = `取引先一覧_${now.toISOString().slice(0, 10)}.xlsx`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid type parameter. Use: revenue, invoices, purchases, inventory, partners" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    Sentry.captureException(err);
    return new Response(
      JSON.stringify({ error: "Excel generation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const encodedFilename = encodeURIComponent(filename);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedFilename}`,
    },
  });
});
