import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const grades = await prisma.productGrade.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(grades);
}
