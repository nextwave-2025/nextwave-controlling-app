import { NextResponse } from "next/server";

function isAuthorized(req: Request) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

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

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "https://nextwave-controlling-app-production.up.railway.app";

    const revenueRes = await fetch(`${baseUrl}/api/sync/revenue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const revenueData = await revenueRes.json();

    return NextResponse.json({
      ok: true,
      message: "Nightly sync ausgeführt",
      revenue: revenueData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Nightly sync fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
