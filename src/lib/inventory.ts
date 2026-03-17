import { prisma } from "@/lib/db";

/**
 * Update inventory record's moving average cost when a new purchase comes in.
 * Formula: newAvgCost = (existingQty * existingAvgCost + newQty * newUnitPrice) / (existingQty + newQty)
 */
export async function updateMovingAverage(params: {
  productId: string;
  warehouseId: string;
  quantity: number; // incoming quantity (kg)
  unitPrice: number; // price per kg
  purchaseId?: string;
}): Promise<void> {
  // Find or create inventory record for product+warehouse
  // Using the composite unique key (productId, warehouseId, pickupPartnerId, packagingType)
  // with null for pickupPartnerId and packagingType for standard inventory
  let inventory = await prisma.inventory.findFirst({
    where: {
      productId: params.productId,
      warehouseId: params.warehouseId,
      pickupPartnerId: null,
      packagingType: null,
    },
  });

  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantity: 0,
        movingAvgCost: 0,
      },
    });
  }

  const oldQty = inventory.quantity;
  const oldAvg = inventory.movingAvgCost;
  const newQty = params.quantity;
  const newPrice = params.unitPrice;

  const totalQty = oldQty + newQty;
  const newAvgCost =
    totalQty > 0
      ? (oldQty * oldAvg + newQty * newPrice) / totalQty
      : 0;

  // Update inventory record
  await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: totalQty,
      movingAvgCost: newAvgCost,
    },
  });

  // Create inventory movement record
  await prisma.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      movementType: "IN",
      quantity: newQty,
      unitPrice: newPrice,
      movementDate: new Date(),
      purchaseId: params.purchaseId ?? null,
      note: "仕入による入庫",
    },
  });
}

/**
 * Adjust inventory quantity with a reason. Creates an ADJ movement record.
 * @param adjustmentQty  Positive for increase, negative for decrease.
 */
export async function adjustInventory(params: {
  productId: string;
  warehouseId: string;
  adjustmentQty: number;
  reason: string;
}): Promise<void> {
  let inventory = await prisma.inventory.findFirst({
    where: {
      productId: params.productId,
      warehouseId: params.warehouseId,
      pickupPartnerId: null,
      packagingType: null,
    },
  });

  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantity: 0,
        movingAvgCost: 0,
      },
    });
  }

  const newQty = inventory.quantity + params.adjustmentQty;

  await prisma.inventory.update({
    where: { id: inventory.id },
    data: { quantity: newQty },
  });

  await prisma.inventoryMovement.create({
    data: {
      inventoryId: inventory.id,
      movementType: "ADJ",
      quantity: params.adjustmentQty,
      movementDate: new Date(),
      note: params.reason,
    },
  });
}
