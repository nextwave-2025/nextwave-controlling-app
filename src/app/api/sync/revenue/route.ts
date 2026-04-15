import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchWeclappInvoices } from "@/lib/weclapp";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
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

    for (const invoice of invoices) {
      if (!invoice.id || !invoice.invoiceDate) {
        continue;
      }

      const invoiceDate = new Date(invoice.invoiceDate);
      const netAmount = Number(invoice.netAmount ?? 0);
      const grossAmount = Number(invoice.grossAmount ?? 0);
      const customerId = invoice.customerId ? String(invoice.customerId) : null;

      await prisma.syncedInvoice.upsert({
        where: {
          weclappId: String(invoice.id),
        },
        update: {
          invoiceNumber: invoice.invoiceNumber ?? null,
          customerId,
          customerName: invoice.customerName ?? null,
          invoiceDate,
          netAmount,
          grossAmount,
        },
        create: {
          weclappId: String(invoice.id),
          invoiceNumber: invoice.invoiceNumber ?? null,
          customerId,
          customerName: invoice.customerName ?? null,
          invoiceDate,
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
        if (customerId) {
          customerIdsThisMonth.add(customerId);
        }
      }
    }

    const newCustomersMonth = customerIdsThisMonth.size;
    const avgRevenuePerNewCustomer =
      newCustomersMonth > 0 ? revenueMonthNet / newCustomersMonth : 0;

    const sync = await prisma.revenueSync.create({
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
