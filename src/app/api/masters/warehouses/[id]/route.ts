import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { warehouseUpdate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

// GET /api/masters/warehouses/[id]
export const GET = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: { plant: true },
  });

  if (!warehouse) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(warehouse);
});

// PUT /api/masters/warehouses/[id]
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const result = await validateBody(request, warehouseUpdate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const warehouse = await prisma.warehouse.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      plantId: body.plantId || null,
      address: body.address,
      capacity: body.capacity,
    },
  });

  return NextResponse.json(warehouse);
});

// DELETE /api/masters/warehouses/[id]
export const DELETE = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  await createAuditLog({ action: "DELETE", tableName: "Warehouse", recordId: id });
  await prisma.warehouse.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
