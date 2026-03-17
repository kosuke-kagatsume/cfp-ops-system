import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const shapes = await prisma.productShape.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(shapes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const item = await prisma.productShape.create({
    data: { code: body.code, name: body.name },
  });

  return NextResponse.json(item, { status: 201 });
}
