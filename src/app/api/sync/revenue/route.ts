import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchWeclappInvoices } from "@/lib/weclapp";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function normalizeInvoiceType(invoice: Record<string, unknown>) {
  const raw =
    invoice.invoiceType ??
    invoice.type ??
    invoice.documentType ??
    invoice.kind ??
    invoice.category ??
    null;

  const value = String(raw ?? "").trim().toLowerCase();

  if (
    value.includes("proforma") ||
    value.includes("pro forma") ||
    value.includes("proforma-rechnung")
  ) {
    return "PROFORMA";
  }

  if (
    value.includes("abschluss") ||
    value.includes("final")
  ) {
    return "FINAL";
  }

  if (
    value.includes("standard") ||
    value.includes("rechnung") ||
    value.includes("invoice")
  ) {
    return "STANDARD";
  }

  return null;
}

function isAllowedRevenueInvoice(invoiceType: string | null) {
  return invoiceType === "STANDARD" || invoiceType === "FINAL";
}

export async function POST() {
  try {
    const invoices = await fetchWeclappInvoices();

    const todayStart = startOfToday();
    const monthStart = startOfMonth();

    let revenueTodayNet = 0;
    let revenueMonthNet = 0;
    let invoiceCount = 0;

    const customerIdsThisMonth = new Set<string>();

    for (const rawInvoice of invoices) {
      const invoice = rawInvoice as Record<string, unknown>;

      if (!invoice.id || !invoice.invoiceDate) continue;

      const invoiceType = normalizeInvoiceType(invoice);

      if (!isAllowedRevenueInvoice(invoiceType)) {
        continue;
      }

      const invoiceDate = new Date(String(invoice.invoiceDate));
      const netAmount = Number(invoice.netAmount ?? 0);
      const grossAmount = Number(invoice.grossAmount ?? 0);
      const customerId = invoice.customerId ? String(invoice.customerId) : null;

      await db.syncedInvoice.upsert({
        where: {
          weclappId: String(invoice.id),
        },
        update: {
          invoiceNumber: (invoice.invoiceNumber as string) ?? null,
          customerId,
          customerName: (invoice.customerName as string) ?? null,
          invoiceDate,
          invoiceType,
          netAmount,
          grossAmount,
        },
        create: {
          weclappId: String(invoice.id),
          invoiceNumber: (invoice.invoiceNumber as string) ?? null,
          customerId,
          customerName: (invoice.customerName as string) ?? null,
          invoiceDate,
          invoiceType,
          netAmount,
          grossAmount,
        },
      });

      invoiceCount++;

      if (invoiceDate >= todayStart) {
        revenueTodayNet += netAmount;
      }

      if (invoiceDate >= monthStart) {
        revenueMonthNet += netAmount;
        if (customerId) customerIdsThisMonth.add(customerId);
      }
    }

    const newCustomersMonth = customerIdsThisMonth.size;
    const avgRevenuePerNewCustomer =
      newCustomersMonth > 0 ? revenueMonthNet / newCustomersMonth : 0;

    const sync = await db.revenueSync.create({
      data: {
        revenueTodayNet,
        revenueMonthNet,
        newCustomersMonth,
        avgRevenuePerNewCustomer,
        invoiceCount,
      },
    });

    return NextResponse.json({
      ok: true,
      syncId: sync.id,
      revenueTodayNet,
      revenueMonthNet,
      newCustomersMonth,
      avgRevenuePerNewCustomer,
      invoiceCount,
    });
  } catch (error) {
    console.error("Revenue sync failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
