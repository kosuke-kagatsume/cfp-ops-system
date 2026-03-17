import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.user.findUnique({
    where: { id },
    include: {
      role: { select: { id: true, name: true, description: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.nameKana !== undefined) data.nameKana = body.nameKana || null;
  if (body.email !== undefined) data.email = body.email;
  if (body.department !== undefined) data.department = body.department || null;
  if (body.position !== undefined) data.position = body.position || null;
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.roleId !== undefined) data.roleId = body.roleId || null;

  const record = await prisma.user.update({
    where: { id },
    data,
    include: {
      role: { select: { id: true, name: true, description: true } },
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
