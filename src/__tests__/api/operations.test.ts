import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import {
  createGetRequest,
  createJsonRequest,
  parseResponse,
} from "@/__tests__/helpers/request";

// Additional mocks needed by purchase route
vi.mock("@/lib/inventory", () => ({
  updateMovingAverage: vi.fn(),
}));

vi.mock("@/lib/journal", () => ({
  generatePurchaseJournal: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helper: typed mock access for prisma model methods
// ---------------------------------------------------------------------------
function mockModel(model: string) {
  const m = (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>)[model];
  return m;
}

// ---------------------------------------------------------------------------
// MR — Purchases
// ---------------------------------------------------------------------------
describe("MR Purchases API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/mr/purchases", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/mr/purchases/route");
      const mockData = [{ id: "p1", purchaseNumber: "PUR-2026-0001" }];
      mockModel("purchase").findMany.mockResolvedValue(mockData);
      mockModel("purchase").count.mockResolvedValue(1);

      const req = createGetRequest("/api/mr/purchases");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/mr/purchases", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/mr/purchases/route");
      const input = {
        supplierId: "sup-1",
        productId: "prod-1",
        purchaseDate: "2026-01-01",
        quantity: 100,
        unitPrice: 50,
      };
      const mockResult = { id: "p1", purchaseNumber: "TEST-001", ...input, amount: 5000 };
      mockModel("purchase").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/mr/purchases", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("p1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/mr/purchases/route");
      const req = createJsonRequest("/api/mr/purchases", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/mr/purchases/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/mr/purchases/[id]/route");
      const mockRecord = { id: "p1", purchaseNumber: "PUR-2026-0001" };
      mockModel("purchase").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/mr/purchases/p1");
      const res = await GET(req, { params: Promise.resolve({ id: "p1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("p1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/mr/purchases/[id]/route");
      mockModel("purchase").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/mr/purchases/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/mr/purchases/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/mr/purchases/[id]/route");
      const existing = { id: "p1", status: "PLANNED" };
      const updated = { id: "p1", quantity: 200 };
      mockModel("purchase").findUnique.mockResolvedValue(existing);
      mockModel("purchase").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/mr/purchases/p1", "PUT", { quantity: 200 });
      const res = await PUT(req, { params: Promise.resolve({ id: "p1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.quantity).toBe(200);
    });
  });

  describe("DELETE /api/mr/purchases/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/mr/purchases/[id]/route");
      mockModel("purchase").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/mr/purchases/p1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "p1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// MR — Shipments
// ---------------------------------------------------------------------------
describe("MR Shipments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/mr/shipments", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/mr/shipments/route");
      const mockData = [{ id: "s1", shipmentNumber: "SHP-2026-0001" }];
      mockModel("shipment").findMany.mockResolvedValue(mockData);
      mockModel("shipment").count.mockResolvedValue(1);

      const req = createGetRequest("/api/mr/shipments");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/mr/shipments", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/mr/shipments/route");
      const input = {
        customerId: "cust-1",
        productId: "prod-1",
        quantity: 50,
      };
      const mockResult = { id: "s1", shipmentNumber: "TEST-001", ...input };
      mockModel("shipment").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/mr/shipments", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("s1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/mr/shipments/route");
      const req = createJsonRequest("/api/mr/shipments", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/mr/shipments/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/mr/shipments/[id]/route");
      const mockRecord = { id: "s1", shipmentNumber: "SHP-2026-0001" };
      mockModel("shipment").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/mr/shipments/s1");
      const res = await GET(req, { params: Promise.resolve({ id: "s1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("s1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/mr/shipments/[id]/route");
      mockModel("shipment").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/mr/shipments/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/mr/shipments/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/mr/shipments/[id]/route");
      const updated = { id: "s1", quantity: 75 };
      mockModel("shipment").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/mr/shipments/s1", "PUT", { quantity: 75 });
      const res = await PUT(req, { params: Promise.resolve({ id: "s1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.quantity).toBe(75);
    });
  });

  describe("DELETE /api/mr/shipments/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/mr/shipments/[id]/route");
      mockModel("shipment").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/mr/shipments/s1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "s1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// MR — Dispatch
// ---------------------------------------------------------------------------
describe("MR Dispatch API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/mr/dispatch", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/mr/dispatch/route");
      const mockData = [{ id: "d1" }];
      mockModel("dispatch").findMany.mockResolvedValue(mockData);
      mockModel("dispatch").count.mockResolvedValue(1);

      const req = createGetRequest("/api/mr/dispatch");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/mr/dispatch", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/mr/dispatch/route");
      const input = { shipmentId: "shp-1" };
      const mockResult = { id: "d1", ...input };
      mockModel("dispatch").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/mr/dispatch", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("d1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/mr/dispatch/route");
      const req = createJsonRequest("/api/mr/dispatch", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/mr/dispatch/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/mr/dispatch/[id]/route");
      const mockRecord = { id: "d1", shipmentId: "shp-1" };
      mockModel("dispatch").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/mr/dispatch/d1");
      const res = await GET(req, { params: Promise.resolve({ id: "d1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("d1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/mr/dispatch/[id]/route");
      mockModel("dispatch").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/mr/dispatch/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/mr/dispatch/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/mr/dispatch/[id]/route");
      const updated = { id: "d1", vehicleNumber: "ABC-123" };
      mockModel("dispatch").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/mr/dispatch/d1", "PUT", { vehicleNumber: "ABC-123" });
      const res = await PUT(req, { params: Promise.resolve({ id: "d1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.vehicleNumber).toBe("ABC-123");
    });
  });

  describe("DELETE /api/mr/dispatch/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/mr/dispatch/[id]/route");
      mockModel("dispatch").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/mr/dispatch/d1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "d1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// MR — Processing
// ---------------------------------------------------------------------------
describe("MR Processing API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/mr/processing", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/mr/processing/route");
      const mockData = [{ id: "pr1", orderNumber: "PRC-2026-0001" }];
      mockModel("processingOrder").findMany.mockResolvedValue(mockData);
      mockModel("processingOrder").count.mockResolvedValue(1);

      const req = createGetRequest("/api/mr/processing");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/mr/processing", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/mr/processing/route");
      const input = {
        productId: "prod-1",
        processType: "WASH",
        inputQuantity: 100,
      };
      const mockResult = { id: "pr1", orderNumber: "TEST-001", ...input };
      mockModel("processingOrder").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/mr/processing", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("pr1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/mr/processing/route");
      const req = createJsonRequest("/api/mr/processing", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/mr/processing/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/mr/processing/[id]/route");
      const mockRecord = { id: "pr1", orderNumber: "PRC-2026-0001" };
      mockModel("processingOrder").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/mr/processing/pr1");
      const res = await GET(req, { params: Promise.resolve({ id: "pr1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("pr1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/mr/processing/[id]/route");
      mockModel("processingOrder").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/mr/processing/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/mr/processing/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/mr/processing/[id]/route");
      const updated = { id: "pr1", inputQuantity: 200 };
      mockModel("processingOrder").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/mr/processing/pr1", "PUT", { inputQuantity: 200 });
      const res = await PUT(req, { params: Promise.resolve({ id: "pr1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.inputQuantity).toBe(200);
    });
  });

  describe("DELETE /api/mr/processing/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/mr/processing/[id]/route");
      mockModel("processingOrder").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/mr/processing/pr1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "pr1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CR — Materials
// ---------------------------------------------------------------------------
describe("CR Materials API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cr/materials", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/cr/materials/route");
      const mockData = [{ id: "cm1", materialNumber: "CRM-2026-0001" }];
      mockModel("crMaterial").findMany.mockResolvedValue(mockData);
      mockModel("crMaterial").count.mockResolvedValue(1);

      const req = createGetRequest("/api/cr/materials");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/cr/materials", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/cr/materials/route");
      const input = {
        supplierId: "sup-1",
        receivedDate: "2026-01-15",
        quantity: 500,
      };
      const mockResult = { id: "cm1", materialNumber: "TEST-001", ...input };
      mockModel("crMaterial").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/cr/materials", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("cm1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/cr/materials/route");
      const req = createJsonRequest("/api/cr/materials", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/cr/materials/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/cr/materials/[id]/route");
      const mockRecord = { id: "cm1", materialNumber: "CRM-2026-0001" };
      mockModel("crMaterial").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/cr/materials/cm1");
      const res = await GET(req, { params: Promise.resolve({ id: "cm1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("cm1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/cr/materials/[id]/route");
      mockModel("crMaterial").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/cr/materials/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/cr/materials/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/cr/materials/[id]/route");
      const updated = { id: "cm1", quantity: 600 };
      mockModel("crMaterial").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/cr/materials/cm1", "PUT", { quantity: 600 });
      const res = await PUT(req, { params: Promise.resolve({ id: "cm1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.quantity).toBe(600);
    });
  });

  describe("DELETE /api/cr/materials/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/cr/materials/[id]/route");
      mockModel("crMaterial").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/cr/materials/cm1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "cm1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CR — Oil Shipments
// ---------------------------------------------------------------------------
describe("CR Oil Shipments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cr/oil-shipments", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/cr/oil-shipments/route");
      const mockData = [{ id: "os1", shipmentNumber: "OIL-2026-0001" }];
      mockModel("oilShipment").findMany.mockResolvedValue(mockData);
      mockModel("oilShipment").count.mockResolvedValue(1);

      const req = createGetRequest("/api/cr/oil-shipments");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/cr/oil-shipments", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/cr/oil-shipments/route");
      const input = {
        customerId: "cust-1",
        shipmentDate: "2026-02-01",
        quantity: 1000,
      };
      const mockResult = { id: "os1", shipmentNumber: "TEST-001", ...input };
      mockModel("oilShipment").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/cr/oil-shipments", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("os1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/cr/oil-shipments/route");
      const req = createJsonRequest("/api/cr/oil-shipments", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/cr/oil-shipments/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/cr/oil-shipments/[id]/route");
      const mockRecord = { id: "os1", shipmentNumber: "OIL-2026-0001" };
      mockModel("oilShipment").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/cr/oil-shipments/os1");
      const res = await GET(req, { params: Promise.resolve({ id: "os1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("os1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/cr/oil-shipments/[id]/route");
      mockModel("oilShipment").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/cr/oil-shipments/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/cr/oil-shipments/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/cr/oil-shipments/[id]/route");
      const updated = { id: "os1", quantity: 1500 };
      mockModel("oilShipment").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/cr/oil-shipments/os1", "PUT", { quantity: 1500 });
      const res = await PUT(req, { params: Promise.resolve({ id: "os1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.quantity).toBe(1500);
    });
  });

  describe("DELETE /api/cr/oil-shipments/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/cr/oil-shipments/[id]/route");
      mockModel("oilShipment").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/cr/oil-shipments/os1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "os1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CR — Production Orders
// ---------------------------------------------------------------------------
describe("CR Production Orders API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cr/production-orders", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/cr/production-orders/route");
      const mockData = [{ id: "cpo1", orderNumber: "CRP-2026-0001" }];
      mockModel("crProductionOrder").findMany.mockResolvedValue(mockData);
      mockModel("crProductionOrder").count.mockResolvedValue(1);

      const req = createGetRequest("/api/cr/production-orders");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/cr/production-orders", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/cr/production-orders/route");
      const input = {
        plantId: "plant-1",
        productionDate: "2026-03-01",
        inputQuantity: 300,
      };
      const mockResult = { id: "cpo1", orderNumber: "TEST-001", ...input };
      mockModel("crProductionOrder").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/cr/production-orders", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("cpo1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/cr/production-orders/route");
      const req = createJsonRequest("/api/cr/production-orders", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/cr/production-orders/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/cr/production-orders/[id]/route");
      const mockRecord = { id: "cpo1", orderNumber: "CRP-2026-0001" };
      mockModel("crProductionOrder").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/cr/production-orders/cpo1");
      const res = await GET(req, { params: Promise.resolve({ id: "cpo1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("cpo1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/cr/production-orders/[id]/route");
      mockModel("crProductionOrder").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/cr/production-orders/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/cr/production-orders/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/cr/production-orders/[id]/route");
      const updated = { id: "cpo1", status: "IN_PROGRESS" };
      mockModel("crProductionOrder").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/cr/production-orders/cpo1", "PUT", { status: "IN_PROGRESS" });
      const res = await PUT(req, { params: Promise.resolve({ id: "cpo1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.status).toBe("IN_PROGRESS");
    });
  });

  describe("DELETE /api/cr/production-orders/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/cr/production-orders/[id]/route");
      mockModel("crProductionOrder").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/cr/production-orders/cpo1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "cpo1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CR — Residue
// ---------------------------------------------------------------------------
describe("CR Residue API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cr/residue", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/cr/residue/route");
      const mockData = [{ id: "r1", quantity: 50 }];
      mockModel("residue").findMany.mockResolvedValue(mockData);
      mockModel("residue").count.mockResolvedValue(1);

      const req = createGetRequest("/api/cr/residue");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/cr/residue", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/cr/residue/route");
      const input = { quantity: 25 };
      const mockResult = { id: "r1", ...input };
      mockModel("residue").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/cr/residue", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("r1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/cr/residue/route");
      const req = createJsonRequest("/api/cr/residue", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/cr/residue/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/cr/residue/[id]/route");
      const mockRecord = { id: "r1", quantity: 50 };
      mockModel("residue").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/cr/residue/r1");
      const res = await GET(req, { params: Promise.resolve({ id: "r1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("r1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/cr/residue/[id]/route");
      mockModel("residue").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/cr/residue/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/cr/residue/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/cr/residue/[id]/route");
      const updated = { id: "r1", quantity: 75 };
      mockModel("residue").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/cr/residue/r1", "PUT", { quantity: 75 });
      const res = await PUT(req, { params: Promise.resolve({ id: "r1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.quantity).toBe(75);
    });
  });

  describe("DELETE /api/cr/residue/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/cr/residue/[id]/route");
      mockModel("residue").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/cr/residue/r1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "r1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// CR — Tanks
// ---------------------------------------------------------------------------
describe("CR Tanks API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/cr/tanks", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/cr/tanks/route");
      const mockData = [{ id: "t1", code: "TNK-001", name: "Tank A" }];
      mockModel("tank").findMany.mockResolvedValue(mockData);
      mockModel("tank").count.mockResolvedValue(1);

      const req = createGetRequest("/api/cr/tanks");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/cr/tanks", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/cr/tanks/route");
      const input = {
        code: "TNK-001",
        name: "Tank A",
        type: "OIL",
        plantId: "plant-1",
        capacity: 10000,
      };
      const mockResult = { id: "t1", ...input };
      mockModel("tank").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/cr/tanks", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("t1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/cr/tanks/route");
      const req = createJsonRequest("/api/cr/tanks", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/cr/tanks/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/cr/tanks/[id]/route");
      const mockRecord = { id: "t1", code: "TNK-001" };
      mockModel("tank").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/cr/tanks/t1");
      const res = await GET(req, { params: Promise.resolve({ id: "t1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("t1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/cr/tanks/[id]/route");
      mockModel("tank").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/cr/tanks/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/cr/tanks/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/cr/tanks/[id]/route");
      const updated = { id: "t1", capacity: 15000 };
      mockModel("tank").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/cr/tanks/t1", "PUT", { capacity: 15000 });
      const res = await PUT(req, { params: Promise.resolve({ id: "t1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.capacity).toBe(15000);
    });
  });

  describe("DELETE /api/cr/tanks/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/cr/tanks/[id]/route");
      mockModel("tank").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/cr/tanks/t1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "t1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Lab — Samples
// ---------------------------------------------------------------------------
describe("Lab Samples API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lab/samples", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/lab/samples/route");
      const mockData = [{ id: "ls1", sampleNumber: "SMP-2026-0001" }];
      mockModel("labSample").findMany.mockResolvedValue(mockData);
      mockModel("labSample").count.mockResolvedValue(1);

      const req = createGetRequest("/api/lab/samples");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/lab/samples", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/lab/samples/route");
      const input = { sampleName: "Test Sample A" };
      const mockResult = { id: "ls1", sampleNumber: "TEST-001", ...input };
      mockModel("labSample").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/lab/samples", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("ls1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/lab/samples/route");
      const req = createJsonRequest("/api/lab/samples", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/lab/samples/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/lab/samples/[id]/route");
      const mockRecord = { id: "ls1", sampleName: "Test Sample A" };
      mockModel("labSample").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/lab/samples/ls1");
      const res = await GET(req, { params: Promise.resolve({ id: "ls1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("ls1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/lab/samples/[id]/route");
      mockModel("labSample").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/lab/samples/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/lab/samples/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/lab/samples/[id]/route");
      const updated = { id: "ls1", sampleName: "Updated Sample" };
      mockModel("labSample").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/lab/samples/ls1", "PUT", { sampleName: "Updated Sample" });
      const res = await PUT(req, { params: Promise.resolve({ id: "ls1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.sampleName).toBe("Updated Sample");
    });
  });

  describe("DELETE /api/lab/samples/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/lab/samples/[id]/route");
      mockModel("labSample").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/lab/samples/ls1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "ls1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Lab — Analysis
// ---------------------------------------------------------------------------
describe("Lab Analysis API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lab/analysis", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/lab/analysis/route");
      const mockData = [{ id: "ar1", testItem: "pH" }];
      mockModel("analysisResult").findMany.mockResolvedValue(mockData);
      mockModel("analysisResult").count.mockResolvedValue(1);

      const req = createGetRequest("/api/lab/analysis");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/lab/analysis", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/lab/analysis/route");
      const input = {
        sampleId: "smp-1",
        testItem: "pH",
      };
      const mockResult = { id: "ar1", ...input };
      mockModel("analysisResult").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/lab/analysis", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("ar1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/lab/analysis/route");
      const req = createJsonRequest("/api/lab/analysis", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/lab/analysis/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/lab/analysis/[id]/route");
      const mockRecord = { id: "ar1", testItem: "pH" };
      mockModel("analysisResult").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/lab/analysis/ar1");
      const res = await GET(req, { params: Promise.resolve({ id: "ar1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("ar1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/lab/analysis/[id]/route");
      mockModel("analysisResult").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/lab/analysis/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/lab/analysis/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/lab/analysis/[id]/route");
      const updated = { id: "ar1", result: "7.2" };
      mockModel("analysisResult").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/lab/analysis/ar1", "PUT", { result: "7.2" });
      const res = await PUT(req, { params: Promise.resolve({ id: "ar1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.result).toBe("7.2");
    });
  });

  describe("DELETE /api/lab/analysis/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/lab/analysis/[id]/route");
      mockModel("analysisResult").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/lab/analysis/ar1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "ar1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Lab — Certificates
// ---------------------------------------------------------------------------
describe("Lab Certificates API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lab/certificates", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/lab/certificates/route");
      const mockData = [{ id: "ac1", certificateNumber: "ACT-2026-0001" }];
      mockModel("analysisCertificate").findMany.mockResolvedValue(mockData);
      mockModel("analysisCertificate").count.mockResolvedValue(1);

      const req = createGetRequest("/api/lab/certificates");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/lab/certificates", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/lab/certificates/route");
      const input = { sampleId: "smp-1" };
      const seqResult = { currentNumber: 1, prefix: "ACT", year: 2026 };
      mockModel("numberSequence").upsert.mockResolvedValue(seqResult);
      const mockResult = { id: "ac1", certificateNumber: "ACT-2026-0001", ...input };
      mockModel("analysisCertificate").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/lab/certificates", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("ac1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/lab/certificates/route");
      const req = createJsonRequest("/api/lab/certificates", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/lab/certificates/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/lab/certificates/[id]/route");
      const mockRecord = { id: "ac1", certificateNumber: "ACT-2026-0001" };
      mockModel("analysisCertificate").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/lab/certificates/ac1");
      const res = await GET(req, { params: Promise.resolve({ id: "ac1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("ac1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/lab/certificates/[id]/route");
      mockModel("analysisCertificate").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/lab/certificates/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/lab/certificates/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/lab/certificates/[id]/route");
      const updated = { id: "ac1", note: "Updated note" };
      mockModel("analysisCertificate").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/lab/certificates/ac1", "PUT", { note: "Updated note" });
      const res = await PUT(req, { params: Promise.resolve({ id: "ac1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.note).toBe("Updated note");
    });
  });

  describe("DELETE /api/lab/certificates/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/lab/certificates/[id]/route");
      mockModel("analysisCertificate").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/lab/certificates/ac1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "ac1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Lab — External Analysis
// ---------------------------------------------------------------------------
describe("Lab External Analysis API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lab/external", () => {
    it("returns 200 with list", async () => {
      const { GET } = await import("@/app/api/lab/external/route");
      const mockData = [{ id: "ea1", laboratoryName: "Lab Corp" }];
      mockModel("externalAnalysis").findMany.mockResolvedValue(mockData);
      mockModel("externalAnalysis").count.mockResolvedValue(1);

      const req = createGetRequest("/api/lab/external");
      const res = await GET(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/lab/external", () => {
    it("returns 201 with valid body", async () => {
      const { POST } = await import("@/app/api/lab/external/route");
      const input = {
        sampleId: "smp-1",
        labName: "Lab Corp",
      };
      const mockResult = { id: "ea1", ...input };
      mockModel("externalAnalysis").create.mockResolvedValue(mockResult);

      const req = createJsonRequest("/api/lab/external", "POST", input);
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(201);
      expect(body.id).toBe("ea1");
    });

    it("returns 400 with empty body", async () => {
      const { POST } = await import("@/app/api/lab/external/route");
      const req = createJsonRequest("/api/lab/external", "POST", {});
      const res = await POST(req);
      const { status, body } = await parseResponse(res);

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/lab/external/[id]", () => {
    it("returns 200 when found", async () => {
      const { GET } = await import("@/app/api/lab/external/[id]/route");
      const mockRecord = { id: "ea1", laboratoryName: "Lab Corp" };
      mockModel("externalAnalysis").findUnique.mockResolvedValue(mockRecord);

      const req = createGetRequest("/api/lab/external/ea1");
      const res = await GET(req, { params: Promise.resolve({ id: "ea1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.id).toBe("ea1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/lab/external/[id]/route");
      mockModel("externalAnalysis").findUnique.mockResolvedValue(null);

      const req = createGetRequest("/api/lab/external/nonexistent");
      const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
      const { status } = await parseResponse(res);

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/lab/external/[id]", () => {
    it("returns 200 with valid update", async () => {
      const { PUT } = await import("@/app/api/lab/external/[id]/route");
      const updated = { id: "ea1", cost: 50000 };
      mockModel("externalAnalysis").update.mockResolvedValue(updated);

      const req = createJsonRequest("/api/lab/external/ea1", "PUT", { cost: 50000 });
      const res = await PUT(req, { params: Promise.resolve({ id: "ea1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.cost).toBe(50000);
    });
  });

  describe("DELETE /api/lab/external/[id]", () => {
    it("returns 200 on delete", async () => {
      const { DELETE } = await import("@/app/api/lab/external/[id]/route");
      mockModel("externalAnalysis").delete.mockResolvedValue({});

      const req = createJsonRequest("/api/lab/external/ea1", "DELETE");
      const res = await DELETE(req, { params: Promise.resolve({ id: "ea1" }) });
      const { status, body } = await parseResponse(res);

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
