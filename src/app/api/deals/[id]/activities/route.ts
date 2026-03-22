import { prisma } from "@/lib/db";
import { validateBody } from "@/lib/validate";
import { dealActivityCreate } from "@/lib/schemas";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type Params = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (_request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;

  const activities = await prisma.dealActivity.findMany({
    where: { dealId: id },
    orderBy: { activityDate: "desc" },
  });

  return NextResponse.json(activities);
});

export const POST = withErrorHandler(async (request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;
  const result = await validateBody(request, dealActivityCreate);
  if ("error" in result) return result.error;
  const body = result.data;

  const activity = await prisma.dealActivity.create({
    data: {
      dealId: id,
      activityType: body.activityType,
      description: body.description,
      activityDate: body.activityDate ? new Date(body.activityDate as string) : new Date(),
    },
  });

  return NextResponse.json(activity, { status: 201 });
});
