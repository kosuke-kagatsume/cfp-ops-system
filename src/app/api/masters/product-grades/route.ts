import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const grades = await prisma.productGrade.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(grades);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.productGrade.create({
    data: { code: body.code, name: body.name },
  });

  return NextResponse.json(item, { status: 201 });
}
