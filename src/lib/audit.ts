import { prisma } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";

type AuditAction = "CREATE" | "UPDATE" | "DELETE";

/**
 * Create an audit log entry. Fire-and-forget: log failures are sent to Sentry
 * but never block the main request.
 */
export async function createAuditLog(params: {
  userId?: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldData?: object | null;
  newData?: object | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        tableName: params.tableName,
        recordId: params.recordId,
        oldData: params.oldData ? (params.oldData as Record<string, unknown>) : undefined,
        newData: params.newData ? (params.newData as Record<string, unknown>) : undefined,
      },
    });
  } catch (error) {
    Sentry.captureException(error);
  }
}
