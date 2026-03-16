import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET /api/masters/products - 品目一覧（4軸結合）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { name: { contains: search, mode: "insensitive" } } },
      { shape: { name: { contains: search, mode: "insensitive" } } },
      { color: { name: { contains: search, mode: "insensitive" } } },
      { grade: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      name: true,
      shape: true,
      color: true,
      grade: true,
    },
    orderBy: { code: "asc" },
  });

  return NextResponse.json(products);
}

// POST /api/masters/products - 品目新規登録
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 4軸からコード自動生成
  const [nameRec, shapeRec, colorRec, gradeRec] = await Promise.all([
    prisma.productName.findUnique({ where: { id: body.nameId } }),
    prisma.productShape.findUnique({ where: { id: body.shapeId } }),
    prisma.productColor.findUnique({ where: { id: body.colorId } }),
    prisma.productGrade.findUnique({ where: { id: body.gradeId } }),
  ]);

  if (!nameRec || !shapeRec || !colorRec || !gradeRec) {
    return NextResponse.json({ error: "Invalid axis ID" }, { status: 400 });
  }

  const code = `${nameRec.code}-${shapeRec.code}-${colorRec.code}-${gradeRec.code}`;

  const product = await prisma.product.create({
    data: {
      code,
      nameId: body.nameId,
      shapeId: body.shapeId,
      colorId: body.colorId,
      gradeId: body.gradeId,
      isIsccEligible: body.isIsccEligible ?? false,
      isOilProduct: nameRec.code >= 900,
    },
    include: { name: true, shape: true, color: true, grade: true },
  });

  return NextResponse.json(product, { status: 201 });
}
