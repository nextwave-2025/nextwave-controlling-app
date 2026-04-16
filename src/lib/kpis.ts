import { db } from "@/lib/db";
import { toNumber } from "@/lib/money";

type DateRange = {
  start: Date;
  end: Date;
};

function getTodayRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

function getMonthRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

export async function getDashboardSummary() {
  const today = getTodayRange();
  const month = getMonthRange();

  const fixedCosts = await db.fixedCost.findMany({
    where: {
      active: true,
    },
    select: {
      amountMonthly: true,
    },
  });

  const monthFixedCosts = fixedCosts.reduce(
    (sum, item) => sum + toNumber(item.amountMonthly),
    0
  );

  let todayRevenue = 0;
  let monthRevenue = 0;
  let monthVariableCosts = 0;
  let monthNewCustomers = 0;
  let averageRevenuePerNewCustomer = 0;
  let monthOutputVat = 0;
  let monthInputVat = 0;

  try {
    const [
      todayInvoices,
      monthInvoices,
      monthPurchaseInvoices,
      latestSync,
    ] = await Promise.all([
      db.syncedInvoice.findMany({
        where: {
          invoiceDate: {
            gte: today.start,
            lt: today.end,
          },
        },
        select: {
          netAmount: true,
        },
      }),

      db.syncedInvoice.findMany({
        where: {
          invoiceDate: {
            gte: month.start,
            lt: month.end,
          },
        },
        select: {
          netAmount: true,
          customerId: true,
        },
      }),

      db.syncedPurchaseInvoice.findMany({
        where: {
          invoiceDate: {
            gte: month.start,
            lt: month.end,
          },
        },
        select: {
          netAmount: true,
        },
      }),

      db.revenueSync.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    todayRevenue = todayInvoices.reduce(
      (sum, item) => sum + toNumber(item.netAmount),
      0
    );

    monthRevenue = monthInvoices.reduce(
      (sum, item) => sum + toNumber(item.netAmount),
      0
    );

    monthVariableCosts = monthPurchaseInvoices.reduce(
      (sum, item) => sum + toNumber(item.netAmount),
      0
    );

    const monthCustomerIds = new Set(
      monthInvoices
        .map((item) => item.customerId)
        .filter((value): value is string => Boolean(value))
    );

    monthNewCustomers =
      latestSync?.newCustomersMonth ?? monthCustomerIds.size;

    averageRevenuePerNewCustomer =
      monthNewCustomers > 0 ? monthRevenue / monthNewCustomers : 0;

    monthOutputVat = monthRevenue * 0.19;

    monthInputVat = (monthFixedCosts + monthVariableCosts) * 0.19;

  } catch {
    todayRevenue = 0;
    monthRevenue = 0;
    monthVariableCosts = 0;
    monthNewCustomers = 0;
    averageRevenuePerNewCustomer = 0;
    monthOutputVat = 0;
    monthInputVat = 0;
  }

  const monthTotalCosts = monthFixedCosts + monthVariableCosts;

  const monthProfit = monthRevenue - monthTotalCosts;

  const quarterVatPayable = monthOutputVat * 3 - monthInputVat * 3;

  const monthBreakEvenGap = Math.max(0, monthTotalCosts - monthRevenue);

  return {
    todayRevenue,
    monthRevenue,
    monthFixedCosts,
    monthVariableCosts,
    monthTotalCosts,
    monthProfit,
    monthNewCustomers,
    averageRevenuePerNewCustomer,
    monthOutputVat,
    monthInputVat,
    quarterVatPayable,
    monthBreakEvenGap,
  };
}
