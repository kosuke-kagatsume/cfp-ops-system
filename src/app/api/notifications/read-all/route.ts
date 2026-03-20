import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";

export const PUT = withErrorHandler(async () => {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
});
