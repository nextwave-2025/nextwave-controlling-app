"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/money";

type FixedCostRow = {
  id: string;
  name: string;
  category: string | null;
  amountPaid?: number;
  taxMode?: string;
  amountMonthly: number;
  active: boolean;
  note: string | null;
};

type EditingState = {
  id: string;
  name: string;
  category: string;
  amountPaid: string;
  taxMode: string;
  active: boolean;
  note: string;
} | null;

const TAX_OPTIONS = [
  { value: "gross19", label: "19 % Brutto" },
  { value: "gross7", label: "7 % Brutto" },
  { value: "exempt", label: "MwSt-frei" },
  { value: "net", label: "Netto" },
];

function calculateNetAmount(amountPaid: string, taxMode: string) {
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

function getTaxLabel(taxMode?: string) {
  switch (taxMode) {
    case "gross19":
      return "19 % Brutto";
    case "gross7":
      return "7 % Brutto";
    case "exempt":
      return "MwSt-frei";
    case "net":
      return "Netto";
    default:
      return "19 % Brutto";
  }
}

export function FixedCostsTable({ items }: { items: FixedCostRow[] }) {
  const [editing, setEditing] = useState<EditingState>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(item: FixedCostRow) {
    setEditing({
      id: item.id,
      name: item.name,
      category: item.category || "",
      amountPaid: String(item.amountPaid ?? item.amountMonthly),
      taxMode: item.taxMode || "gross19",
      active: item.active,
      note: item.note || "",
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;

    try {
      setSaving(true);

      const res = await fetch("/api/fixed-costs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editing.id,
          name: editing.name,
          category: editing.category,
          amountPaid: Number(editing.amountPaid),
          taxMode: editing.taxMode,
          active: editing.active,
          note: editing.note,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Speichern fehlgeschlagen");
      }

      alert("Fixkosten erfolgreich aktualisiert");
      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Fehler beim Speichern der Fixkosten"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string, name: string) {
    const confirmed = window.confirm(
      `Möchtest du die Fixkosten "${name}" wirklich löschen?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const res = await fetch("/api/fixed-costs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Löschen fehlgeschlagen");
      }

      alert("Fixkosten erfolgreich gelöscht");
      window.location.reload();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Fehler beim Löschen der Fixkosten"
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 text-lg font-semibold text-gray-900">Fixkosten</div>

      <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Hier wird immer der <strong>abgebuchte Betrag</strong> erfasst. Das
        System berechnet daraus automatisch den <strong>Netto-Betrag</strong> für
        dein Controlling.
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1120px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="sticky left-0 z-20 bg-white py-3 pr-4">Name</th>
              <th className="bg-white py-3 pr-4">Abgebucht</th>
              <th className="bg-white py-3 pr-4">Kategorie</th>
              <th className="bg-white py-3 pr-4">Steuerart</th>
              <th className="bg-white py-3 pr-4">Netto Controlling</th>
              <th className="bg-white py-3 pr-4">Status</th>
              <th className="bg-white py-3 pr-4">Notiz</th>
              <th className="sticky right-0 z-20 bg-white py-3 pl-4 pr-0">
                Aktion
              </th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const isEditing = editing?.id === item.id;
              const editingNet = isEditing
                ? calculateNetAmount(editing.amountPaid, editing.taxMode)
                : 0;

              return (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 text-gray-800 align-top"
                >
                  <td className="sticky left-0 z-10 bg-white py-3 pr-4 font-medium">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev
                          )
                        }
                        className="w-[170px] rounded-lg border border-gray-300 px-3 py-2"
                      />
                    ) : (
                      item.name
                    )}
                  </td>

                  <td className="bg-white py-3 pr-4">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editing.amountPaid}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev ? { ...prev, amountPaid: e.target.value } : prev
                          )
                        }
                        className="w-[120px] rounded-lg border border-gray-300 px-3 py-2"
                      />
                    ) : (
                      formatEuro(item.amountPaid ?? item.amountMonthly)
                    )}
                  </td>

                  <td className="bg-white py-3 pr-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editing.category}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev ? { ...prev, category: e.target.value } : prev
                          )
                        }
                        className="w-[130px] rounded-lg border border-gray-300 px-3 py-2"
                      />
                    ) : (
                      item.category || "-"
                    )}
                  </td>

                  <td className="bg-white py-3 pr-4">
                    {isEditing ? (
                      <select
                        value={editing.taxMode}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev ? { ...prev, taxMode: e.target.value } : prev
                          )
                        }
                        className="w-[130px] rounded-lg border border-gray-300 px-3 py-2"
                      >
                        {TAX_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      getTaxLabel(item.taxMode)
                    )}
                  </td>

                  <td className="bg-white py-3 pr-4">
                    {isEditing
                      ? formatEuro(editingNet)
                      : formatEuro(item.amountMonthly)}
                  </td>

                  <td className="bg-white py-3 pr-4">
                    {isEditing ? (
                      <select
                        value={editing.active ? "true" : "false"}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  active: e.target.value === "true",
                                }
                              : prev
                          )
                        }
                        className="w-[95px] rounded-lg border border-gray-300 px-3 py-2"
                      >
                        <option value="true">Aktiv</option>
                        <option value="false">Inaktiv</option>
                      </select>
                    ) : item.active ? (
                      "Aktiv"
                    ) : (
                      "Inaktiv"
                    )}
                  </td>

                  <td className="bg-white py-3 pr-4">
                    {isEditing ? (
                      <textarea
                        value={editing.note}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev ? { ...prev, note: e.target.value } : prev
                          )
                        }
                        className="min-h-[42px] w-[140px] rounded-lg border border-gray-300 px-3 py-2"
                      />
                    ) : (
                      item.note || "-"
                    )}
                  </td>

                  <td className="sticky right-0 z-10 bg-white py-3 pl-4 pr-0">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {saving ? "Speichert..." : "Speichern"}
                        </button>

                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800"
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Bearbeiten
                        </button>

                        <button
                          onClick={() => deleteItem(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {deletingId === item.id ? "Löscht..." : "Löschen"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
