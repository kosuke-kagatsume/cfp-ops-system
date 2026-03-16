import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const plants = await prisma.plant.findMany({
    include: {
      warehouses: true,
      tanks: true,
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(plants);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const plant = await prisma.plant.create({
    data: {
      code: body.code,
      name: body.name,
      companyId: body.companyId ?? "CFP",
      address: body.address,
      tel: body.tel,
    },
  });

  return NextResponse.json(plant, { status: 201 });
}
