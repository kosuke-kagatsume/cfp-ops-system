import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import {
  createGetRequest,
  createJsonRequest,
  parseResponse,
} from "@/__tests__/helpers/request";

// ---------------------------------------------------------------------------
// Helper: build params object for [id] routes
// ---------------------------------------------------------------------------
function idParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------
describe("Masters API - Partners", () => {
  const mockPartner = {
    id: "p1",
    code: "P001",
    name: "Test Partner",
    nameKana: "テスト",
    shortName: "TP",
    isCustomer: true,
    isSupplier: false,
    isPickup: false,
    isDelivery: false,
    isCarrier: false,
    isActive: true,
    contacts: [],
  };

  describe("GET /api/masters/partners", () => {
    it("returns partner list (200)", async () => {
      const { GET } = await import("@/app/api/masters/partners/route");
      vi.mocked(prisma.businessPartner.findMany).mockResolvedValue([mockPartner] as any);
      vi.mocked(prisma.businessPartner.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/partners");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].code).toBe("P001");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/partners/route");
      vi.mocked(prisma.businessPartner.findMany).mockResolvedValue([mockPartner] as any);
      vi.mocked(prisma.businessPartner.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/partners", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/partners", () => {
    it("creates partner with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/partners/route");
      vi.mocked(prisma.businessPartner.create).mockResolvedValue(mockPartner as any);

      const req = createJsonRequest("/api/masters/partners", "POST", {
        code: "P001",
        name: "Test Partner",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.code).toBe("P001");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/partners/route");

      const req = createJsonRequest("/api/masters/partners", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/partners/[id]", () => {
    it("returns partner by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/partners/[id]/route");
      vi.mocked(prisma.businessPartner.findUnique).mockResolvedValue({
        ...mockPartner,
        documentSettings: [],
      } as any);

      const req = createGetRequest("/api/masters/partners/p1");
      const { status, body } = await parseResponse(await GET(req, idParams("p1")));

      expect(status).toBe(200);
      expect(body.id).toBe("p1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/partners/[id]/route");
      vi.mocked(prisma.businessPartner.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/partners/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/partners/[id]", () => {
    it("updates partner (200)", async () => {
      const { PUT } = await import("@/app/api/masters/partners/[id]/route");
      const updated = { ...mockPartner, name: "Updated" };
      vi.mocked(prisma.businessPartner.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/partners/p1", "PUT", { name: "Updated" });
      const { status, body } = await parseResponse(await PUT(req, idParams("p1")));

      expect(status).toBe(200);
      expect(body.name).toBe("Updated");
    });

    it("returns 400 for invalid data", async () => {
      const { PUT } = await import("@/app/api/masters/partners/[id]/route");

      // partnerUpdate allows all fields optional except code is omitted, but if we send
      // un-parseable JSON we get 400
      const req = new Request(new URL("/api/masters/partners/p1", "http://localhost:3000"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const { status, body } = await parseResponse(await PUT(req, idParams("p1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/partners/[id]", () => {
    it("deletes partner (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/partners/[id]/route");
      vi.mocked(prisma.businessPartner.delete).mockResolvedValue(mockPartner as any);

      const req = createJsonRequest("/api/masters/partners/p1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("p1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Plants
// ---------------------------------------------------------------------------
describe("Masters API - Plants", () => {
  const mockPlant = {
    id: "pl1",
    code: "PL001",
    name: "Test Plant",
    companyId: "CFP",
    address: "Address",
    tel: "000-0000",
    warehouses: [],
    tanks: [],
  };

  describe("GET /api/masters/plants", () => {
    it("returns plant list (200)", async () => {
      const { GET } = await import("@/app/api/masters/plants/route");
      vi.mocked(prisma.plant.findMany).mockResolvedValue([mockPlant] as any);
      vi.mocked(prisma.plant.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/plants");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].code).toBe("PL001");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/plants/route");
      vi.mocked(prisma.plant.findMany).mockResolvedValue([mockPlant] as any);
      vi.mocked(prisma.plant.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/plants", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/plants", () => {
    it("creates plant with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/plants/route");
      vi.mocked(prisma.plant.create).mockResolvedValue(mockPlant as any);

      const req = createJsonRequest("/api/masters/plants", "POST", {
        code: "PL001",
        name: "Test Plant",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.code).toBe("PL001");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/plants/route");

      const req = createJsonRequest("/api/masters/plants", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/plants/[id]", () => {
    it("returns plant by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/plants/[id]/route");
      vi.mocked(prisma.plant.findUnique).mockResolvedValue(mockPlant as any);

      const req = createGetRequest("/api/masters/plants/pl1");
      const { status, body } = await parseResponse(await GET(req, idParams("pl1")));

      expect(status).toBe(200);
      expect(body.id).toBe("pl1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/plants/[id]/route");
      vi.mocked(prisma.plant.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/plants/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/plants/[id]", () => {
    it("updates plant (200)", async () => {
      const { PUT } = await import("@/app/api/masters/plants/[id]/route");
      const updated = { ...mockPlant, name: "Updated" };
      vi.mocked(prisma.plant.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/plants/pl1", "PUT", { name: "Updated" });
      const { status, body } = await parseResponse(await PUT(req, idParams("pl1")));

      expect(status).toBe(200);
      expect(body.name).toBe("Updated");
    });

    it("returns 400 for invalid data", async () => {
      const { PUT } = await import("@/app/api/masters/plants/[id]/route");

      const req = new Request(new URL("/api/masters/plants/pl1", "http://localhost:3000"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const { status, body } = await parseResponse(await PUT(req, idParams("pl1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/plants/[id]", () => {
    it("deletes plant (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/plants/[id]/route");
      vi.mocked(prisma.plant.delete).mockResolvedValue(mockPlant as any);

      const req = createJsonRequest("/api/masters/plants/pl1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("pl1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------
describe("Masters API - Prices", () => {
  const mockPrice = {
    id: "pr1",
    partnerId: "p1",
    productId: "prod1",
    unitPrice: 100,
    currency: "JPY",
    validFrom: new Date("2025-01-01"),
    validTo: null,
    note: null,
    partner: { id: "p1", code: "P001", name: "Partner" },
    product: { id: "prod1", code: "PROD-001", name: null, shape: null, color: null, grade: null },
  };

  describe("GET /api/masters/prices", () => {
    it("returns price list (200)", async () => {
      const { GET } = await import("@/app/api/masters/prices/route");
      vi.mocked(prisma.customerPrice.findMany).mockResolvedValue([mockPrice] as any);
      vi.mocked(prisma.customerPrice.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/prices");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].unitPrice).toBe(100);
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/prices/route");
      vi.mocked(prisma.customerPrice.findMany).mockResolvedValue([mockPrice] as any);
      vi.mocked(prisma.customerPrice.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/prices", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/prices", () => {
    it("creates price with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/prices/route");
      vi.mocked(prisma.customerPrice.create).mockResolvedValue(mockPrice as any);

      const req = createJsonRequest("/api/masters/prices", "POST", {
        partnerId: "p1",
        productId: "prod1",
        unitPrice: 100,
        validFrom: "2025-01-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.unitPrice).toBe(100);
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/prices/route");

      const req = createJsonRequest("/api/masters/prices", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/prices/[id]", () => {
    it("returns price by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/prices/[id]/route");
      vi.mocked(prisma.customerPrice.findUnique).mockResolvedValue(mockPrice as any);

      const req = createGetRequest("/api/masters/prices/pr1");
      const { status, body } = await parseResponse(await GET(req, idParams("pr1")));

      expect(status).toBe(200);
      expect(body.id).toBe("pr1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/prices/[id]/route");
      vi.mocked(prisma.customerPrice.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/prices/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/prices/[id]", () => {
    it("updates price (200)", async () => {
      const { PUT } = await import("@/app/api/masters/prices/[id]/route");
      const updated = { ...mockPrice, unitPrice: 200 };
      vi.mocked(prisma.customerPrice.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/prices/pr1", "PUT", {
        unitPrice: 200,
        validFrom: "2025-06-01",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams("pr1")));

      expect(status).toBe(200);
      expect(body.unitPrice).toBe(200);
    });

    it("returns 400 for invalid data", async () => {
      const { PUT } = await import("@/app/api/masters/prices/[id]/route");

      const req = new Request(new URL("/api/masters/prices/pr1", "http://localhost:3000"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const { status, body } = await parseResponse(await PUT(req, idParams("pr1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/prices/[id]", () => {
    it("deletes price (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/prices/[id]/route");
      vi.mocked(prisma.customerPrice.delete).mockResolvedValue(mockPrice as any);

      const req = createJsonRequest("/api/masters/prices/pr1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("pr1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Warehouses
// ---------------------------------------------------------------------------
describe("Masters API - Warehouses", () => {
  const mockWarehouse = {
    id: "w1",
    code: "W001",
    name: "Test Warehouse",
    type: "INTERNAL",
    plantId: "pl1",
    address: "Address",
    capacity: 1000,
    plant: { id: "pl1", code: "PL001", name: "Plant" },
  };

  describe("GET /api/masters/warehouses", () => {
    it("returns warehouse list (200)", async () => {
      const { GET } = await import("@/app/api/masters/warehouses/route");
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([mockWarehouse] as any);
      vi.mocked(prisma.warehouse.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/warehouses");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].code).toBe("W001");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/warehouses/route");
      vi.mocked(prisma.warehouse.findMany).mockResolvedValue([mockWarehouse] as any);
      vi.mocked(prisma.warehouse.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/warehouses", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/warehouses", () => {
    it("creates warehouse with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/warehouses/route");
      vi.mocked(prisma.warehouse.create).mockResolvedValue(mockWarehouse as any);

      const req = createJsonRequest("/api/masters/warehouses", "POST", {
        code: "W001",
        name: "Test Warehouse",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.code).toBe("W001");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/warehouses/route");

      const req = createJsonRequest("/api/masters/warehouses", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/warehouses/[id]", () => {
    it("returns warehouse by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/warehouses/[id]/route");
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(mockWarehouse as any);

      const req = createGetRequest("/api/masters/warehouses/w1");
      const { status, body } = await parseResponse(await GET(req, idParams("w1")));

      expect(status).toBe(200);
      expect(body.id).toBe("w1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/warehouses/[id]/route");
      vi.mocked(prisma.warehouse.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/warehouses/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/warehouses/[id]", () => {
    it("updates warehouse (200)", async () => {
      const { PUT } = await import("@/app/api/masters/warehouses/[id]/route");
      const updated = { ...mockWarehouse, name: "Updated" };
      vi.mocked(prisma.warehouse.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/warehouses/w1", "PUT", { name: "Updated" });
      const { status, body } = await parseResponse(await PUT(req, idParams("w1")));

      expect(status).toBe(200);
      expect(body.name).toBe("Updated");
    });

    it("returns 400 for invalid data", async () => {
      const { PUT } = await import("@/app/api/masters/warehouses/[id]/route");

      const req = new Request(new URL("/api/masters/warehouses/w1", "http://localhost:3000"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const { status, body } = await parseResponse(await PUT(req, idParams("w1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/warehouses/[id]", () => {
    it("deletes warehouse (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/warehouses/[id]/route");
      vi.mocked(prisma.warehouse.delete).mockResolvedValue(mockWarehouse as any);

      const req = createJsonRequest("/api/masters/warehouses/w1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("w1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
describe("Masters API - Products", () => {
  const mockProduct = {
    id: "prod1",
    code: "100-01-01-01",
    nameId: "n1",
    shapeId: "s1",
    colorId: "c1",
    gradeId: "g1",
    isIsccEligible: false,
    isOilProduct: false,
    name: { id: "n1", code: 100, name: "Name" },
    shape: { id: "s1", code: 1, name: "Shape" },
    color: { id: "c1", code: 1, name: "Color" },
    grade: { id: "g1", code: 1, name: "Grade" },
  };

  describe("GET /api/masters/products", () => {
    it("returns product list (200)", async () => {
      const { GET } = await import("@/app/api/masters/products/route");
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/products");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].code).toBe("100-01-01-01");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/products/route");
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/products", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/products", () => {
    it("creates product with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/products/route");
      vi.mocked(prisma.productName.findUnique).mockResolvedValue({ id: "n1", code: 100, name: "Name" } as any);
      vi.mocked(prisma.productShape.findUnique).mockResolvedValue({ id: "s1", code: 1, name: "Shape" } as any);
      vi.mocked(prisma.productColor.findUnique).mockResolvedValue({ id: "c1", code: 1, name: "Color" } as any);
      vi.mocked(prisma.productGrade.findUnique).mockResolvedValue({ id: "g1", code: 1, name: "Grade" } as any);
      vi.mocked(prisma.product.create).mockResolvedValue(mockProduct as any);

      const req = createJsonRequest("/api/masters/products", "POST", {
        nameId: "n1",
        shapeId: "s1",
        colorId: "c1",
        gradeId: "g1",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.code).toBe("100-01-01-01");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/products/route");

      const req = createJsonRequest("/api/masters/products", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });

    it("returns 400 when axis ID not found", async () => {
      const { POST } = await import("@/app/api/masters/products/route");
      vi.mocked(prisma.productName.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productShape.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productColor.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.productGrade.findUnique).mockResolvedValue(null);

      const req = createJsonRequest("/api/masters/products", "POST", {
        nameId: "bad",
        shapeId: "bad",
        colorId: "bad",
        gradeId: "bad",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error", "Invalid axis ID");
    });
  });

  describe("GET /api/masters/products/[id]", () => {
    it("returns product by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/products/[id]/route");
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      const req = createGetRequest("/api/masters/products/prod1");
      const { status, body } = await parseResponse(await GET(req, idParams("prod1")));

      expect(status).toBe(200);
      expect(body.id).toBe("prod1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/products/[id]/route");
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/products/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/products/[id]", () => {
    it("updates product (200)", async () => {
      const { PUT } = await import("@/app/api/masters/products/[id]/route");
      const updated = { ...mockProduct, isIsccEligible: true };
      vi.mocked(prisma.product.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/products/prod1", "PUT", {
        isIsccEligible: true,
      });
      const { status, body } = await parseResponse(await PUT(req, idParams("prod1")));

      expect(status).toBe(200);
      expect(body.isIsccEligible).toBe(true);
    });

    it("returns 400 for invalid data", async () => {
      const { PUT } = await import("@/app/api/masters/products/[id]/route");

      const req = new Request(new URL("/api/masters/products/prod1", "http://localhost:3000"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const { status, body } = await parseResponse(await PUT(req, idParams("prod1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/products/[id]", () => {
    it("deletes product (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/products/[id]/route");
      vi.mocked(prisma.product.delete).mockResolvedValue(mockProduct as any);

      const req = createJsonRequest("/api/masters/products/prod1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("prod1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Product Names
// ---------------------------------------------------------------------------
describe("Masters API - Product Names", () => {
  const mockProductName = {
    id: "pn1",
    code: 100,
    name: "Test Product Name",
    isccManageName: null,
    mixedProductCode: null,
    mixedRatio: null,
  };

  describe("GET /api/masters/product-names", () => {
    it("returns product name list (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-names/route");
      vi.mocked(prisma.productName.findMany).mockResolvedValue([mockProductName] as any);
      vi.mocked(prisma.productName.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-names");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].name).toBe("Test Product Name");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/product-names/route");
      vi.mocked(prisma.productName.findMany).mockResolvedValue([mockProductName] as any);
      vi.mocked(prisma.productName.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-names", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/product-names", () => {
    it("creates product name with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/product-names/route");
      vi.mocked(prisma.productName.create).mockResolvedValue(mockProductName as any);

      const req = createJsonRequest("/api/masters/product-names", "POST", {
        code: 100,
        name: "Test Product Name",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.name).toBe("Test Product Name");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/product-names/route");

      const req = createJsonRequest("/api/masters/product-names", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/product-names/[id]", () => {
    it("returns product name by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-names/[id]/route");
      vi.mocked(prisma.productName.findUnique).mockResolvedValue(mockProductName as any);

      const req = createGetRequest("/api/masters/product-names/pn1");
      const { status, body } = await parseResponse(await GET(req, idParams("pn1")));

      expect(status).toBe(200);
      expect(body.id).toBe("pn1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/product-names/[id]/route");
      vi.mocked(prisma.productName.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/product-names/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/product-names/[id]", () => {
    it("updates product name (200)", async () => {
      const { PUT } = await import("@/app/api/masters/product-names/[id]/route");
      const updated = { ...mockProductName, name: "Updated" };
      vi.mocked(prisma.productName.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/product-names/pn1", "PUT", { name: "Updated" });
      const { status, body } = await parseResponse(await PUT(req, idParams("pn1")));

      expect(status).toBe(200);
      expect(body.name).toBe("Updated");
    });

    it("returns 400 for invalid data", async () => {
      const { PUT } = await import("@/app/api/masters/product-names/[id]/route");

      const req = new Request(new URL("/api/masters/product-names/pn1", "http://localhost:3000"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }) as any;
      const { status, body } = await parseResponse(await PUT(req, idParams("pn1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/product-names/[id]", () => {
    it("deletes product name (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/product-names/[id]/route");
      vi.mocked(prisma.productName.delete).mockResolvedValue(mockProductName as any);

      const req = createJsonRequest("/api/masters/product-names/pn1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("pn1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Product Shapes
// ---------------------------------------------------------------------------
describe("Masters API - Product Shapes", () => {
  const mockShape = { id: "sh1", code: 1, name: "Pellet" };

  describe("GET /api/masters/product-shapes", () => {
    it("returns shape list (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-shapes/route");
      vi.mocked(prisma.productShape.findMany).mockResolvedValue([mockShape] as any);
      vi.mocked(prisma.productShape.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-shapes");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].name).toBe("Pellet");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/product-shapes/route");
      vi.mocked(prisma.productShape.findMany).mockResolvedValue([mockShape] as any);
      vi.mocked(prisma.productShape.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-shapes", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/product-shapes", () => {
    it("creates shape with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/product-shapes/route");
      vi.mocked(prisma.productShape.create).mockResolvedValue(mockShape as any);

      const req = createJsonRequest("/api/masters/product-shapes", "POST", {
        code: 1,
        name: "Pellet",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.name).toBe("Pellet");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/product-shapes/route");

      const req = createJsonRequest("/api/masters/product-shapes", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/product-shapes/[id]", () => {
    it("returns shape by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-shapes/[id]/route");
      vi.mocked(prisma.productShape.findUnique).mockResolvedValue(mockShape as any);

      const req = createGetRequest("/api/masters/product-shapes/sh1");
      const { status, body } = await parseResponse(await GET(req, idParams("sh1")));

      expect(status).toBe(200);
      expect(body.id).toBe("sh1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/product-shapes/[id]/route");
      vi.mocked(prisma.productShape.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/product-shapes/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/product-shapes/[id]", () => {
    it("updates shape (200)", async () => {
      const { PUT } = await import("@/app/api/masters/product-shapes/[id]/route");
      const updated = { ...mockShape, name: "Updated" };
      vi.mocked(prisma.productShape.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/product-shapes/sh1", "PUT", { name: "Updated" });
      const { status, body } = await parseResponse(await PUT(req, idParams("sh1")));

      expect(status).toBe(200);
      expect(body.name).toBe("Updated");
    });

    it("returns 400 for invalid data (empty name)", async () => {
      const { PUT } = await import("@/app/api/masters/product-shapes/[id]/route");

      const req = createJsonRequest("/api/masters/product-shapes/sh1", "PUT", { name: "" });
      const { status, body } = await parseResponse(await PUT(req, idParams("sh1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/product-shapes/[id]", () => {
    it("deletes shape (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/product-shapes/[id]/route");
      vi.mocked(prisma.productShape.delete).mockResolvedValue(mockShape as any);

      const req = createJsonRequest("/api/masters/product-shapes/sh1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("sh1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Product Colors
// ---------------------------------------------------------------------------
describe("Masters API - Product Colors", () => {
  const mockColor = { id: "cl1", code: 1, name: "White" };

  describe("GET /api/masters/product-colors", () => {
    it("returns color list (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-colors/route");
      vi.mocked(prisma.productColor.findMany).mockResolvedValue([mockColor] as any);
      vi.mocked(prisma.productColor.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-colors");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].name).toBe("White");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/product-colors/route");
      vi.mocked(prisma.productColor.findMany).mockResolvedValue([mockColor] as any);
      vi.mocked(prisma.productColor.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-colors", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/product-colors", () => {
    it("creates color with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/product-colors/route");
      vi.mocked(prisma.productColor.create).mockResolvedValue(mockColor as any);

      const req = createJsonRequest("/api/masters/product-colors", "POST", {
        code: 1,
        name: "White",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.name).toBe("White");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/product-colors/route");

      const req = createJsonRequest("/api/masters/product-colors", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/product-colors/[id]", () => {
    it("returns color by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-colors/[id]/route");
      vi.mocked(prisma.productColor.findUnique).mockResolvedValue(mockColor as any);

      const req = createGetRequest("/api/masters/product-colors/cl1");
      const { status, body } = await parseResponse(await GET(req, idParams("cl1")));

      expect(status).toBe(200);
      expect(body.id).toBe("cl1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/product-colors/[id]/route");
      vi.mocked(prisma.productColor.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/product-colors/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/product-colors/[id]", () => {
    it("updates color (200)", async () => {
      const { PUT } = await import("@/app/api/masters/product-colors/[id]/route");
      const updated = { ...mockColor, name: "Black" };
      vi.mocked(prisma.productColor.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/product-colors/cl1", "PUT", { name: "Black" });
      const { status, body } = await parseResponse(await PUT(req, idParams("cl1")));

      expect(status).toBe(200);
      expect(body.name).toBe("Black");
    });

    it("returns 400 for invalid data (empty name)", async () => {
      const { PUT } = await import("@/app/api/masters/product-colors/[id]/route");

      const req = createJsonRequest("/api/masters/product-colors/cl1", "PUT", { name: "" });
      const { status, body } = await parseResponse(await PUT(req, idParams("cl1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/product-colors/[id]", () => {
    it("deletes color (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/product-colors/[id]/route");
      vi.mocked(prisma.productColor.delete).mockResolvedValue(mockColor as any);

      const req = createJsonRequest("/api/masters/product-colors/cl1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("cl1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});

// ---------------------------------------------------------------------------
// Product Grades
// ---------------------------------------------------------------------------
describe("Masters API - Product Grades", () => {
  const mockGrade = { id: "gr1", code: 1, name: "A Grade" };

  describe("GET /api/masters/product-grades", () => {
    it("returns grade list (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-grades/route");
      vi.mocked(prisma.productGrade.findMany).mockResolvedValue([mockGrade] as any);
      vi.mocked(prisma.productGrade.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-grades");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0].name).toBe("A Grade");
    });

    it("returns paginated format when page param present", async () => {
      const { GET } = await import("@/app/api/masters/product-grades/route");
      vi.mocked(prisma.productGrade.findMany).mockResolvedValue([mockGrade] as any);
      vi.mocked(prisma.productGrade.count).mockResolvedValue(1);

      const req = createGetRequest("/api/masters/product-grades", { page: "1", limit: "10" });
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toHaveProperty("items");
      expect(body).toHaveProperty("total", 1);
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 10);
    });
  });

  describe("POST /api/masters/product-grades", () => {
    it("creates grade with valid data (201)", async () => {
      const { POST } = await import("@/app/api/masters/product-grades/route");
      vi.mocked(prisma.productGrade.create).mockResolvedValue(mockGrade as any);

      const req = createJsonRequest("/api/masters/product-grades", "POST", {
        code: 1,
        name: "A Grade",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body.name).toBe("A Grade");
    });

    it("returns 400 for invalid data (empty body)", async () => {
      const { POST } = await import("@/app/api/masters/product-grades/route");

      const req = createJsonRequest("/api/masters/product-grades", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("GET /api/masters/product-grades/[id]", () => {
    it("returns grade by id (200)", async () => {
      const { GET } = await import("@/app/api/masters/product-grades/[id]/route");
      vi.mocked(prisma.productGrade.findUnique).mockResolvedValue(mockGrade as any);

      const req = createGetRequest("/api/masters/product-grades/gr1");
      const { status, body } = await parseResponse(await GET(req, idParams("gr1")));

      expect(status).toBe(200);
      expect(body.id).toBe("gr1");
    });

    it("returns 404 when not found", async () => {
      const { GET } = await import("@/app/api/masters/product-grades/[id]/route");
      vi.mocked(prisma.productGrade.findUnique).mockResolvedValue(null);

      const req = createGetRequest("/api/masters/product-grades/missing");
      const { status, body } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
      expect(body).toHaveProperty("error", "Not found");
    });
  });

  describe("PUT /api/masters/product-grades/[id]", () => {
    it("updates grade (200)", async () => {
      const { PUT } = await import("@/app/api/masters/product-grades/[id]/route");
      const updated = { ...mockGrade, name: "B Grade" };
      vi.mocked(prisma.productGrade.update).mockResolvedValue(updated as any);

      const req = createJsonRequest("/api/masters/product-grades/gr1", "PUT", { name: "B Grade" });
      const { status, body } = await parseResponse(await PUT(req, idParams("gr1")));

      expect(status).toBe(200);
      expect(body.name).toBe("B Grade");
    });

    it("returns 400 for invalid data (empty name)", async () => {
      const { PUT } = await import("@/app/api/masters/product-grades/[id]/route");

      const req = createJsonRequest("/api/masters/product-grades/gr1", "PUT", { name: "" });
      const { status, body } = await parseResponse(await PUT(req, idParams("gr1")));

      expect(status).toBe(400);
      expect(body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/masters/product-grades/[id]", () => {
    it("deletes grade (200)", async () => {
      const { DELETE } = await import("@/app/api/masters/product-grades/[id]/route");
      vi.mocked(prisma.productGrade.delete).mockResolvedValue(mockGrade as any);

      const req = createJsonRequest("/api/masters/product-grades/gr1", "DELETE");
      const { status, body } = await parseResponse(await DELETE(req, idParams("gr1")));

      expect(status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
