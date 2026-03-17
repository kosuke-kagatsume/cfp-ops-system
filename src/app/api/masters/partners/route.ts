import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/partners - 取引先一覧
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const type = searchParams.get("type"); // customer, supplier, carrier
  const status = searchParams.get("status"); // active, inactive

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { nameKana: { contains: search, mode: "insensitive" } },
    ];
  }

  if (type === "customer") where.isCustomer = true;
  else if (type === "supplier") where.isSupplier = true;
  else if (type === "carrier") where.isCarrier = true;

  if (status === "active") where.isActive = true;
  else if (status === "inactive") where.isActive = false;

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam) : 1;
  const limit = pageParam ? Math.min(parseInt(searchParams.get("limit") ?? "50"), 200) : 10000;
  const skip = pageParam ? (page - 1) * limit : 0;

  const [partners, total] = await Promise.all([
    prisma.businessPartner.findMany({
    where,
    include: { contacts: true },
    orderBy: { code: "asc" },
      skip,
      take: limit,
    }),
    prisma.businessPartner.count({ where }),
  ]);

  if (pageParam) {
    return NextResponse.json({ items: partners, total, page, limit }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
  }
  return NextResponse.json(partners, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}

// POST /api/masters/partners - 取引先新規登録
export async function POST(request: NextRequest) {
  const body = await request.json();

  const partner = await prisma.businessPartner.create({
    data: {
      code: body.code,
      name: body.name,
      nameKana: body.nameKana,
      shortName: body.shortName,
      isCustomer: body.isCustomer ?? false,
      isSupplier: body.isSupplier ?? false,
      isPickup: body.isPickup ?? false,
      isDelivery: body.isDelivery ?? false,
      isCarrier: body.isCarrier ?? false,
      postalCode: body.postalCode,
      prefecture: body.prefecture,
      city: body.city,
      address: body.address,
      tel: body.tel,
      fax: body.fax,
      email: body.email,
      closingDay: body.closingDay,
      paymentSiteMonths: body.paymentSiteMonths,
      currency: body.currency,
      invoiceNumber: body.invoiceNumber,
      isIsccCertified: body.isIsccCertified ?? false,
      isccCertNumber: body.isccCertNumber,
      isOverseas: body.isOverseas ?? false,
      countryCode: body.countryCode,
      isActive: true,
    },
  });

  return NextResponse.json(partner, { status: 201 });
}
