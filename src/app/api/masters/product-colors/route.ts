import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { simpleCodeName } from "@/lib/schemas";
import { cacheHeaders } from "@/lib/cache";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [colors, total] = await Promise.all([
    prisma.productColor.findMany({
 orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.productColor.count(),
  ]);
  if (pageParam) {
    return NextResponse.json({ items: colors, total, page, limit }, { headers: cacheHeaders("MASTER") });
  }
  return NextResponse.json(colors, { headers: cacheHeaders("MASTER") });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const result = await validateBody(request, simpleCodeName);
  if ("error" in result) return result.error;
  const body = result.data as any;

  const item = await prisma.productColor.create({
    data: { code: body.code, name: body.name },
  });

  await createAuditLog({ action: "CREATE", tableName: "ProductColor", recordId: item.id, newData: item });

  return NextResponse.json(item, { status: 201 });
});
