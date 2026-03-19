import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/db";
import {
  createGetRequest,
  createJsonRequest,
  parseResponse,
} from "../helpers/request";

// ---------------------------------------------------------------------------
// Mock additional side-effect modules that some routes import
// ---------------------------------------------------------------------------
vi.mock("@/lib/journal", () => ({
  generateExpenseJournal: vi.fn(),
}));

vi.mock("@/lib/approval", () => ({
  createApprovalFlow: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const idParams = (id = "test-id") => ({
  params: Promise.resolve({ id }),
});

// Reset every mock between tests so counts / return values are isolated
beforeEach(() => {
  vi.clearAllMocks();
});

// ===================================================================
// Approvals  /api/approvals
// ===================================================================
describe("Approvals API", () => {
  describe("GET /api/approvals", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", title: "Test Approval" }];
      (prisma.approvalRequest.findMany as any).mockResolvedValue(mockData);
      (prisma.approvalRequest.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/approvals/route");
      const req = createGetRequest("/api/approvals");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/approvals", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "new-1", title: "New", requestNumber: "TEST-001" };
      (prisma.approvalRequest.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/approvals/route");
      const req = createJsonRequest("/api/approvals", "POST", {
        category: "GENERAL",
        title: "New",
        createdBy: "user-1",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/approvals/route");
      const req = createJsonRequest("/api/approvals", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/approvals/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", title: "Found" };
      (prisma.approvalRequest.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/approvals/[id]/route");
      const req = createGetRequest("/api/approvals/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.approvalRequest.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/approvals/[id]/route");
      const req = createGetRequest("/api/approvals/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/approvals/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", title: "Updated" };
      (prisma.approvalRequest.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/approvals/[id]/route");
      const req = createJsonRequest("/api/approvals/test-id", "PUT", {
        title: "Updated",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/approvals/[id]", () => {
    it("returns 200", async () => {
      (prisma.approvalStep.deleteMany as any).mockResolvedValue({ count: 0 });
      (prisma.approvalRequest.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/approvals/[id]/route");
      const req = createGetRequest("/api/approvals/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Contracts  /api/contracts
// ===================================================================
describe("Contracts API", () => {
  describe("GET /api/contracts", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", title: "Contract A" }];
      (prisma.contract.findMany as any).mockResolvedValue(mockData);
      (prisma.contract.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/contracts/route");
      const req = createGetRequest("/api/contracts");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/contracts", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "c-1", title: "New Contract" };
      (prisma.contract.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/contracts/route");
      const req = createJsonRequest("/api/contracts", "POST", {
        partnerId: "p-1",
        contractType: "PURCHASE",
        title: "New Contract",
        startDate: "2026-01-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/contracts/route");
      const req = createJsonRequest("/api/contracts", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/contracts/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", title: "Found" };
      (prisma.contract.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/contracts/[id]/route");
      const req = createGetRequest("/api/contracts/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.contract.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/contracts/[id]/route");
      const req = createGetRequest("/api/contracts/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/contracts/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", title: "Updated" };
      (prisma.contract.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/contracts/[id]/route");
      const req = createJsonRequest("/api/contracts/test-id", "PUT", {
        title: "Updated",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/contracts/[id]", () => {
    it("returns 200", async () => {
      (prisma.contract.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/contracts/[id]/route");
      const req = createGetRequest("/api/contracts/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Expenses  /api/expenses
// ===================================================================
describe("Expenses API", () => {
  describe("GET /api/expenses", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", applicant: "Taro" }];
      (prisma.expense.findMany as any).mockResolvedValue(mockData);
      (prisma.expense.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/expenses/route");
      const req = createGetRequest("/api/expenses");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/expenses", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "e-1", expenseNumber: "TEST-001", items: [], totalAmount: 0, expenseDate: new Date().toISOString() };
      (prisma.expense.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/expenses/route");
      const req = createJsonRequest("/api/expenses", "POST", {
        title: "Travel",
        applicantId: "user-1",
        expenseDate: "2026-01-15",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/expenses/route");
      const req = createJsonRequest("/api/expenses", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/expenses/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", applicant: "Test" };
      (prisma.expense.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/expenses/[id]/route");
      const req = createGetRequest("/api/expenses/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.expense.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/expenses/[id]/route");
      const req = createGetRequest("/api/expenses/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/expenses/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", applicant: "Updated" };
      (prisma.expense.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/expenses/[id]/route");
      const req = createJsonRequest("/api/expenses/test-id", "PUT", {
        applicant: "Updated",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/expenses/[id]", () => {
    it("returns 200", async () => {
      (prisma.expenseItem.deleteMany as any).mockResolvedValue({ count: 0 });
      (prisma.expense.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/expenses/[id]/route");
      const req = createGetRequest("/api/expenses/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Assets  /api/assets  (all CRUD in one file)
// ===================================================================
describe("Assets API", () => {
  describe("GET /api/assets", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", name: "Machine A" }];
      (prisma.asset.findMany as any).mockResolvedValue(mockData);

      const { GET } = await import("@/app/api/assets/route");
      const req = createGetRequest("/api/assets");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/assets", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "a-1", name: "New Asset", assetNumber: "FA-00001" };
      (prisma.asset.findFirst as any).mockResolvedValue(null);
      (prisma.asset.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/assets/route");
      const req = createJsonRequest("/api/assets", "POST", {
        name: "New Asset",
        category: "MACHINERY",
        acquisitionDate: "2026-01-01",
        acquisitionCost: 1000000,
        usefulLife: 10,
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/assets/route");
      const req = createJsonRequest("/api/assets", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("PUT /api/assets", () => {
    it("returns 200 with valid update (id in body)", async () => {
      const updated = { id: "test-id", name: "Updated" };
      (prisma.asset.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/assets/route");
      const req = createJsonRequest("/api/assets", "PUT", {
        id: "test-id",
        name: "Updated",
      });
      const { status, body } = await parseResponse(await PUT(req));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });

    it("returns 400 when id is missing", async () => {
      const { PUT } = await import("@/app/api/assets/route");
      const req = createJsonRequest("/api/assets", "PUT", {
        name: "No id",
      });
      const { status, body } = await parseResponse(await PUT(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("DELETE /api/assets", () => {
    it("returns 200 with id in query params", async () => {
      const disposed = { id: "test-id", isDisposed: true };
      (prisma.asset.update as any).mockResolvedValue(disposed);

      const { DELETE } = await import("@/app/api/assets/route");
      const req = createGetRequest("/api/assets", { id: "test-id" });
      // DELETE uses searchParams, but createGetRequest creates a GET request.
      // We need a DELETE request with query params - use NextRequest directly
      const { NextRequest } = await import("next/server");
      const url = new URL("/api/assets?id=test-id", "http://localhost:3000");
      const delReq = new NextRequest(url, { method: "DELETE" });
      const { status, body } = await parseResponse(await DELETE(delReq));

      expect(status).toBe(200);
      expect(body.isDisposed).toBe(true);
    });

    it("returns 400 when id is missing", async () => {
      const { DELETE } = await import("@/app/api/assets/route");
      const { NextRequest } = await import("next/server");
      const url = new URL("/api/assets", "http://localhost:3000");
      const delReq = new NextRequest(url, { method: "DELETE" });
      const { status, body } = await parseResponse(await DELETE(delReq));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });
});

// ===================================================================
// CTS  /api/cts
// ===================================================================
describe("CTS API", () => {
  describe("GET /api/cts", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", transactionType: "IMPORT" }];
      (prisma.ctsTransaction.findMany as any).mockResolvedValue(mockData);
      (prisma.ctsTransaction.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/cts/route");
      const req = createGetRequest("/api/cts");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/cts", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "ct-1", transactionType: "IMPORT" };
      (prisma.ctsTransaction.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/cts/route");
      const req = createJsonRequest("/api/cts", "POST", {
        transactionType: "IMPORT",
        fromEntity: "Company A",
        toEntity: "Company B",
        transactionDate: "2026-03-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/cts/route");
      const req = createJsonRequest("/api/cts", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/cts/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", transactionType: "EXPORT" };
      (prisma.ctsTransaction.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/cts/[id]/route");
      const req = createGetRequest("/api/cts/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.ctsTransaction.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/cts/[id]/route");
      const req = createGetRequest("/api/cts/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/cts/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", transactionType: "EXPORT" };
      (prisma.ctsTransaction.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/cts/[id]/route");
      const req = createJsonRequest("/api/cts/test-id", "PUT", {
        transactionType: "EXPORT",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/cts/[id]", () => {
    it("returns 200", async () => {
      (prisma.ctsTransaction.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/cts/[id]/route");
      const req = createGetRequest("/api/cts/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// ISCC Certificates  /api/iscc/certificates
// ===================================================================
describe("ISCC Certificates API", () => {
  describe("GET /api/iscc/certificates", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", certNumber: "ISCC-001" }];
      (prisma.isccCertificate.findMany as any).mockResolvedValue(mockData);
      (prisma.isccCertificate.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/iscc/certificates/route");
      const req = createGetRequest("/api/iscc/certificates");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/iscc/certificates", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "ic-1", certNumber: "ISCC-002" };
      (prisma.isccCertificate.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/iscc/certificates/route");
      const req = createJsonRequest("/api/iscc/certificates", "POST", {
        certificateNumber: "ISCC-002",
        issueDate: "2026-01-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/iscc/certificates/route");
      const req = createJsonRequest("/api/iscc/certificates", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/iscc/certificates/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", certNumber: "ISCC-001" };
      (prisma.isccCertificate.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/iscc/certificates/[id]/route");
      const req = createGetRequest("/api/iscc/certificates/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.isccCertificate.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/iscc/certificates/[id]/route");
      const req = createGetRequest("/api/iscc/certificates/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/iscc/certificates/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", certNumber: "ISCC-UPD" };
      (prisma.isccCertificate.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/iscc/certificates/[id]/route");
      const req = createJsonRequest("/api/iscc/certificates/test-id", "PUT", {
        certificateNumber: "ISCC-UPD",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/iscc/certificates/[id]", () => {
    it("returns 200", async () => {
      (prisma.isccCertificate.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/iscc/certificates/[id]/route");
      const req = createGetRequest("/api/iscc/certificates/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// ISCC SD  /api/iscc/sd
// ===================================================================
describe("ISCC SD API", () => {
  describe("GET /api/iscc/sd", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", sdNumber: "SD-001" }];
      (prisma.sustainabilityDeclaration.findMany as any).mockResolvedValue(mockData);
      (prisma.sustainabilityDeclaration.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/iscc/sd/route");
      const req = createGetRequest("/api/iscc/sd");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/iscc/sd", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "sd-1", sdNumber: "SD-002" };
      (prisma.sustainabilityDeclaration.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/iscc/sd/route");
      const req = createJsonRequest("/api/iscc/sd", "POST", {
        declarationNumber: "SD-002",
        issueDate: "2026-01-01",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/iscc/sd/route");
      const req = createJsonRequest("/api/iscc/sd", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/iscc/sd/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", sdNumber: "SD-001" };
      (prisma.sustainabilityDeclaration.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/iscc/sd/[id]/route");
      const req = createGetRequest("/api/iscc/sd/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.sustainabilityDeclaration.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/iscc/sd/[id]/route");
      const req = createGetRequest("/api/iscc/sd/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/iscc/sd/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", sdNumber: "SD-UPD" };
      (prisma.sustainabilityDeclaration.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/iscc/sd/[id]/route");
      const req = createJsonRequest("/api/iscc/sd/test-id", "PUT", {
        declarationNumber: "SD-UPD",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/iscc/sd/[id]", () => {
    it("returns 200", async () => {
      (prisma.sustainabilityDeclaration.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/iscc/sd/[id]/route");
      const req = createGetRequest("/api/iscc/sd/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Subsidies  /api/subsidies  (all CRUD in one file)
// ===================================================================
describe("Subsidies API", () => {
  describe("GET /api/subsidies", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", subsidyName: "Green Grant" }];
      (prisma.subsidyDocument.findMany as any).mockResolvedValue(mockData);

      const { GET } = await import("@/app/api/subsidies/route");
      const req = createGetRequest("/api/subsidies");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/subsidies", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "s-1", subsidyName: "Solar" };
      (prisma.subsidyDocument.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/subsidies/route");
      const req = createJsonRequest("/api/subsidies", "POST", {
        name: "Solar",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/subsidies/route");
      const req = createJsonRequest("/api/subsidies", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("PUT /api/subsidies", () => {
    it("returns 200 with valid update (id in body)", async () => {
      const updated = { id: "test-id", subsidyName: "Updated" };
      (prisma.subsidyDocument.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/subsidies/route");
      const req = createJsonRequest("/api/subsidies", "PUT", {
        id: "test-id",
        name: "Updated",
      });
      const { status, body } = await parseResponse(await PUT(req));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });

    it("returns 400 when id is missing", async () => {
      const { PUT } = await import("@/app/api/subsidies/route");
      const req = createJsonRequest("/api/subsidies", "PUT", {
        name: "No id",
      });
      const { status, body } = await parseResponse(await PUT(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("DELETE /api/subsidies", () => {
    it("returns 200 with id in query params", async () => {
      (prisma.subsidyDocument.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/subsidies/route");
      const { NextRequest } = await import("next/server");
      const url = new URL("/api/subsidies?id=test-id", "http://localhost:3000");
      const delReq = new NextRequest(url, { method: "DELETE" });
      const { status, body } = await parseResponse(await DELETE(delReq));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });

    it("returns 400 when id is missing", async () => {
      const { DELETE } = await import("@/app/api/subsidies/route");
      const { NextRequest } = await import("next/server");
      const url = new URL("/api/subsidies", "http://localhost:3000");
      const delReq = new NextRequest(url, { method: "DELETE" });
      const { status, body } = await parseResponse(await DELETE(delReq));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });
});

// ===================================================================
// Traceability  /api/traceability
// ===================================================================
describe("Traceability API", () => {
  describe("GET /api/traceability", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", traceNumber: "TRC-001" }];
      (prisma.traceRecord.findMany as any).mockResolvedValue(mockData);

      const { GET } = await import("@/app/api/traceability/route");
      const req = createGetRequest("/api/traceability");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/traceability", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "t-1", traceNumber: "TEST-001", sourceType: "PURCHASE" };
      (prisma.traceRecord.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/traceability/route");
      const req = createJsonRequest("/api/traceability", "POST", {
        sourceType: "PURCHASE",
        sourceId: "po-1",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/traceability/route");
      const req = createJsonRequest("/api/traceability", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/traceability/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", traceNumber: "TRC-001" };
      (prisma.traceRecord.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/traceability/[id]/route");
      const req = createGetRequest("/api/traceability/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.traceRecord.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/traceability/[id]/route");
      const req = createGetRequest("/api/traceability/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/traceability/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", sourceType: "SALES" };
      (prisma.traceRecord.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/traceability/[id]/route");
      const req = createJsonRequest("/api/traceability/test-id", "PUT", {
        sourceType: "SALES",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/traceability/[id]", () => {
    it("returns 200", async () => {
      (prisma.traceRecord.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/traceability/[id]/route");
      const req = createGetRequest("/api/traceability/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Notifications  /api/notifications
// ===================================================================
describe("Notifications API", () => {
  describe("GET /api/notifications", () => {
    it("returns 200 with items and unreadCount", async () => {
      const items = [{ id: "n-1", message: "Hello", isRead: false }];
      (prisma.notification.findMany as any).mockResolvedValue(items);
      (prisma.notification.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/notifications/route");
      const req = createGetRequest("/api/notifications");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body.items).toEqual(items);
      expect(body.unreadCount).toBe(1);
    });
  });

  describe("PUT /api/notifications/[id]", () => {
    it("returns 200 and marks as read", async () => {
      const updated = { id: "test-id", isRead: true };
      (prisma.notification.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/notifications/[id]/route");
      const req = createJsonRequest("/api/notifications/test-id", "PUT", {});
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body.isRead).toBe(true);
    });
  });

  describe("PUT /api/notifications/read-all", () => {
    it("returns 200 with success", async () => {
      (prisma.notification.updateMany as any).mockResolvedValue({ count: 5 });

      const { PUT } = await import("@/app/api/notifications/read-all/route");
      const { status, body } = await parseResponse(await PUT());

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Settings Users  /api/settings/users
// ===================================================================
describe("Settings Users API", () => {
  describe("GET /api/settings/users", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", name: "Taro", email: "taro@example.com" }];
      (prisma.user.findMany as any).mockResolvedValue(mockData);
      (prisma.user.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/settings/users/route");
      const req = createGetRequest("/api/settings/users");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/settings/users", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "u-1", name: "New User", email: "new@example.com" };
      (prisma.user.create as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/settings/users/route");
      const req = createJsonRequest("/api/settings/users", "POST", {
        email: "new@example.com",
        name: "New User",
        roleId: "role-1",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/settings/users/route");
      const req = createJsonRequest("/api/settings/users", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });

    it("returns 400 with invalid email", async () => {
      const { POST } = await import("@/app/api/settings/users/route");
      const req = createJsonRequest("/api/settings/users", "POST", {
        email: "not-an-email",
        name: "Test",
        roleId: "role-1",
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/settings/users/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", name: "Found User" };
      (prisma.user.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/settings/users/[id]/route");
      const req = createGetRequest("/api/settings/users/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/settings/users/[id]/route");
      const req = createGetRequest("/api/settings/users/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/settings/users/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", name: "Updated" };
      (prisma.user.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/settings/users/[id]/route");
      const req = createJsonRequest("/api/settings/users/test-id", "PUT", {
        name: "Updated",
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/settings/users/[id]", () => {
    it("returns 200", async () => {
      (prisma.user.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/settings/users/[id]/route");
      const req = createGetRequest("/api/settings/users/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Production Calendar  /api/production-calendar
// ===================================================================
describe("Production Calendar API", () => {
  describe("GET /api/production-calendar", () => {
    it("returns 200 with list", async () => {
      const mockData = [{ id: "1", date: "2026-03-01", isWorkday: true }];
      (prisma.productionCalendar.findMany as any).mockResolvedValue(mockData);
      (prisma.productionCalendar.count as any).mockResolvedValue(1);

      const { GET } = await import("@/app/api/production-calendar/route");
      const req = createGetRequest("/api/production-calendar");
      const { status, body } = await parseResponse(await GET(req));

      expect(status).toBe(200);
      expect(body).toEqual(mockData);
    });
  });

  describe("POST /api/production-calendar", () => {
    it("returns 201 with valid body", async () => {
      const created = { id: "pc-1", date: "2026-03-01", isOperating: true };
      (prisma.productionCalendar.upsert as any).mockResolvedValue(created);

      const { POST } = await import("@/app/api/production-calendar/route");
      const req = createJsonRequest("/api/production-calendar", "POST", {
        date: "2026-03-01",
        plantId: "plant-1",
        isOperating: true,
      });
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(201);
      expect(body).toEqual(created);
    });

    it("returns 400 with invalid body", async () => {
      const { POST } = await import("@/app/api/production-calendar/route");
      const req = createJsonRequest("/api/production-calendar", "POST", {});
      const { status, body } = await parseResponse(await POST(req));

      expect(status).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe("GET /api/production-calendar/[id]", () => {
    it("returns 200 when found", async () => {
      const record = { id: "test-id", date: "2026-03-01" };
      (prisma.productionCalendar.findUnique as any).mockResolvedValue(record);

      const { GET } = await import("@/app/api/production-calendar/[id]/route");
      const req = createGetRequest("/api/production-calendar/test-id");
      const { status, body } = await parseResponse(await GET(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(record);
    });

    it("returns 404 when not found", async () => {
      (prisma.productionCalendar.findUnique as any).mockResolvedValue(null);

      const { GET } = await import("@/app/api/production-calendar/[id]/route");
      const req = createGetRequest("/api/production-calendar/missing");
      const { status } = await parseResponse(await GET(req, idParams("missing")));

      expect(status).toBe(404);
    });
  });

  describe("PUT /api/production-calendar/[id]", () => {
    it("returns 200 with valid update", async () => {
      const updated = { id: "test-id", isOperating: false };
      (prisma.productionCalendar.update as any).mockResolvedValue(updated);

      const { PUT } = await import("@/app/api/production-calendar/[id]/route");
      const req = createJsonRequest("/api/production-calendar/test-id", "PUT", {
        isOperating: false,
      });
      const { status, body } = await parseResponse(await PUT(req, idParams()));

      expect(status).toBe(200);
      expect(body).toEqual(updated);
    });
  });

  describe("DELETE /api/production-calendar/[id]", () => {
    it("returns 200", async () => {
      (prisma.productionCalendar.delete as any).mockResolvedValue({});

      const { DELETE } = await import("@/app/api/production-calendar/[id]/route");
      const req = createGetRequest("/api/production-calendar/test-id");
      const { status, body } = await parseResponse(await DELETE(req, idParams()));

      expect(status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

// ===================================================================
// Health  /api/health
// ===================================================================
describe("Health API", () => {
  describe("GET /api/health", () => {
    it("returns 200 with status ok", async () => {
      (prisma.businessPartner.count as any).mockResolvedValue(42);

      const { GET } = await import("@/app/api/health/route");
      const { status, body } = await parseResponse(await GET());

      expect(status).toBe(200);
      expect(body.status).toBe("ok");
      expect(body.partnerCount).toBe(42);
    });

    it("returns 500 when database fails", async () => {
      (prisma.businessPartner.count as any).mockRejectedValue(
        new Error("Connection refused")
      );

      const { GET } = await import("@/app/api/health/route");
      const { status, body } = await parseResponse(await GET());

      expect(status).toBe(500);
      expect(body.status).toBe("error");
      expect(body.message).toContain("Connection refused");
    });
  });
});
