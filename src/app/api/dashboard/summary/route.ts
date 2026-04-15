import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/kpis";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/dashboard/summary failed", error);
    return NextResponse.json({ error: "Dashboard konnte nicht geladen werden." }, { status: 500 });
  }
}