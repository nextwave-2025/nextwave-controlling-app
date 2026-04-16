import { NextResponse } from "next/server";
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
        amountMonthly: Number(item.amountMonthly),
      }))
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Fehler beim Laden der Fixkosten",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const note =
      typeof body.note === "string" ? body.note.trim() : "";
    const amountMonthly = Number(body.amountMonthly ?? 0);

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name ist erforderlich",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountMonthly) || amountMonthly < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ungültiger Monatsbetrag",
        },
        { status: 400 }
      );
    }

    const item = await db.fixedCost.create({
      data: {
        name,
        category: category || null,
        note: note || null,
        amountMonthly,
        active: true,
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
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Fehler beim Erstellen der Fixkosten",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const id =
      typeof body.id === "string" ? body.id.trim() : "";
    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const note =
      typeof body.note === "string" ? body.note.trim() : "";
    const amountMonthly = Number(body.amountMonthly ?? 0);
    const active =
      typeof body.active === "boolean" ? body.active : true;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "ID fehlt",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name ist erforderlich",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountMonthly) || amountMonthly < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ungültiger Monatsbetrag",
        },
        { status: 400 }
      );
    }

    const item = await db.fixedCost.update({
      where: {
        id,
      },
      data: {
        name,
        category: category || null,
        note: note || null,
        amountMonthly,
        active,
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        ...item,
        amountMonthly: Number(item.amountMonthly),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Fehler beim Aktualisieren der Fixkosten",
      },
      { status: 500 }
    );
  }
}
