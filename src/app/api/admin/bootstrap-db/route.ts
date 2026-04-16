import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SyncedInvoice" (
        "id" TEXT NOT NULL,
        "weclappId" TEXT NOT NULL,
        "invoiceNumber" TEXT,
        "customerId" TEXT,
        "customerName" TEXT,
        "invoiceDate" TIMESTAMP(3) NOT NULL,
        "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SyncedInvoice_pkey" PRIMARY KEY ("id")
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SyncedInvoice_weclappId_key"
      ON "SyncedInvoice"("weclappId");
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RevenueSync" (
        "id" TEXT NOT NULL,
        "syncDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "revenueTodayNet" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "revenueMonthNet" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "newCustomersMonth" INTEGER NOT NULL DEFAULT 0,
        "avgRevenuePerNewCustomer" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "invoiceCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RevenueSync_pkey" PRIMARY KEY ("id")
      );
    `);

        await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SyncedPurchaseInvoice" (
        "id" TEXT NOT NULL,
        "weclappId" TEXT NOT NULL,
        "invoiceNumber" TEXT,
        "supplierId" TEXT,
        "supplierName" TEXT,
        "invoiceDate" TIMESTAMP(3) NOT NULL,
        "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SyncedPurchaseInvoice_pkey" PRIMARY KEY ("id")
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SyncedPurchaseInvoice_weclappId_key"
      ON "SyncedPurchaseInvoice"("weclappId");
    `);

    await db.$executeRawUnsafe(`
  ALTER TABLE "FixedCost"
  ADD COLUMN IF NOT EXISTS "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;
`);

await db.$executeRawUnsafe(`
  ALTER TABLE "FixedCost"
  ADD COLUMN IF NOT EXISTS "taxMode" TEXT NOT NULL DEFAULT 'gross19';
`);

    return NextResponse.json({
      ok: true,
      message: "DB bootstrap erfolgreich",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
