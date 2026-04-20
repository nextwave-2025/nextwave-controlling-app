import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { getDashboardSummary } from "@/lib/kpis";
import { formatEuro, toNumber } from "@/lib/money";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { BreakEvenCard } from "@/components/dashboard/break-even-card";
import { RevenueCostChart } from "@/components/dashboard/revenue-cost-chart";
import { FixedCostsTable } from "@/components/dashboard/fixed-costs-table";
import { FixedCostForm } from "@/components/dashboard/fixed-cost-form";
import { RevenueSyncButton } from "@/components/dashboard/revenue-sync-button";
import { CostSyncButton } from "@/components/dashboard/cost-sync-button";
import LogoutButton from "@/components/logout-button";

export const dynamic = "force-dynamic";

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")} %`;
}

async function getMonthlyChartData() {
  try {
    const revenueDocs = await db.syncedInvoice.findMany({
      orderBy: {
        invoiceDate: "asc",
      },
      select: {
        invoiceDate: true,
        netAmount: true,
      },
    });

    const map = new Map<string, { label: string; revenue: number; costs: number }>();

    for (const doc of revenueDocs) {
      const label = `${doc.invoiceDate.getFullYear()}-${String(
        doc.invoiceDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const existing = map.get(label) || { label, revenue: 0, costs: 0 };
      existing.revenue += toNumber(doc.netAmount);
      map.set(label, existing);
    }

    return Array.from(map.values());
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [summary, fixedCosts, chartData] = await Promise.all([
    getDashboardSummary(),

    db.fixedCost.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        category: true,
        amountMonthly: true,
        active: true,
        note: true,
        amountPaid: true,
        taxMode: true,
      },
    }),

    getMonthlyChartData(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-orange">
              NEXTWAVE
            </div>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Controlling Dashboard
            </h1>

            <p className="mt-2 max-w-3xl text-gray-600">
              Täglicher Blick auf Umsatz, Kosten, Gewinn, Neukunden, Marge und Steuer.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            <div className="text-sm text-gray-600">
              Eingeloggt als:{" "}
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <RevenueSyncButton />
              <CostSyncButton />
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Umsatz Monat" value={formatEuro(summary.monthRevenue)} />
          <KpiCard
            title="Gewinn / Verlust Monat"
            value={formatEuro(summary.monthProfit)}
          />
          <KpiCard
            title="Deckungsbeitrag Monat"
            value={formatEuro(summary.monthContributionMargin)}
          />
          <KpiCard
            title="Deckungsbeitragsmarge"
            value={formatPercent(summary.monthContributionMarginPercent)}
          />

          <KpiCard
            title="Variable Kosten Monat"
            value={formatEuro(summary.monthVariableCosts)}
          />
          <KpiCard
            title="Fixkosten Monat"
            value={formatEuro(summary.monthFixedCosts)}
          />
          <KpiCard
            title="Handelsspanne"
            value={formatPercent(summary.monthGrossMarginPercent)}
          />
          <KpiCard
            title="Neukunden Monat"
            value={String(summary.monthNewCustomers)}
          />

          <KpiCard
            title="Fixkostenquote"
            value={formatPercent(summary.monthFixedCostRatio)}
          />
          <KpiCard
            title="Gesamtkostenquote"
            value={formatPercent(summary.monthTotalCostRatio)}
          />
          <KpiCard
            title="Ø Umsatz pro Neukunde"
            value={formatEuro(summary.averageRevenuePerNewCustomer)}
          />
          <KpiCard
            title="Umsatz heute"
            value={formatEuro(summary.todayRevenue)}
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RevenueCostChart data={chartData} />
          </div>

          <div>
            <BreakEvenCard gap={summary.monthBreakEvenGap} />

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm font-medium text-gray-500">Steuerübersicht</div>

              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Umsatzsteuer Monat</span>
                  <strong>{formatEuro(summary.monthOutputVat)}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Vorsteuer Monat</span>
                  <strong>{formatEuro(summary.monthInputVat)}</strong>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 pt-2 text-base">
                  <span>Geschätzte Zahllast Quartal</span>
                  <strong>{formatEuro(summary.quarterVatPayable)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="text-sm font-medium text-gray-500">
                Zahllast letzte Quartale
              </div>

              <div className="mt-3 space-y-3">
                {summary.quarterVatHistory.length > 0 ? (
                  summary.quarterVatHistory.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between border-b border-gray-100 pb-2 text-sm last:border-b-0 last:pb-0"
                    >
                      <span className="text-gray-700">{item.label}</span>
                      <strong className="text-gray-900">
                        {formatEuro(item.payable)}
                      </strong>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">
                    Keine Quartalsdaten vorhanden.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="text-sm font-medium text-gray-500">
              Gewinn / Verlust letzte Monate
            </div>

            <div className="mt-3 space-y-3">
              {summary.monthlyProfitHistory.length > 0 ? (
                summary.monthlyProfitHistory.map((item) => (
                  <div
                    key={item.label}
                    className="grid grid-cols-[1fr_auto] gap-3 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {item.label}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Umsatz {formatEuro(item.revenue)} · Variable Kosten{" "}
                        {formatEuro(item.variableCosts)} · Fixkosten{" "}
                        {formatEuro(item.fixedCosts)}
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-gray-900">
                      {formatEuro(item.profit)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500">
                  Keine Monatsdaten vorhanden.
                </div>
              )}
            </div>
          </div>

          <FixedCostForm />
        </div>

        <div className="mt-4">
          <FixedCostsTable
            items={fixedCosts.map((item) => ({
              ...item,
              amountPaid: Number(item.amountPaid ?? 0),
              amountMonthly: Number(item.amountMonthly),
              taxMode: item.taxMode || "gross19",
            }))}
          />
        </div>
      </div>
    </main>
  );
}
