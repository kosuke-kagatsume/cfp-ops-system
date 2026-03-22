import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/auto-number";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-error-handler";
import { createAuditLog } from "@/lib/audit";

export const POST = withErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;

  const card = await prisma.businessCard.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (card.status === "CONVERTED") {
    return NextResponse.json({ error: "既に変換済みです" }, { status: 400 });
  }

  let partnerId = card.partnerId;

  // 既存顧客が紐づいていなければ新規作成
  if (!partnerId) {
    const code = await getNextNumber("BP");
    const partner = await prisma.businessPartner.create({
      data: {
        code,
        name: card.companyName ?? card.personName,
        isCustomer: true,
        tel: card.phone,
        fax: card.fax,
        email: card.email,
        address: card.address,
        website: card.website,
      },
    });
    partnerId = partner.id;
    await createAuditLog({ action: "CREATE", tableName: "BusinessPartner", recordId: partner.id, newData: partner });
  }

  // PartnerContact を作成
  const contact = await prisma.partnerContact.create({
    data: {
      partnerId,
      name: card.personName,
      department: card.department,
      position: card.position,
      tel: card.phone,
      mobile: card.mobile,
      email: card.email,
      isPrimary: true,
    },
  });

  // 名刺ステータスを更新
  const updated = await prisma.businessCard.update({
    where: { id },
    data: {
      status: "CONVERTED",
      partnerId,
      contactId: contact.id,
    },
    include: {
      partner: { select: { id: true, code: true, name: true } },
    },
  });

  await createAuditLog({ action: "UPDATE", tableName: "BusinessCard", recordId: id, newData: updated });

  return NextResponse.json({ businessCard: updated, partner: { id: partnerId }, contact });
});
