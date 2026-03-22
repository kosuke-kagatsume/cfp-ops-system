import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

type Params = { params: Promise<{ id: string }> };

export const PUT = withErrorHandler(async (request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;
  const { body } = await request.json();

  if (!body) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const comment = await prisma.recordComment.update({
    where: { id },
    data: { body },
  });

  return NextResponse.json(comment);
});

export const DELETE = withErrorHandler(async (_request: NextRequest, ctx: Params) => {
  const { id } = await ctx.params;

  await prisma.recordComment.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
