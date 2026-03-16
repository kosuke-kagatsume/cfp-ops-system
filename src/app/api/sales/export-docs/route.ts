import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const documents = await prisma.document.findMany({
    where: {
      documentType: {
        in: ["EXPORT_INVOICE", "PACKING_LIST"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}
