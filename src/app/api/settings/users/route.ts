import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { userCreate } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const role = searchParams.get("role");
  const active = searchParams.get("active");
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

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

  const [users, total] = await Promise.all([
    prisma.user.findMany({
    where,
    include: {
      role: { select: { id: true, name: true, description: true } },
    },
    orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: users, total, page, limit }, { headers: cacheHeaders("TRANSACTION") });
  }
  return NextResponse.json(users, { headers: cacheHeaders("TRANSACTION") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, userCreate);
  if ("error" in result) return result.error;
  const body = result.data as any;

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

  await createAuditLog({ action: "CREATE", tableName: "User", recordId: record.id, newData: record });

  return NextResponse.json(record, { status: 201 });
});
