import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await prisma.businessPartner.count();
    return NextResponse.json({
      status: "ok",
      partnerCount: count,
      env: {
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
        prismaUrlPrefix: process.env.POSTGRES_PRISMA_URL?.substring(0, 30) + "...",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { status: "error", message, env: {
        hasPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
        hasNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
        prismaUrlPrefix: process.env.POSTGRES_PRISMA_URL?.substring(0, 30) + "...",
      }},
      { status: 500 }
    );
  }
}
