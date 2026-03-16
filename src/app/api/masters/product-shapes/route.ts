import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const shapes = await prisma.productShape.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(shapes);
}
