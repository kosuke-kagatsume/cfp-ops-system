import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const names = await prisma.productName.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(names);
}
