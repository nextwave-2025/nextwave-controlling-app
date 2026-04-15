import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const items = await db.fixedCost.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
    items.map((item) => ({
  ...item,
  amount: Number(item.amount),
}))
    );
  } catch (error) {
    console.error("GET /api/fixed-costs failed", error);
    return NextResponse.json({ error: "Fixkosten konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : body.category;
    const note = typeof body.note === "string" ? body.note.trim() : body.note;
    const amountMonthly = Number(body.amountMonthly);

    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
    }

    if (!Number.isFinite(amountMonthly) || amountMonthly < 0) {
      return NextResponse.json({ error: "amountMonthly ist ungültig." }, { status: 400 });
    }

    const item = await db.fixedCost.create({
      data: {
        name,
        category: category || null,
        note: note || null,
        amountMonthly,
      },
    });

    return NextResponse.json(
      {
        ...item,
        amountMonthly: Number(item.amountMonthly),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fixed-costs failed", error);
    return NextResponse.json({ error: "Fixkosten konnten nicht gespeichert werden." }, { status: 500 });
  }
}
