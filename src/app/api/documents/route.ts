import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

  const documents = await prisma.document.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
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

  return NextResponse.json(record, { status: 201 });
}
