import { NextResponse } from "next/server";

export async function GET() {
  try {
    const baseUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://nextwave-controlling-app-production.up.railway.app";

    const secret = process.env.CRON_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          error: "CRON_SECRET fehlt",
        },
        { status: 500 }
      );
    }

    const res = await fetch(`${baseUrl}/api/cron/report`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json({
      ok: res.ok,
      reportResponse: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Test-Report fehlgeschlagen",
      },
      { status: 500 }
    );
  }
}
