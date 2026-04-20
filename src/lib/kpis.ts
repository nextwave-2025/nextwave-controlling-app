import { db } from "@/lib/db";
import { toNumber } from "@/lib/money";

type DateRange = {
  start: Date;
  end: Date;
};

type QuarterVatHistoryItem = {
  label: string;
  outputVat: number;
  inputVat: number;
  payable: number;
};

type MonthlyProfitHistoryItem = {
  label: string;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  profit: number;
};

function getTodayRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start, end };
}

function getMonthRange(baseDate = new Date()): DateRange {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
  return { start, end };
}

function getQuarterRange(baseDate = new Date()): DateRange {
  const quarterStartMonth = Math.floor(baseDate.getMonth() / 3) * 3;
  const start = new Date(baseDate.getFullYear(), quarterStartMonth, 1);
  const end = new Date(baseDate.getFullYear(), quarterStartMonth + 3, 1);
  return { start, end };
}

function shiftMonth(baseDate: Date, diff: number) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + diff, 1);
}

function shiftQuarter(baseDate: Date, diff: number) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + diff * 3, 1);
}

function getQuarterLabel(date: Date) {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function calculateFixedCostInputVat(item: {
  amountMonthly: unknown;
  amountPaid?: unknown;
  taxMode?: string | null;
}) {
  const net = toNumber(item.amountMonthly);
  const paid = item.amountPaid == null ? null : toNumber(item.amountPaid);

  if (paid !== null) {
    return Math.max(0, paid - net);
  }

  switch (item.taxMode) {
    case "gross19":
      return net * 0.19;
    case "gross7":
      return net * 0.07;
    case "exempt":
    case "net":
      return 0;
    default:
      return net * 0.19;
  }
}

async function getQuarterVatHistory(
  monthlyFixedCostInputVat: number,
  count = 4
): Promise<QuarterVatHistoryItem[]> {
  const now = new Date();

  const quarterBases = Array.from({ length: count }, (_, index) =>
    shiftQuarter(now, -(index + 1))
  ).reverse();

  const items = await Promise.all(
    quarterBases.map(async (baseDate) => {
      const range = getQuarterRange(baseDate);

      const [invoices, purchaseInvoices] = await Promise.all([
        db.syncedInvoice.findMany({
          where: {
            invoiceDate: {
              gte: range.start,
              lt: range.end,
            },
          },
          select: {
            netAmount: true,
          },
        }),

        db.syncedPurchaseInvoice.findMany({
          where: {
            invoiceDate: {
              gte: range.start,
              lt: range.end,
            },
          },
          select: {
            netAmount: true,
          },
        }),
      ]);

      const revenue = invoices.reduce(
        (sum, item) => sum + toNumber(item.netAmount),
        0
      );

      const variableCosts = purchaseInvoices.reduce(
        (sum, item) => sum + toNumber(item.netAmount),
        0
      );

      const outputVat = revenue * 0.19;
      const inputVat = variableCosts * 0.19 + monthlyFixedCostInputVat * 3;
      const payable = outputVat - inputVat;

      return {
        label: getQuarterLabel(baseDate),
        outputVat,
        inputVat,
        payable,
      };
    })
  );

  return items;
}

async function getMonthlyProfitHistory(
  monthFixedCosts: number,
  count = 6
): Promise<MonthlyProfitHistoryItem[]> {
  const now = new Date();

  const monthBases = Array.from({ length: count }, (_, index) =>
    shiftMonth(now, -(count - 1 - index))
  );

  const items = await Promise.all(
    monthBases.map(async (baseDate) => {
      const range = getMonthRange(baseDate);

      const [invoices, purchaseInvoices] = await Promise.all([
        db.syncedInvoice.findMany({
          where: {
            invoiceDate: {
              gte: range.start,
              lt: range.end,
            },
          },
          select: {
            netAmount: true,
          },
        }),

        db.syncedPurchaseInvoice.findMany({
          where: {
            invoiceDate: {
              gte: range.start,
              lt: range.end,
            },
          },
          select: {
            netAmount: true,
          },
        }),
      ]);

      const revenue = invoices.reduce(
        (sum, item) => sum + toNumber(item.netAmount),
        0
      );

      const variableCosts = purchaseInvoices.reduce(
        (sum, item) => sum + toNumber(item.netAmount),
        0
      );

      const profit = revenue - variableCosts - monthFixedCosts;

      return {
        label: getMonthLabel(baseDate),
        revenue,
        variableCosts,
        fixedCosts: monthFixedCosts,
        profit,
      };
    })
  );

  return items;
}

export async function getDashboardSummary() {
  const today = getTodayRange();
  const month = getMonthRange();
  const quarter = getQuarterRange();

  const fixedCosts = await db.fixedCost.findMany({
    where: {
      active: true,
    },
    select: {
      amountMonthly: true,
      amountPaid: true,
      taxMode: true,
    },
  });

  const monthFixedCosts = fixedCosts.reduce(
    (sum, item) => sum + toNumber(item.amountMonthly),
    0
  );

  const monthFixedCostInputVat = fixedCosts.reduce(
    (sum, item) => sum + calculateFixedCostInputVat(item),
    0
  );

  let todayRevenue = 0;
  let monthRevenue = 0;
  let monthVariableCosts = 0;
  let monthNewCustomers = 0;
  let averageRevenuePerNewCustomer = 0;
  let monthOutputVat = 0;
  let monthInputVat = 0;
  let quarterVatPayable = 0;

  try {
    const [
      todayInvoices,
      monthInvoices,
      monthPurchaseInvoices,
      quarterInvoices,
      quarterPurchaseInvoices,
      allInvoicesUntilMonthEnd,
      quarterVatHistory,
      monthlyProfitHistory,
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
          invoiceDate: true,
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

      db.syncedInvoice.findMany({
        where: {
          invoiceDate: {
            gte: quarter.start,
            lt: quarter.end,
          },
        },
        select: {
          netAmount: true,
        },
      }),

      db.syncedPurchaseInvoice.findMany({
        where: {
          invoiceDate: {
            gte: quarter.start,
            lt: quarter.end,
          },
        },
        select: {
          netAmount: true,
        },
      }),

      db.syncedInvoice.findMany({
        where: {
          invoiceDate: {
            lt: month.end,
          },
        },
        select: {
          customerId: true,
          invoiceDate: true,
        },
      }),

      getQuarterVatHistory(monthFixedCostInputVat, 4),
      getMonthlyProfitHistory(monthFixedCosts, 6),
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

    const firstInvoicePerCustomer = new Map<string, Date>();

    for (const invoice of allInvoicesUntilMonthEnd) {
      if (!invoice.customerId) continue;

      const existing = firstInvoicePerCustomer.get(invoice.customerId);

      if (!existing || invoice.invoiceDate < existing) {
        firstInvoicePerCustomer.set(invoice.customerId, invoice.invoiceDate);
      }
    }

    monthNewCustomers = Array.from(firstInvoicePerCustomer.values()).filter(
      (invoiceDate) => invoiceDate >= month.start && invoiceDate < month.end
    ).length;

    averageRevenuePerNewCustomer =
      monthNewCustomers > 0 ? monthRevenue / monthNewCustomers : 0;

    monthOutputVat = monthRevenue * 0.19;
    monthInputVat = monthVariableCosts * 0.19 + monthFixedCostInputVat;

    const quarterRevenue = quarterInvoices.reduce(
      (sum, item) => sum + toNumber(item.netAmount),
      0
    );

    const quarterVariableCosts = quarterPurchaseInvoices.reduce(
      (sum, item) => sum + toNumber(item.netAmount),
      0
    );

    const quarterOutputVat = quarterRevenue * 0.19;
    const quarterInputVat = quarterVariableCosts * 0.19 + monthFixedCostInputVat * 3;

    quarterVatPayable = quarterOutputVat - quarterInputVat;

    const monthTotalCosts = monthFixedCosts + monthVariableCosts;
    const monthProfit = monthRevenue - monthTotalCosts;
    const monthBreakEvenGap = Math.max(0, monthTotalCosts - monthRevenue);
    const monthContributionMargin = monthRevenue - monthVariableCosts;
    const monthContributionMarginPercent =
      monthRevenue > 0 ? (monthContributionMargin / monthRevenue) * 100 : 0;
    const monthGrossMarginPercent =
      monthRevenue > 0
        ? ((monthRevenue - monthVariableCosts) / monthRevenue) * 100
        : 0;
    const monthFixedCostRatio =
      monthRevenue > 0 ? (monthFixedCosts / monthRevenue) * 100 : 0;
    const monthTotalCostRatio =
      monthRevenue > 0 ? (monthTotalCosts / monthRevenue) * 100 : 0;

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
      monthContributionMargin,
      monthContributionMarginPercent,
      monthGrossMarginPercent,
      monthFixedCostRatio,
      monthTotalCostRatio,
      quarterVatHistory,
      monthlyProfitHistory,
    };
  } catch {
    const monthTotalCosts = monthFixedCosts + monthVariableCosts;
    const monthProfit = monthRevenue - monthTotalCosts;
    const monthBreakEvenGap = Math.max(0, monthTotalCosts - monthRevenue);

    return {
      todayRevenue: 0,
      monthRevenue: 0,
      monthFixedCosts,
      monthVariableCosts: 0,
      monthTotalCosts,
      monthProfit,
      monthNewCustomers: 0,
      averageRevenuePerNewCustomer: 0,
      monthOutputVat: 0,
      monthInputVat: 0,
      quarterVatPayable: 0,
      monthBreakEvenGap,
      monthContributionMargin: 0,
      monthContributionMarginPercent: 0,
      monthGrossMarginPercent: 0,
      monthFixedCostRatio: 0,
      monthTotalCostRatio: 0,
      quarterVatHistory: [],
      monthlyProfitHistory: [],
    };
  }
}
