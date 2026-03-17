import { prisma } from "@/lib/db";

/**
 * Get the previous balance for a customer based on their most recent invoice.
 * Returns the invoice total minus any payments received after the invoice billing date.
 */
export async function getPreviousBalance(customerId: string): Promise<number> {
  // Find the customer's most recent invoice (by billingDate)
  const lastInvoice = await prisma.invoice.findFirst({
    where: { customerId },
    orderBy: { billingDate: "desc" },
  });

  if (!lastInvoice) {
    return 0;
  }

  // Sum payments received for this customer since the last invoice's billing date
  const payments = await prisma.paymentReceived.findMany({
    where: {
      customerId,
      paymentDate: { gte: lastInvoice.billingDate },
    },
  });

  const totalPayments = payments.reduce(
    (sum: number, p: { amount: number }) => sum + p.amount,
    0
  );

  return lastInvoice.total - totalPayments;
}

/**
 * Calculate and update invoice carry-forward balance.
 * carryover = prevBalance - paymentReceived
 * total = carryover + subtotal + taxAmount
 */
export async function calculateInvoiceBalance(invoiceId: string): Promise<void> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  const carryover = invoice.prevBalance - invoice.paymentReceived;
  const total = carryover + invoice.subtotal + invoice.taxAmount;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { carryover, total },
  });
}
