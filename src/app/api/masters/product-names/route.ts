import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const names = await prisma.productName.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(names);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.productName.create({
    data: {
      code: body.code,
      name: body.name,
      isccManageName: body.isccManageName,
      mixedProductCode: body.mixedProductCode,
      mixedRatio: body.mixedRatio,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
