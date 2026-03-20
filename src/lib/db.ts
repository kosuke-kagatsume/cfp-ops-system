import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING;
  const adapter = new PrismaPg({
    connectionString,
    max: 10,
    idleTimeoutMillis: 20000,
  });

  const base = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  // ---------------------------------------------------------------------------
  // ソフトデリート: Prisma extension
  // deletedAt を持つモデルへの find 系に自動フィルタ、delete を soft delete に変換
  // ---------------------------------------------------------------------------
  const extended = base.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (where.deletedAt === undefined) {
              where.deletedAt = null;
            }
            args.where = where;
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (where.deletedAt === undefined) {
              where.deletedAt = null;
            }
            args.where = where;
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            const modelName = uncapitalize(model);
            return (base as unknown as Record<string, { update: (a: unknown) => unknown }>)[
              modelName
            ].update({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            const modelName = uncapitalize(model);
            return (base as unknown as Record<string, { updateMany: (a: unknown) => unknown }>)[
              modelName
            ].updateMany({
              where: args.where,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
      },
    },
  });

  return extended;
}

const SOFT_DELETE_MODELS = new Set([
  "ProductName",
  "ProductShape",
  "ProductColor",
  "ProductGrade",
  "Product",
  "BusinessPartner",
  "PartnerContact",
  "CustomerPrice",
  "Purchase",
  "ProcessingOrder",
  "Shipment",
  "Dispatch",
  "CrMaterial",
  "CrProductionOrder",
  "OilShipment",
  "LabSample",
  "SalesOrder",
  "Revenue",
  "Invoice",
  "PaymentReceived",
  "PaymentPayable",
  "Quotation",
  "IsccCertificate",
  "Contract",
  "Expense",
]);

function isSoftDeleteModel(model: string | undefined): boolean {
  return model != null && SOFT_DELETE_MODELS.has(model);
}

function uncapitalize(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type ExtendedPrismaClient = typeof prisma;
