"use client";

import { useState } from "react";

export function RevenueSyncButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    try {
      setLoading(true);

      const res = await fetch("/api/sync/revenue", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Umsatz Sync fehlgeschlagen");
      }

      alert("Umsatz erfolgreich synchronisiert");
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Fehler beim Sync");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="rounded-xl bg-brand-orange px-4 py-3 font-semibold text-white disabled:opacity-60"
    >
      {loading ? "Sync läuft..." : "Umsatz Sync"}
    </button>
  );
}
