import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchWeclappPurchaseInvoices } from "@/lib/weclapp";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function POST() {
  try {
    const invoices = await fetchWeclappPurchaseInvoices();
    const monthStart = startOfMonth();

    let costsMonthNet = 0;
    let invoiceCount = 0;

    for (const invoice of invoices) {
      if (!invoice.id || !invoice.invoiceDate) continue;

      const invoiceDate = new Date(invoice.invoiceDate);
      const netAmount = Number(invoice.netAmount ?? 0);
      const grossAmount = Number(invoice.grossAmount ?? 0);
      const supplierId = invoice.supplierId ? String(invoice.supplierId) : null;

      await db.syncedPurchaseInvoice.upsert({
        where: {
          weclappId: String(invoice.id),
        },
        update: {
          invoiceNumber: invoice.invoiceNumber ?? null,
          supplierId,
          supplierName: invoice.supplierName ?? null,
          invoiceDate,
          netAmount,
          grossAmount,
        },
        create: {
          weclappId: String(invoice.id),
          invoiceNumber: invoice.invoiceNumber ?? null,
          supplierId,
          supplierName: invoice.supplierName ?? null,
          invoiceDate,
          netAmount,
          grossAmount,
        },
      });

      invoiceCount++;

      if (invoiceDate >= monthStart) {
        costsMonthNet += netAmount;
      }
    }

    return NextResponse.json({
      ok: true,
      costsMonthNet,
      invoiceCount,
    });
  } catch (error) {
    console.error("Costs sync failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
