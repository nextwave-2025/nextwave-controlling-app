"use client";

import { useState } from "react";

export function CostSyncButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    try {
      setLoading(true);

      const res = await fetch("/api/sync/costs", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Kosten Sync fehlgeschlagen");
      }

      alert("Kosten erfolgreich synchronisiert");
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Fehler beim Kosten-Sync");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Sync läuft..." : "Kosten Sync"}
    </button>
  );
}
