import { prisma } from "@/lib/db";

export async function createNotification({
  userId,
  title,
  message,
  link,
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: { userId, title, message, link },
  });
}

export async function notifyApprovalCreated(request: {
  id: string;
  title: string;
  requestNumber: string;
  steps: Array<{ approver: { id: string; name: string } }>;
}) {
  const notifications = request.steps.map((step) =>
    createNotification({
      userId: step.approver.id,
      title: "承認依頼",
      message: `${request.requestNumber} ${request.title} の承認依頼が届きました`,
      link: `/approvals`,
    })
  );
  return Promise.all(notifications);
}

export async function notifyApprovalActioned(request: {
  id: string;
  title: string;
  requestNumber: string;
  createdBy: string;
  action: "approve" | "reject";
}) {
  const actionLabel = request.action === "approve" ? "承認" : "却下";
  return createNotification({
    userId: request.createdBy,
    title: `申請${actionLabel}`,
    message: `${request.requestNumber} ${request.title} が${actionLabel}されました`,
    link: `/approvals`,
  });
}
