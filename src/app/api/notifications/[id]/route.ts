import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return NextResponse.json(notification);
}
