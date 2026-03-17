import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const colors = await prisma.productColor.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(colors);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.productColor.create({
    data: { code: body.code, name: body.name },
  });

  return NextResponse.json(item, { status: 201 });
}
