import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Revenue Sync kommt in Step 2.",
  });
}