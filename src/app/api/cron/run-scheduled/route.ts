import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) return false;

  return authHeader === `Bearer ${secret}`;
}

function getBerlinParts() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const weekday =
    parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour =
    parts.find((p) => p.type === "hour")?.value ?? "";
  const minute =
    parts.find((p) => p.type === "minute")?.value ?? "";

  return { weekday, hour, minute };
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://nextwave-controlling-app-production.up.railway.app";

    const secret = process.env.CRON_SECRET!;
    const { weekday, hour, minute } = getBerlinParts();

    const results: Record<string, unknown> = {
      berlinTime: {
        weekday,
        hour,
        minute,
      },
      revenueSync: null,
      report: null,
      skipped: [],
    };

    // Nacht-Sync: täglich um 00:00 Uhr Berlin
    if (hour === "00" && minute === "00") {
      const revenueRes = await fetch(`${baseUrl}/api/cron/nightly-sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      results.revenueSync = await revenueRes.json();
    } else {
      (results.skipped as string[]).push("nightly-sync");
    }

    // Report: Dienstag und Donnerstag um 18:00 Uhr Berlin
    const isTuesday = weekday.toLowerCase().startsWith("di");
    const isThursday = weekday.toLowerCase().startsWith("do");

    if ((isTuesday || isThursday) && hour === "18" && minute === "00") {
      const reportRes = await fetch(`${baseUrl}/api/cron/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      results.report = await reportRes.json();
    } else {
      (results.skipped as string[]).push("report");
    }

    return NextResponse.json({
      ok: true,
      ...results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduled runner fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
