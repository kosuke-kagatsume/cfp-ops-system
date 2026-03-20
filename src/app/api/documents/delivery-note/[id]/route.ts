import { prisma } from "@/lib/db";
import { generateDeliveryNoteHTML } from "@/lib/document-templates";
import { NextRequest } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const doc = await prisma.document.findUnique({
    where: { id },
  });

  if (!doc) {
    return new Response("Not found", { status: 404 });
  }

  const html = generateDeliveryNoteHTML({
    documentId: doc.id,
    title: doc.title,
    documentType: doc.documentType,
    createdAt: doc.createdAt,
    note: doc.note,
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
