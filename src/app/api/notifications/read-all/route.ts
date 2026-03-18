import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT() {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
