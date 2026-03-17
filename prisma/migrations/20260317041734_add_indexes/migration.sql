-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tableName_idx" ON "AuditLog"("tableName");

-- CreateIndex
CREATE INDEX "BusinessPartner_deletedAt_idx" ON "BusinessPartner"("deletedAt");

-- CreateIndex
CREATE INDEX "Contract_deletedAt_idx" ON "Contract"("deletedAt");

-- CreateIndex
CREATE INDEX "CrMaterial_deletedAt_idx" ON "CrMaterial"("deletedAt");

-- CreateIndex
CREATE INDEX "CrProductionOrder_deletedAt_idx" ON "CrProductionOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "CustomerPrice_deletedAt_idx" ON "CustomerPrice"("deletedAt");

-- CreateIndex
CREATE INDEX "Dispatch_deletedAt_idx" ON "Dispatch"("deletedAt");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_idx" ON "Expense"("deletedAt");

-- CreateIndex
CREATE INDEX "Inventory_productId_warehouseId_idx" ON "Inventory"("productId", "warehouseId");

-- CreateIndex
CREATE INDEX "Invoice_deletedAt_idx" ON "Invoice"("deletedAt");

-- CreateIndex
CREATE INDEX "Invoice_billingDate_idx" ON "Invoice"("billingDate");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "IsccCertificate_deletedAt_idx" ON "IsccCertificate"("deletedAt");

-- CreateIndex
CREATE INDEX "LabSample_deletedAt_idx" ON "LabSample"("deletedAt");

-- CreateIndex
CREATE INDEX "OilShipment_deletedAt_idx" ON "OilShipment"("deletedAt");

-- CreateIndex
CREATE INDEX "PartnerContact_deletedAt_idx" ON "PartnerContact"("deletedAt");

-- CreateIndex
CREATE INDEX "PaymentPayable_deletedAt_idx" ON "PaymentPayable"("deletedAt");

-- CreateIndex
CREATE INDEX "PaymentReceived_deletedAt_idx" ON "PaymentReceived"("deletedAt");

-- CreateIndex
CREATE INDEX "Plant_deletedAt_idx" ON "Plant"("deletedAt");

-- CreateIndex
CREATE INDEX "ProcessingOrder_deletedAt_idx" ON "ProcessingOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductColor_deletedAt_idx" ON "ProductColor"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductGrade_deletedAt_idx" ON "ProductGrade"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductName_deletedAt_idx" ON "ProductName"("deletedAt");

-- CreateIndex
CREATE INDEX "ProductShape_deletedAt_idx" ON "ProductShape"("deletedAt");

-- CreateIndex
CREATE INDEX "Purchase_deletedAt_idx" ON "Purchase"("deletedAt");

-- CreateIndex
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Quotation_deletedAt_idx" ON "Quotation"("deletedAt");

-- CreateIndex
CREATE INDEX "Revenue_deletedAt_idx" ON "Revenue"("deletedAt");

-- CreateIndex
CREATE INDEX "Revenue_revenueDate_idx" ON "Revenue"("revenueDate");

-- CreateIndex
CREATE INDEX "Revenue_salesCategory_idx" ON "Revenue"("salesCategory");

-- CreateIndex
CREATE INDEX "SalesOrder_deletedAt_idx" ON "SalesOrder"("deletedAt");

-- CreateIndex
CREATE INDEX "SalesOrder_orderDate_idx" ON "SalesOrder"("orderDate");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "Shipment_deletedAt_idx" ON "Shipment"("deletedAt");

-- CreateIndex
CREATE INDEX "Shipment_shipmentDate_idx" ON "Shipment"("shipmentDate");

-- CreateIndex
CREATE INDEX "Shipment_customerId_idx" ON "Shipment"("customerId");

-- CreateIndex
CREATE INDEX "Warehouse_deletedAt_idx" ON "Warehouse"("deletedAt");
