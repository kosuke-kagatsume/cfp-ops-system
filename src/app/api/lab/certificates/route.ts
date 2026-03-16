import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { certificateNumber: { contains: search, mode: "insensitive" } },
      {
        sample: {
          sampleNumber: { contains: search, mode: "insensitive" },
        },
      },
    ];
  }

  const data = await prisma.analysisCertificate.findMany({
    where,
    include: {
      sample: {
        include: {
          product: { include: { name: true } },
          analysisResults: true,
        },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  return NextResponse.json(data);
}
