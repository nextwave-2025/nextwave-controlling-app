import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchWeclappPurchaseInvoices } from "@/lib/weclapp";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function detectCurrency(invoice: Record<string, unknown>) {
  return String(
    invoice.currency ??
      invoice.currencyCode ??
      invoice.documentCurrency ??
      "EUR"
  ).toUpperCase();
}

function detectTaxAmount(invoice: Record<string, unknown>) {
  const explicitTax = Number(
    invoice.taxAmount ??
      invoice.vatAmount ??
      invoice.inputTaxAmount ??
      0
  );

  if (Number.isFinite(explicitTax) && explicitTax > 0) {
    return explicitTax;
  }

  const gross = Number(invoice.grossAmount ?? 0);
  const net = Number(invoice.netAmount ?? 0);
  const diff = gross - net;

  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

function detectTaxRate(invoice: Record<string, unknown>) {
  const raw = invoice.taxRate ?? invoice.vatRate ?? null;
  const rate = raw == null ? null : Number(raw);

  return Number.isFinite(rate) ? rate : null;
}

function detectTaxMode(invoice: Record<string, unknown>) {
  const raw =
    invoice.taxMode ??
    invoice.vatType ??
    invoice.taxType ??
    invoice.taxCategory ??
    null;

  const value = String(raw ?? "").trim().toLowerCase();

  if (value.includes("19")) return "gross19";
  if (value.includes("7")) return "gross7";
  if (
    value.includes("frei") ||
    value.includes("exempt") ||
    value.includes("steuerfrei")
  ) {
    return "exempt";
  }
  if (
    value.includes("reverse") ||
    value.includes("charge")
  ) {
    return "reverse_charge";
  }
  if (
    value.includes("netto") ||
    value === "net"
  ) {
    return "net";
  }

  return null;
}

function isVatDeductible(invoice: Record<string, unknown>, currency: string, taxAmount: number, taxMode: string | null) {
  const rawFlag =
    invoice.isVatDeductible ??
    invoice.inputTaxDeductible ??
    invoice.vatDeductible ??
    null;

  if (typeof rawFlag === "boolean") {
    return rawFlag;
  }

  if (taxMode === "gross19" || taxMode === "gross7") {
    return taxAmount > 0;
  }

  if (
    taxMode === "net" ||
    taxMode === "exempt" ||
    taxMode === "reverse_charge"
  ) {
    return false;
  }

  if (currency !== "EUR" && taxAmount <= 0) {
    return false;
  }

  return taxAmount > 0;
}

export async function POST() {
  try {
    const invoices = await fetchWeclappPurchaseInvoices();
    console.log("Purchase invoice sample:", invoices[0]);
    const monthStart = startOfMonth();

    let costsMonthNet = 0;
    let invoiceCount = 0;

    for (const rawInvoice of invoices) {
      const invoice = rawInvoice as Record<string, unknown>;

      if (!invoice.id || !invoice.invoiceDate) continue;

      const invoiceDate = new Date(String(invoice.invoiceDate));
      const netAmount = Number(invoice.netAmount ?? 0);
      const grossAmount = Number(invoice.grossAmount ?? 0);
      const supplierId = invoice.supplierId ? String(invoice.supplierId) : null;

      const currency = detectCurrency(invoice);
      const taxAmount = detectTaxAmount(invoice);
      const taxRate = detectTaxRate(invoice);
      const taxMode = detectTaxMode(invoice);
      const vatDeductible = isVatDeductible(
        invoice,
        currency,
        taxAmount,
        taxMode
      );

      await db.syncedPurchaseInvoice.upsert({
        where: {
          weclappId: String(invoice.id),
        },
        update: {
          invoiceNumber: (invoice.invoiceNumber as string) ?? null,
          supplierId,
          supplierName: (invoice.supplierName as string) ?? null,
          invoiceDate,
          currency,
          netAmount,
          grossAmount,
          taxAmount,
          taxRate,
          taxMode,
          isVatDeductible: vatDeductible,
        },
        create: {
          weclappId: String(invoice.id),
          invoiceNumber: (invoice.invoiceNumber as string) ?? null,
          supplierId,
          supplierName: (invoice.supplierName as string) ?? null,
          invoiceDate,
          currency,
          netAmount,
          grossAmount,
          taxAmount,
          taxRate,
          taxMode,
          isVatDeductible: vatDeductible,
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
