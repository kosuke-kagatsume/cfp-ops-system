import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { residueCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.contractor = { contains: search, mode: "insensitive" };
  }

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [residues, total] = await Promise.all([
    prisma.residue.findMany({
    where,
    orderBy: { disposalDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.residue.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: residues, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(residues, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, residueCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const record = await prisma.residue.create({
    data: {
      disposalDate: new Date(body.disposalDate),
      quantity: body.quantity,
      disposalMethod: body.disposalMethod,
      disposalCost: body.disposalCost,
      contractor: body.contractor,
      note: body.note,
    },
  });

  await createAuditLog({ action: "CREATE", tableName: "CrResidue", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
