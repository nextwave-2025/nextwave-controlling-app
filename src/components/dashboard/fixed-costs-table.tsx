"use client";

import React from "react";

export type FixedCost = {
  id: string;
  name: string;
  category: string;
  amount: number;
  note?: string | null;
  vatType?: string;
};

type FixedCostsTableProps = {
  items: FixedCost[];
  onEdit: (item: FixedCost) => void;
  onDelete: (item: FixedCost) => void;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function FixedCostsTable({
  items,
  onEdit,
  onDelete,
}: FixedCostsTableProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          Fixkosten Übersicht
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Alle gespeicherten Fixkosten auf einen Blick.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-sm text-neutral-500">
          Noch keine Fixkosten vorhanden.
        </div>
      ) : (
        <div className="max-h-[620px] overflow-y-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-neutral-200">
                <th className="border-b border-neutral-200 bg-white px-5 py-3 text-left text-sm font-semibold text-neutral-700">
                  Name
                </th>
                <th className="border-b border-neutral-200 bg-white px-5 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Abgebucht
                </th>
                <th className="border-b border-neutral-200 bg-white px-5 py-3 text-left text-sm font-semibold text-neutral-700">
                  Kategorie
                </th>
                <th className="border-b border-neutral-200 bg-white px-5 py-3 text-left text-sm font-semibold text-neutral-700 whitespace-nowrap">
                  Aktion
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-neutral-50/80"
                >
                  <td className="border-b border-neutral-100 px-5 py-4 align-top">
                    <div className="min-w-[220px]">
                      <div className="text-sm font-medium text-neutral-900">
                        {item.name}
                      </div>
                      {item.note ? (
                        <div className="mt-1 line-clamp-2 text-xs text-neutral-500">
                          {item.note}
                        </div>
                      ) : null}
                    </div>
                  </td>

                  <td className="border-b border-neutral-100 px-5 py-4 align-top whitespace-nowrap">
                    <div className="text-sm font-semibold text-neutral-900">
                      {formatCurrency(item.amount)}
                    </div>
                  </td>

                  <td className="border-b border-neutral-100 px-5 py-4 align-top">
                    <span className="inline-flex max-w-[160px] truncate rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {item.category}
                    </span>
                  </td>

                  <td className="border-b border-neutral-100 px-5 py-4 align-top">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Bearbeiten
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
