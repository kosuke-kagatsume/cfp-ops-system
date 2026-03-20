import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { tankUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const record = await prisma.tank.findUnique({
    where: { id },
    include: {
      plant: { select: { id: true, code: true, name: true } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, tankUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const data: Record<string, unknown> = {};
  if (body.code !== undefined) data.code = body.code;
  if (body.name !== undefined) data.name = body.name;
  if (body.tankType !== undefined) data.tankType = body.tankType;
  if (body.plantId !== undefined) data.plantId = body.plantId;
  if (body.capacity !== undefined) data.capacity = body.capacity;
  if (body.currentLevel !== undefined) data.currentLevel = body.currentLevel;

  const record = await prisma.tank.update({
    where: { id },
    data,
    include: {
      plant: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(record);
});

export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "Tank", recordId: id });
  await prisma.tank.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
