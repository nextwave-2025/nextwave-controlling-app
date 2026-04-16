"use client";

import { useState } from "react";

const TAX_OPTIONS = [
  { value: "gross19", label: "19 % Brutto (Standard)" },
  { value: "gross7", label: "7 % Brutto" },
  { value: "exempt", label: "MwSt-frei / ohne Vorsteuer" },
  { value: "net", label: "Netto" },
];

function calculateNetPreview(amountPaid: string, taxMode: string) {
  const value = Number(amountPaid || 0);

  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  switch (taxMode) {
    case "gross19":
      return value / 1.19;
    case "gross7":
      return value / 1.07;
    case "exempt":
      return value;
    case "net":
      return value;
    default:
      return value / 1.19;
  }
}

export function FixedCostForm() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [taxMode, setTaxMode] = useState("gross19");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const netPreview = calculateNetPreview(amountPaid, taxMode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/fixed-costs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          amountPaid: Number(amountPaid),
          taxMode,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data) {
        throw new Error(data?.error || "Speichern fehlgeschlagen");
      }

      setName("");
      setCategory("");
      setAmountPaid("");
      setTaxMode("gross19");
      setNote("");

      alert("Fixkosten erfolgreich gespeichert");
      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Fehler beim Speichern der Fixkosten"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 text-lg font-semibold text-gray-900">
        Fixkosten hinzufügen
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Telekom DSL"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Kategorie
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="z. B. Büro / Software / Kommunikation"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Abgebuchter Betrag (brutto / bezahlt)
          </label>
          <input
            type="number"
            step="0.01"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder="z. B. 65.00"
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Steuerart
          </label>
          <select
            value={taxMode}
            onChange={(e) => setTaxMode(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2"
          >
            {TAX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-gray-500">
            Standard ist 19 % Brutto. Für Railway oder andere MwSt-freie
            Belastungen bitte manuell auf „MwSt-frei“ stellen.
          </p>
        </div>

        <div className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-700 ring-1 ring-gray-200">
          Netto für Controlling:{" "}
          <strong>{netPreview.toFixed(2).replace(".", ",")} €</strong>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notiz
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="min-h-[90px] w-full rounded-xl border border-gray-300 px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand-orange px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Speichert..." : "Fixkosten speichern"}
        </button>
      </form>
    </div>
  );
}
