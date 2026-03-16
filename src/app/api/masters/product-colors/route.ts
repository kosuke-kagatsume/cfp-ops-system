import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const colors = await prisma.productColor.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(colors);
}
