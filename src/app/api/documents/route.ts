import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const documentType = searchParams.get("documentType");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  if (documentType) {
    where.documentType = documentType;
  }

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

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

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();

  const record = await prisma.document.create({
    data: {
      documentType: body.documentType,
      title: body.title,
      filePath: body.filePath,
      fileSize: body.fileSize,
      mimeType: body.mimeType,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      note: body.note,
      createdBy: body.createdBy,
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "Document", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
