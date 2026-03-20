import { prisma } from "@/lib/db";
import { DocumentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const where = {
    documentType: {
      in: [DocumentType.EXPORT_INVOICE, DocumentType.PACKING_LIST],
    },
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: documents, total, page, limit });
  }
  return NextResponse.json(documents);
});
