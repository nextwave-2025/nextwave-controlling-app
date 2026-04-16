import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/kpis";
import { formatEuro } from "@/lib/money";

function isAuthorized(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) return false;

  return authHeader === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const summary = await getDashboardSummary();

    const report = {
      title: "NEXTWAVE Controlling Report",
      generatedAt: new Date().toISOString(),
      metrics: {
        todayRevenue: formatEuro(summary.todayRevenue),
        monthRevenue: formatEuro(summary.monthRevenue),
        monthFixedCosts: formatEuro(summary.monthFixedCosts),
        monthVariableCosts: formatEuro(summary.monthVariableCosts),
        monthTotalCosts: formatEuro(summary.monthTotalCosts),
        monthProfit: formatEuro(summary.monthProfit),
        monthNewCustomers: summary.monthNewCustomers,
        averageRevenuePerNewCustomer: formatEuro(
          summary.averageRevenuePerNewCustomer
        ),
        monthOutputVat: formatEuro(summary.monthOutputVat),
        monthInputVat: formatEuro(summary.monthInputVat),
        quarterVatPayable: formatEuro(summary.quarterVatPayable),
        monthBreakEvenGap: formatEuro(summary.monthBreakEvenGap),
      },
      status: {
        breakEvenReached: summary.monthBreakEvenGap <= 0,
        profitPositive: summary.monthProfit >= 0,
      },
    };

    return NextResponse.json({
      ok: true,
      message: "Report erfolgreich erstellt",
      report,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Report-Erstellung fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
