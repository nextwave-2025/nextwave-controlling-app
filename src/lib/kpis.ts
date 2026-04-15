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

function getQuarterRange(): DateRange {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;

  const start = new Date(now.getFullYear(), quarterStartMonth, 1);
  const end = new Date(now.getFullYear(), quarterStartMonth + 3, 1);

  return { start, end };
}

export async function getDashboardSummary() {
  const today = getTodayRange();
  const month = getMonthRange();
  const quarter = getQuarterRange();

  const [todayInvoices, monthInvoices, quarterInvoices, fixedCosts, latestSync] =
    await Promise.all([
      db.syncedInvoice.findMany({
        where: {
          invoiceDate: {
            gte: today.start,
            lt: today.end,
          },
        },
        select: {
          netAmount: true,
          grossAmount: true,
          customerId: true,
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
          grossAmount: true,
          customerId: true,
        },
      }),

      db.syncedInvoice.findMany({
        where: {
          invoiceDate: {
            gte: quarter.start,
            lt: quarter.end,
          },
        },
        select: {
          netAmount: true,
          grossAmount: true,
        },
      }),

      db.fixedCost.findMany({
        where: {
          isActive: true,
        },
        select: {
          amount: true,
        },
      }),

      db.revenueSync.findFirst({
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  const todayRevenue = todayInvoices.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const monthRevenue = monthInvoices.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const monthFixedCosts = fixedCosts.reduce(
    (sum, item) => sum + toNumber(item.amount),
    0
  );

  const monthVariableCosts = 0;
  const monthTotalCosts = monthFixedCosts + monthVariableCosts;
  const monthProfit = monthRevenue - monthTotalCosts;

  const monthCustomerIds = new Set(
    monthInvoices
      .map((item) => item.customerId)
      .filter((value): value is string => Boolean(value))
  );

  const monthNewCustomers =
    latestSync?.newCustomersMonth ?? monthCustomerIds.size;

  const averageRevenuePerNewCustomer =
    monthNewCustomers > 0 ? monthRevenue / monthNewCustomers : 0;

  const monthOutputVat = monthRevenue * 0.19;
  const monthInputVat = monthFixedCosts * 0.19;

  const quarterRevenue = quarterInvoices.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const quarterOutputVat = quarterRevenue * 0.19;
  const quarterInputVat = monthInputVat * 3;
  const quarterVatPayable = quarterOutputVat - quarterInputVat;

  const breakEvenRevenueTarget = monthFixedCosts;
  const monthBreakEvenGap = Math.max(0, breakEvenRevenueTarget - monthRevenue);

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
