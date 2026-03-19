import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock } from "../setup";
import {
  createGetRequest,
  createJsonRequest,
  parseResponse,
} from "../helpers/request";

// ---------------------------------------------------------------------------
// Helper: reset all mocks between tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// Sales Orders
// ============================================================
describe("Sales Orders - /api/sales/orders", () => {
  // Lazy-import so mocks are registered first
  let GET: typeof import("@/app/api/sales/orders/route").GET;
  let POST: typeof import("@/app/api/sales/orders/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/orders/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array when no page param", async () => {
      const mockOrders = [{ id: "1", orderNumber: "SLS-2026-0001" }];
      vi.mocked(prismaMock.salesOrder.findMany).mockResolvedValue(mockOrders);
      vi.mocked(prismaMock.salesOrder.count).mockResolvedValue(1);

      const req = createGetRequest("/api/sales/orders");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(mockOrders);
    });

    it("returns paginated response when page param is set", async () => {
      const mockOrders = [{ id: "1" }];
      vi.mocked(prismaMock.salesOrder.findMany).mockResolvedValue(mockOrders);
      vi.mocked(prismaMock.salesOrder.count).mockResolvedValue(1);

      const req = createGetRequest("/api/sales/orders", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });

    it("supports search parameter", async () => {
      vi.mocked(prismaMock.salesOrder.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.salesOrder.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/orders", { search: "test" });
      await GET(req);

      expect(prismaMock.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it("supports status filter", async () => {
      vi.mocked(prismaMock.salesOrder.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.salesOrder.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/orders", { status: "DRAFT" });
      await GET(req);

      expect(prismaMock.salesOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "DRAFT" }),
        })
      );
    });
  });

  describe("POST", () => {
    it("creates order and returns 201", async () => {
      const created = { id: "new-1", orderNumber: "TEST-2026-0001", customerId: "c1" };
      vi.mocked(prismaMock.salesOrder.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/orders", "POST", {
        customerId: "c1",
        orderDate: "2026-01-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
      expect(prismaMock.salesOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: "c1",
            orderNumber: "TEST-2026-0001",
            status: "DRAFT",
          }),
        })
      );
    });

    it("creates order with items", async () => {
      const created = { id: "new-1", orderNumber: "TEST-2026-0001" };
      vi.mocked(prismaMock.salesOrder.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/orders", "POST", {
        customerId: "c1",
        orderDate: "2026-01-01",
        items: [{ productId: "p1", quantity: 10, unitPrice: 100 }],
      });
      const { status } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(prismaMock.salesOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ productId: "p1", quantity: 10, unitPrice: 100 }),
              ]),
            }),
          }),
        })
      );
    });

    it("returns 400 for missing required fields", async () => {
      const req = createJsonRequest("/api/sales/orders", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("returns 400 for invalid orderDate", async () => {
      const req = createJsonRequest("/api/sales/orders", "POST", {
        customerId: "c1",
        orderDate: "",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Sales Orders - /api/sales/orders/[id]", () => {
  let GET: typeof import("@/app/api/sales/orders/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/orders/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/orders/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/orders/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", orderNumber: "SLS-2026-0001" };
      vi.mocked(prismaMock.salesOrder.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/orders/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.salesOrder.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/orders/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", status: "CONFIRMED" };
      vi.mocked(prismaMock.salesOrder.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/orders/test-id", "PUT", {
        status: "CONFIRMED",
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });

    it("returns 400 for invalid body", async () => {
      // salesOrderUpdate is partial so almost anything is valid;
      // send non-JSON to trigger parse error
      const req = new (await import("next/server")).NextRequest(
        new URL("/api/sales/orders/test-id", "http://localhost:3000"),
        { method: "PUT", headers: { "Content-Type": "application/json" }, body: "not-json" }
      );
      const { status } = await parseResponse(await PUT(req, params));
      expect(status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("deletes items then order and returns success", async () => {
      vi.mocked(prismaMock.salesOrderItem.deleteMany).mockResolvedValue({ count: 2 });
      vi.mocked(prismaMock.salesOrder.delete).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/orders/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(prismaMock.salesOrderItem.deleteMany).toHaveBeenCalledWith({
        where: { salesOrderId: "test-id" },
      });
      expect(prismaMock.salesOrder.delete).toHaveBeenCalledWith({
        where: { id: "test-id" },
      });
    });
  });
});

// ============================================================
// Revenue
// ============================================================
describe("Revenue - /api/sales/revenue", () => {
  let GET: typeof import("@/app/api/sales/revenue/route").GET;
  let POST: typeof import("@/app/api/sales/revenue/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/revenue/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array when no page param", async () => {
      const mockData = [{ id: "r1", revenueNumber: "REV-2026-0001" }];
      vi.mocked(prismaMock.revenue.findMany).mockResolvedValue(mockData);
      vi.mocked(prismaMock.revenue.count).mockResolvedValue(1);

      const req = createGetRequest("/api/sales/revenue");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.revenue.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.revenue.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/revenue", { page: "1" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total");
    });

    it("supports division filter", async () => {
      vi.mocked(prismaMock.revenue.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.revenue.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/revenue", { division: "CR" });
      await GET(req);

      expect(prismaMock.revenue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ division: "CR" }),
        })
      );
    });
  });

  describe("POST", () => {
    it("creates revenue and returns 201", async () => {
      const created = { id: "r1", revenueNumber: "TEST-2026-0001" };
      vi.mocked(prismaMock.revenue.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/revenue", "POST", {
        revenueDate: "2026-01-15",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 for missing revenueDate", async () => {
      const req = createJsonRequest("/api/sales/revenue", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });
});

describe("Revenue - /api/sales/revenue/[id]", () => {
  let GET: typeof import("@/app/api/sales/revenue/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/revenue/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/revenue/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/revenue/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", revenueNumber: "REV-2026-0001" };
      vi.mocked(prismaMock.revenue.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/revenue/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.revenue.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/revenue/test-id");
      const { status } = await parseResponse(await GET(req, params));

      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", amount: 5000 };
      vi.mocked(prismaMock.revenue.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/revenue/test-id", "PUT", {
        amount: 5000,
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns success", async () => {
      vi.mocked(prismaMock.revenue.delete).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/revenue/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ============================================================
// Invoices
// ============================================================
describe("Invoices - /api/sales/invoices", () => {
  let GET: typeof import("@/app/api/sales/invoices/route").GET;
  let POST: typeof import("@/app/api/sales/invoices/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/invoices/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array", async () => {
      const mockData = [{ id: "i1", invoiceNumber: "INV-2026-0001" }];
      vi.mocked(prismaMock.invoice.findMany).mockResolvedValue(mockData);
      vi.mocked(prismaMock.invoice.count).mockResolvedValue(1);

      const req = createGetRequest("/api/sales/invoices");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.invoice.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.invoice.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/invoices", { page: "1", limit: "20" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total");
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 20);
    });

    it("supports search and status filter", async () => {
      vi.mocked(prismaMock.invoice.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.invoice.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/invoices", { search: "test", status: "ISSUED" });
      await GET(req);

      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
            status: "ISSUED",
          }),
        })
      );
    });
  });

  describe("POST", () => {
    it("creates invoice and returns 201", async () => {
      const created = { id: "i1", invoiceNumber: "TEST-2026-0001", customerId: "c1" };
      vi.mocked(prismaMock.invoice.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/invoices", "POST", {
        customerId: "c1",
        billingDate: "2026-01-31",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 for missing customerId", async () => {
      const req = createJsonRequest("/api/sales/invoices", "POST", {
        billingDate: "2026-01-31",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("returns 400 for missing billingDate", async () => {
      const req = createJsonRequest("/api/sales/invoices", "POST", {
        customerId: "c1",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Invoices - /api/sales/invoices/[id]", () => {
  let GET: typeof import("@/app/api/sales/invoices/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/invoices/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/invoices/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/invoices/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", invoiceNumber: "INV-2026-0001" };
      vi.mocked(prismaMock.invoice.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/invoices/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.invoice.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/invoices/test-id");
      const { status } = await parseResponse(await GET(req, params));

      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates invoice and recalculates balance", async () => {
      const updated = { id: "test-id", status: "ISSUED" };
      vi.mocked(prismaMock.invoice.update).mockResolvedValue(updated);
      vi.mocked(prismaMock.invoice.findUnique).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/invoices/test-id", "PUT", {
        status: "ISSUED",
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
      expect(prismaMock.invoice.update).toHaveBeenCalled();
    });
  });

  describe("DELETE", () => {
    it("returns success", async () => {
      vi.mocked(prismaMock.invoice.delete).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/invoices/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ============================================================
// Quotations
// ============================================================
describe("Quotations - /api/sales/quotations", () => {
  let GET: typeof import("@/app/api/sales/quotations/route").GET;
  let POST: typeof import("@/app/api/sales/quotations/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/quotations/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array", async () => {
      vi.mocked(prismaMock.quotation.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.quotation.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/quotations");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("applies deletedAt: null filter", async () => {
      vi.mocked(prismaMock.quotation.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.quotation.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/quotations");
      await GET(req);

      expect(prismaMock.quotation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.quotation.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.quotation.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/quotations", { page: "2", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("page", 2);
    });
  });

  describe("POST", () => {
    it("creates quotation and returns 201", async () => {
      const created = { id: "q1", quotationNumber: "TEST-2026-0001" };
      vi.mocked(prismaMock.quotation.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/quotations", "POST", {
        quotationDate: "2026-02-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 for missing quotationDate", async () => {
      const req = createJsonRequest("/api/sales/quotations", "POST", {});
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Quotations - /api/sales/quotations/[id]", () => {
  let GET: typeof import("@/app/api/sales/quotations/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/quotations/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/quotations/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/quotations/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", quotationNumber: "QUO-2026-0001" };
      vi.mocked(prismaMock.quotation.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/quotations/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.quotation.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/quotations/test-id");
      const { status } = await parseResponse(await GET(req, params));
      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", status: "SENT" };
      vi.mocked(prismaMock.quotation.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/quotations/test-id", "PUT", {
        status: "SENT",
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("soft deletes and returns success", async () => {
      vi.mocked(prismaMock.quotation.update).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/quotations/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(prismaMock.quotation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-id" },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
  });
});

// ============================================================
// Freight (Dispatch)
// ============================================================
describe("Freight - /api/sales/freight", () => {
  let GET: typeof import("@/app/api/sales/freight/route").GET;
  let POST: typeof import("@/app/api/sales/freight/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/freight/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array", async () => {
      vi.mocked(prismaMock.dispatch.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.dispatch.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/freight");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("applies deletedAt filter", async () => {
      vi.mocked(prismaMock.dispatch.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.dispatch.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/freight");
      await GET(req);

      expect(prismaMock.dispatch.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      );
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.dispatch.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.dispatch.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/freight", { page: "1" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
    });
  });

  describe("POST", () => {
    it("creates dispatch and returns 201", async () => {
      const created = { id: "d1", shipmentId: "s1" };
      vi.mocked(prismaMock.dispatch.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/freight", "POST", {
        shipmentId: "s1",
        dispatchDate: "2026-02-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 for missing shipmentId", async () => {
      const req = createJsonRequest("/api/sales/freight", "POST", {
        dispatchDate: "2026-02-01",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing dispatchDate", async () => {
      const req = createJsonRequest("/api/sales/freight", "POST", {
        shipmentId: "s1",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Freight - /api/sales/freight/[id]", () => {
  let GET: typeof import("@/app/api/sales/freight/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/freight/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/freight/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/freight/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", shipmentId: "s1" };
      vi.mocked(prismaMock.dispatch.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/freight/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.dispatch.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/freight/test-id");
      const { status } = await parseResponse(await GET(req, params));
      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", freightCost: 15000 };
      vi.mocked(prismaMock.dispatch.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/freight/test-id", "PUT", {
        freightCost: 15000,
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("soft deletes and returns success", async () => {
      vi.mocked(prismaMock.dispatch.update).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/freight/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
      expect(prismaMock.dispatch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "test-id" },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );
    });
  });
});

// ============================================================
// Payments Received
// ============================================================
describe("Payments Received - /api/sales/payments-received", () => {
  let GET: typeof import("@/app/api/sales/payments-received/route").GET;
  let POST: typeof import("@/app/api/sales/payments-received/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/payments-received/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array", async () => {
      vi.mocked(prismaMock.paymentReceived.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.paymentReceived.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/payments-received");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.paymentReceived.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.paymentReceived.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/payments-received", { page: "1" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total");
    });
  });

  describe("POST", () => {
    it("creates payment and returns 201", async () => {
      const created = { id: "pr1", paymentNumber: "TEST-2026-0001" };
      vi.mocked(prismaMock.paymentReceived.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/payments-received", "POST", {
        customerId: "c1",
        paymentDate: "2026-03-01",
        amount: 100000,
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
      expect(prismaMock.paymentReceived.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: "c1",
            amount: 100000,
            isReconciled: false,
          }),
        })
      );
    });

    it("returns 400 for missing customerId", async () => {
      const req = createJsonRequest("/api/sales/payments-received", "POST", {
        paymentDate: "2026-03-01",
        amount: 100000,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing paymentDate", async () => {
      const req = createJsonRequest("/api/sales/payments-received", "POST", {
        customerId: "c1",
        amount: 100000,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing amount", async () => {
      const req = createJsonRequest("/api/sales/payments-received", "POST", {
        customerId: "c1",
        paymentDate: "2026-03-01",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Payments Received - /api/sales/payments-received/[id]", () => {
  let GET: typeof import("@/app/api/sales/payments-received/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/payments-received/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/payments-received/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/payments-received/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", paymentNumber: "RCV-2026-0001" };
      vi.mocked(prismaMock.paymentReceived.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/payments-received/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.paymentReceived.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/payments-received/test-id");
      const { status } = await parseResponse(await GET(req, params));
      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", isReconciled: true };
      vi.mocked(prismaMock.paymentReceived.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/payments-received/test-id", "PUT", {
        isReconciled: true,
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns success", async () => {
      vi.mocked(prismaMock.paymentReceived.delete).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/payments-received/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ============================================================
// Payments Payable
// ============================================================
describe("Payments Payable - /api/sales/payments-payable", () => {
  let GET: typeof import("@/app/api/sales/payments-payable/route").GET;
  let POST: typeof import("@/app/api/sales/payments-payable/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/payments-payable/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array", async () => {
      vi.mocked(prismaMock.paymentPayable.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.paymentPayable.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/payments-payable");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.paymentPayable.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.paymentPayable.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/payments-payable", { page: "1" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
    });
  });

  describe("POST", () => {
    it("creates payment and returns 201", async () => {
      const created = { id: "pp1", paymentNumber: "TEST-2026-0001" };
      vi.mocked(prismaMock.paymentPayable.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/payments-payable", "POST", {
        supplierId: "s1",
        paymentDate: "2026-03-01",
        amount: 50000,
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
      expect(prismaMock.paymentPayable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            supplierId: "s1",
            amount: 50000,
            isReconciled: false,
          }),
        })
      );
    });

    it("returns 400 for missing supplierId", async () => {
      const req = createJsonRequest("/api/sales/payments-payable", "POST", {
        paymentDate: "2026-03-01",
        amount: 50000,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing paymentDate", async () => {
      const req = createJsonRequest("/api/sales/payments-payable", "POST", {
        supplierId: "s1",
        amount: 50000,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing amount", async () => {
      const req = createJsonRequest("/api/sales/payments-payable", "POST", {
        supplierId: "s1",
        paymentDate: "2026-03-01",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Payments Payable - /api/sales/payments-payable/[id]", () => {
  let GET: typeof import("@/app/api/sales/payments-payable/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/payments-payable/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/payments-payable/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/payments-payable/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", paymentNumber: "PAY-2026-0001" };
      vi.mocked(prismaMock.paymentPayable.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/payments-payable/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.paymentPayable.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/payments-payable/test-id");
      const { status } = await parseResponse(await GET(req, params));
      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", amount: 60000 };
      vi.mocked(prismaMock.paymentPayable.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/payments-payable/test-id", "PUT", {
        amount: 60000,
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns success", async () => {
      vi.mocked(prismaMock.paymentPayable.delete).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/payments-payable/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ============================================================
// Exchange Rates
// ============================================================
describe("Exchange Rates - /api/sales/exchange-rates", () => {
  let GET: typeof import("@/app/api/sales/exchange-rates/route").GET;
  let POST: typeof import("@/app/api/sales/exchange-rates/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/exchange-rates/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with array", async () => {
      const mockData = [{ id: "er1", fromCurrency: "USD", toCurrency: "JPY", rate: 150 }];
      vi.mocked(prismaMock.exchangeRate.findMany).mockResolvedValue(mockData);
      vi.mocked(prismaMock.exchangeRate.count).mockResolvedValue(1);

      const req = createGetRequest("/api/sales/exchange-rates");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toEqual(mockData);
    });

    it("returns paginated response", async () => {
      vi.mocked(prismaMock.exchangeRate.findMany).mockResolvedValue([]);
      vi.mocked(prismaMock.exchangeRate.count).mockResolvedValue(0);

      const req = createGetRequest("/api/sales/exchange-rates", { page: "1" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total");
    });
  });

  describe("POST", () => {
    it("creates exchange rate and returns 201", async () => {
      const created = { id: "er1", fromCurrency: "USD", toCurrency: "JPY", rate: 150 };
      vi.mocked(prismaMock.exchangeRate.create).mockResolvedValue(created);

      const req = createJsonRequest("/api/sales/exchange-rates", "POST", {
        fromCurrency: "USD",
        rate: 150,
        effectiveDate: "2026-03-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 for missing fromCurrency", async () => {
      const req = createJsonRequest("/api/sales/exchange-rates", "POST", {
        rate: 150,
        effectiveDate: "2026-03-01",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing rate", async () => {
      const req = createJsonRequest("/api/sales/exchange-rates", "POST", {
        fromCurrency: "USD",
        effectiveDate: "2026-03-01",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 for missing effectiveDate", async () => {
      const req = createJsonRequest("/api/sales/exchange-rates", "POST", {
        fromCurrency: "USD",
        rate: 150,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

describe("Exchange Rates - /api/sales/exchange-rates/[id]", () => {
  let GET: typeof import("@/app/api/sales/exchange-rates/[id]/route").GET;
  let PUT: typeof import("@/app/api/sales/exchange-rates/[id]/route").PUT;
  let DELETE: typeof import("@/app/api/sales/exchange-rates/[id]/route").DELETE;

  const params = { params: Promise.resolve({ id: "test-id" }) };

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/exchange-rates/[id]/route");
    GET = mod.GET;
    PUT = mod.PUT;
    DELETE = mod.DELETE;
  });

  describe("GET", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", fromCurrency: "USD", rate: 150 };
      vi.mocked(prismaMock.exchangeRate.findUnique).mockResolvedValue(record);

      const req = createGetRequest("/api/sales/exchange-rates/test-id");
      const { status, body } = await parseResponse(await GET(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      vi.mocked(prismaMock.exchangeRate.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/sales/exchange-rates/test-id");
      const { status } = await parseResponse(await GET(req, params));
      expect(status).toBe(404);
    });
  });

  describe("PUT", () => {
    it("updates and returns 200", async () => {
      const updated = { id: "test-id", rate: 155 };
      vi.mocked(prismaMock.exchangeRate.update).mockResolvedValue(updated);

      const req = createJsonRequest("/api/sales/exchange-rates/test-id", "PUT", {
        rate: 155,
      });
      const { status, body } = await parseResponse(await PUT(req, params));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE", () => {
    it("returns success", async () => {
      vi.mocked(prismaMock.exchangeRate.delete).mockResolvedValue({});

      const req = createJsonRequest("/api/sales/exchange-rates/test-id", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, params));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ============================================================
// Reconciliation
// ============================================================
describe("Reconciliation - /api/sales/reconciliation", () => {
  let GET: typeof import("@/app/api/sales/reconciliation/route").GET;
  let POST: typeof import("@/app/api/sales/reconciliation/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/reconciliation/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with unreconciled payments", async () => {
      const payment = { id: "p1", customerId: "c1", customer: { id: "c1", name: "Test", code: "T1" } };
      vi.mocked(prismaMock.paymentReceived.findMany).mockResolvedValue([payment]);
      vi.mocked(prismaMock.invoice.findMany).mockResolvedValue([]);

      const req = createGetRequest("/api/sales/reconciliation");
      const { status, body } = await parseResponse(await GET());

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toHaveProperty("candidates");
    });

    it("returns empty array when no unreconciled payments", async () => {
      vi.mocked(prismaMock.paymentReceived.findMany).mockResolvedValue([]);

      const { status, body } = await parseResponse(await GET());

      expect(status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe("POST", () => {
    it("executes auto reconciliation", async () => {
      const req = createJsonRequest("/api/sales/reconciliation", "POST", {
        action: "auto",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("matched");
      expect(body).toHaveProperty("unmatched");
    });

    it("executes manual reconciliation", async () => {
      const req = createJsonRequest("/api/sales/reconciliation", "POST", {
        action: "manual",
        paymentId: "p1",
        invoiceId: "i1",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("success", true);
    });

    it("returns 400 for manual without paymentId/invoiceId", async () => {
      const req = createJsonRequest("/api/sales/reconciliation", "POST", {
        action: "manual",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("returns 400 for invalid action", async () => {
      const req = createJsonRequest("/api/sales/reconciliation", "POST", {
        action: "invalid",
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});

// ============================================================
// Monthly Closing
// ============================================================
describe("Monthly Closing - /api/sales/monthly-closing", () => {
  let GET: typeof import("@/app/api/sales/monthly-closing/route").GET;
  let POST: typeof import("@/app/api/sales/monthly-closing/route").POST;

  beforeEach(async () => {
    const mod = await import("@/app/api/sales/monthly-closing/route");
    GET = mod.GET;
    POST = mod.POST;
  });

  describe("GET", () => {
    it("returns 200 with 12 months of data", async () => {
      vi.mocked(prismaMock.monthlyClosing.findMany).mockResolvedValue([]);

      const req = createGetRequest("/api/sales/monthly-closing");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(12);
    });

    it("merges existing closings with placeholder months", async () => {
      const now = new Date();
      const existing = {
        id: "mc1",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        isClosed: true,
        closedAt: now.toISOString(),
        closedBy: "user1",
        closedByUser: { name: "Test User" },
      };
      vi.mocked(prismaMock.monthlyClosing.findMany).mockResolvedValue([existing]);

      const req = createGetRequest("/api/sales/monthly-closing");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      const currentMonth = body.find(
        (m: { year: number; month: number }) => m.year === now.getFullYear() && m.month === now.getMonth() + 1
      );
      expect(currentMonth).toHaveProperty("isClosed", true);
    });

    it("returns pre-check result when check=true", async () => {
      const req = createGetRequest("/api/sales/monthly-closing", {
        check: "true",
        year: "2026",
        month: "3",
      });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("canClose");
    });

    it("returns 400 when check=true without year/month", async () => {
      const req = createGetRequest("/api/sales/monthly-closing", {
        check: "true",
      });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("POST", () => {
    it("executes monthly closing", async () => {
      const req = createJsonRequest("/api/sales/monthly-closing", "POST", {
        action: "close",
        year: 2026,
        month: 3,
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("success", true);
    });

    it("reopens monthly closing", async () => {
      const req = createJsonRequest("/api/sales/monthly-closing", "POST", {
        action: "reopen",
        year: 2026,
        month: 3,
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("success", true);
    });

    it("returns 400 for invalid action", async () => {
      const req = createJsonRequest("/api/sales/monthly-closing", "POST", {
        action: "invalid",
        year: 2026,
        month: 3,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });

    it("returns 400 when closing fails", async () => {
      const { executeMonthlyClosing } = await import("@/lib/monthly-closing");
      vi.mocked(executeMonthlyClosing).mockResolvedValueOnce({ success: false, error: "Unresolved items" } as any);

      const req = createJsonRequest("/api/sales/monthly-closing", "POST", {
        action: "close",
        year: 2026,
        month: 3,
      });
      const { status } = await parseResponse(await POST(req));
      expect(status).toBe(400);
    });
  });
});
