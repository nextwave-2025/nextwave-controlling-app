import { db } from "@/lib/db";
import {
  getMonthRange,
  getQuarterRange,
  getTodayRange,
  isDateActiveInMonth,
} from "@/lib/date";
import { toNumber } from "@/lib/money";

export type DashboardSummary = {
  todayRevenue: number;
  monthRevenue: number;
  quarterRevenue: number;
  monthFixedCosts: number;
  monthVariableCosts: number;
  monthTotalCosts: number;
  monthProfit: number;
  monthBreakEvenGap: number;
  monthOutputVat: number;
  monthInputVat: number;
  quarterVatPayable: number;
  monthNewCustomers: number;
  monthNewCustomerRevenue: number;
  averageRevenuePerNewCustomer: number;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = getTodayRange();
  const month = getMonthRange();
  const quarter = getQuarterRange();

  const [
    todayRevenueDocs,
    monthRevenueDocs,
    quarterRevenueDocs,
    monthPurchaseDocs,
    quarterPurchaseDocs,
    allFixedCosts,
    customerSnapshots,
  ] = await Promise.all([
    db.revenueDocument.findMany({
      where: {
        documentDate: {
          gte: today.start,
          lte: today.end,
        },
      },
      select: {
        netAmount: true,
        taxAmount: true,
      },
    }),
    db.revenueDocument.findMany({
      where: {
        documentDate: {
          gte: month.start,
          lte: month.end,
        },
      },
      select: {
        customerId: true,
        netAmount: true,
        taxAmount: true,
      },
    }),
    db.revenueDocument.findMany({
      where: {
        documentDate: {
          gte: quarter.start,
          lte: quarter.end,
        },
      },
      select: {
        netAmount: true,
        taxAmount: true,
      },
    }),
    db.purchaseDocument.findMany({
      where: {
        documentDate: {
          gte: month.start,
          lte: month.end,
        },
      },
      select: {
        netAmount: true,
        taxAmount: true,
      },
    }),
    db.purchaseDocument.findMany({
      where: {
        documentDate: {
          gte: quarter.start,
          lte: quarter.end,
        },
      },
      select: {
        taxAmount: true,
      },
    }),
    db.fixedCost.findMany({
      where: {
        active: true,
      },
      select: {
        amountMonthly: true,
        startDate: true,
        endDate: true,
      },
    }),
    db.customerSnapshot.findMany({
      where: {
        firstInvoiceDate: {
          gte: month.start,
          lte: month.end,
        },
      },
      select: {
        externalCustomerId: true,
      },
    }),
  ]);

  const todayRevenue = todayRevenueDocs.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const monthRevenue = monthRevenueDocs.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const quarterRevenue = quarterRevenueDocs.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const monthFixedCosts = allFixedCosts
    .filter((cost) =>
      isDateActiveInMonth(cost.startDate, cost.endDate, month.start, month.end)
    )
    .reduce((sum, item) => sum + toNumber(item.amountMonthly), 0);

  const monthVariableCosts = monthPurchaseDocs.reduce(
    (sum, item) => sum + toNumber(item.netAmount),
    0
  );

  const monthTotalCosts = monthFixedCosts + monthVariableCosts;
  const monthProfit = monthRevenue - monthTotalCosts;
  const monthBreakEvenGap = Math.max(0, monthTotalCosts - monthRevenue);

  const monthOutputVat = monthRevenueDocs.reduce(
    (sum, item) => sum + toNumber(item.taxAmount),
    0
  );

  const monthInputVat = monthPurchaseDocs.reduce(
    (sum, item) => sum + toNumber(item.taxAmount),
    0
  );

  const quarterOutputVat = quarterRevenueDocs.reduce(
    (sum, item) => sum + toNumber(item.taxAmount),
    0
  );

  const quarterInputVat = quarterPurchaseDocs.reduce(
    (sum, item) => sum + toNumber(item.taxAmount),
    0
  );

  const quarterVatPayable = quarterOutputVat - quarterInputVat;

  const newCustomerIds = new Set(
    customerSnapshots.map((item) => item.externalCustomerId)
  );

  const monthNewCustomers = newCustomerIds.size;

  const monthNewCustomerRevenue = monthRevenueDocs.reduce((sum, item) => {
    if (item.customerId && newCustomerIds.has(item.customerId)) {
      return sum + toNumber(item.netAmount);
    }
    return sum;
  }, 0);

  const averageRevenuePerNewCustomer =
    monthNewCustomers > 0
      ? monthNewCustomerRevenue / monthNewCustomers
      : 0;

  return {
    todayRevenue,
    monthRevenue,
    quarterRevenue,
    monthFixedCosts,
    monthVariableCosts,
    monthTotalCosts,
    monthProfit,
    monthBreakEvenGap,
    monthOutputVat,
    monthInputVat,
    quarterVatPayable,
    monthNewCustomers,
    monthNewCustomerRevenue,
    averageRevenuePerNewCustomer,
  };
}
