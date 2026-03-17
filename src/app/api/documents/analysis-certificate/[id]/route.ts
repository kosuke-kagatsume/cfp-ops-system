import { prisma } from "@/lib/db";
import { generateAnalysisCertificateHTML } from "@/lib/document-templates";
import { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cert = await prisma.analysisCertificate.findUnique({
    where: { id },
    include: {
      sample: {
        include: {
          product: {
            include: {
              name: { select: { name: true } },
            },
          },
          analysisResults: true,
        },
      },
    },
  });

  if (!cert) {
    return new Response("Not found", { status: 404 });
  }

  const results = cert.sample.analysisResults;
  const allPassed =
    results.length > 0 && results.every((r) => r.isPassed === true);
  const anyFailed = results.some((r) => r.isPassed === false);
  const overallJudgment =
    results.length === 0
      ? null
      : anyFailed
        ? "不合格"
        : allPassed
          ? "合格"
          : null;

  const html = generateAnalysisCertificateHTML({
    certificateNumber: cert.certificateNumber,
    issueDate: cert.issueDate,
    sampleNumber: cert.sample.sampleNumber,
    sampleName: cert.sample.sampleName,
    productName:
      cert.sample.product?.displayName ??
      cert.sample.product?.name?.name ??
      "-",
    source: cert.sample.source,
    receivedDate: cert.sample.receivedDate,
    analysisResults: results.map((r) => ({
      testItem: r.testItem,
      standard: r.standard,
      result: r.result,
      unit: r.unit,
      isPassed: r.isPassed,
    })),
    overallJudgment,
    note: cert.note,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
