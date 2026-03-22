import { prisma } from "@/lib/db";

/**
 * Supported prefixes:
 *   PUR: 仕入 (Purchase)
 *   SHP: 出荷 (Shipment)
 *   PRC: 加工 (ProcessingOrder)
 *   SLS: 受注 (SalesOrder) — existing data uses SLS
 *   REV: 売上 (Revenue)
 *   INV: 請求 (Invoice)
 *   RCV: 入金 (PaymentReceived)
 *   PAY: 支払 (PaymentPayable)
 *   QUO: 見積 (Quotation)
 *   EXP: 経費 (Expense)
 *   CRM: CR原料 (CrMaterial)
 *   CRP: CR製造 (CrProductionOrder)
 *   OIL: 油出荷 (OilShipment)
 *   SMP: 分析サンプル (LabSample) — existing data uses SMP
 *   TRC: トレース (TraceRecord)
 *   CNT: 契約 (Contract) — existing data uses CNT
 *   APR: 承認 (ApprovalRequest)
 *   CHT: チャットルーム (ChatRoom)
 */

/**
 * Get next number in sequence. Creates sequence if it doesn't exist.
 * Returns formatted string like "PUR-2026-0001"
 */
export async function getNextNumber(prefix: string): Promise<string> {
  const year = new Date().getFullYear();

  const seq = await prisma.numberSequence.upsert({
    where: { prefix_year: { prefix, year } },
    update: { currentNumber: { increment: 1 } },
    create: { prefix, year, currentNumber: 1 },
  });

  const num = String(seq.currentNumber).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
}
