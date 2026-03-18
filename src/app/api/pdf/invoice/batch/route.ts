import { buildInvoicePDFBuffer } from "@/lib/pdf-builders/invoice";
import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";

const MAX_BATCH_SIZE = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: string[] = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids is required" }, { status: 400 });
    }

    if (ids.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `最大${MAX_BATCH_SIZE}件までです` },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    // Generate PDFs sequentially to avoid memory spikes
    for (const id of ids) {
      try {
        const { buffer, filename } = await buildInvoicePDFBuffer(id);
        zip.file(filename, buffer);
      } catch (err) {
        console.error(`Failed to generate PDF for invoice ${id}:`, err);
        // Skip failed ones instead of failing the whole batch
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new Response(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${encodeURIComponent("請求書一括.zip")}"`,
      },
    });
  } catch (err) {
    console.error("Batch PDF error:", err);
    return NextResponse.json({ error: "Batch PDF generation failed" }, { status: 500 });
  }
}
