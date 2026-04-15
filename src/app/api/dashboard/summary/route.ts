import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const latest = await prisma.revenueSync.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      summary: {
        revenueTodayNet: latest?.revenueTodayNet ?? 0,
        revenueMonthNet: latest?.revenueMonthNet ?? 0,
        costsMonth: 0,
        profitMonth: (latest?.revenueMonthNet ?? 0) - 0,
        fixedCostsMonth: 0,
        variableCostsMonth: 0,
        newCustomersMonth: latest?.newCustomersMonth ?? 0,
        avgRevenuePerNewCustomer: latest?.avgRevenuePerNewCustomer ?? 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 }
    );
  }
}
