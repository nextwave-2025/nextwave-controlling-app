import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizeTaxMode(value: unknown) {
  if (
    value === "gross19" ||
    value === "gross7" ||
    value === "exempt" ||
    value === "net"
  ) {
    return value;
  }

  return "gross19";
}

function calculateNetAmount(amountPaid: number, taxMode: string) {
  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    return 0;
  }

  switch (taxMode) {
    case "gross19":
      return amountPaid / 1.19;
    case "gross7":
      return amountPaid / 1.07;
    case "exempt":
      return amountPaid;
    case "net":
      return amountPaid;
    default:
      return amountPaid / 1.19;
  }
}

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
        amountPaid: Number(item.amountPaid ?? 0),
        amountMonthly: Number(item.amountMonthly),
        taxMode: item.taxMode || "gross19",
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
    const amountPaid = Number(body.amountPaid ?? 0);
    const taxMode = normalizeTaxMode(body.taxMode);

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          error: "Name ist erforderlich",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ungültiger abgebuchter Betrag",
        },
        { status: 400 }
      );
    }

    const amountMonthly = calculateNetAmount(amountPaid, taxMode);

    const item = await db.fixedCost.create({
      data: {
        name,
        category: category || null,
        note: note || null,
        amountPaid,
        taxMode,
        amountMonthly,
        active: true,
      },
    });

    return NextResponse.json(
      {
        ...item,
        amountPaid: Number(item.amountPaid ?? 0),
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
    const amountPaid = Number(body.amountPaid ?? 0);
    const taxMode = normalizeTaxMode(body.taxMode);
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

    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ungültiger abgebuchter Betrag",
        },
        { status: 400 }
      );
    }

    const amountMonthly = calculateNetAmount(amountPaid, taxMode);

    const item = await db.fixedCost.update({
      where: {
        id,
      },
      data: {
        name,
        category: category || null,
        note: note || null,
        amountPaid,
        taxMode,
        amountMonthly,
        active,
      },
    });

    return NextResponse.json({
      ok: true,
      item: {
        ...item,
        amountPaid: Number(item.amountPaid ?? 0),
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
