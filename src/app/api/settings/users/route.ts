import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = { name: role };
  }

  if (active !== null && active !== undefined && active !== "") {
    where.isActive = active === "true";
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      role: { select: { id: true, name: true, description: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const record = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      nameKana: body.nameKana,
      department: body.department,
      position: body.position,
      isActive: body.isActive ?? true,
      roleId: body.roleId || undefined,
    },
    include: {
      role: { select: { id: true, name: true, description: true } },
    },
  });

  return NextResponse.json(record, { status: 201 });
}
