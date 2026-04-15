"use client";

type FixedCostFormProps = {
  onCreated?: () => void;
};

export function FixedCostForm({ onCreated }: FixedCostFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [amountMonthly, setAmountMonthly] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/fixed-costs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category: category || null,
          amountMonthly: Number(amountMonthly),
          note: note || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Fixkosten konnten nicht gespeichert werden.");
      }

      setName("");
      setCategory("");
      setAmountMonthly("");
      setNote("");
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 text-lg font-semibold text-gray-900">Fixkosten anlegen</div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
          placeholder="Name, z. B. Miete"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
          placeholder="Kategorie, z. B. Büro"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <input
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
          placeholder="Monatsbetrag netto"
          type="number"
          step="0.01"
          min="0"
          value={amountMonthly}
          onChange={(e) => setAmountMonthly(e.target.value)}
          required
        />

        <input
          className="rounded-xl border border-gray-300 px-4 py-3 outline-none"
          placeholder="Notiz"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error ? <div className="mt-3 text-sm text-red-600">{error}</div> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-xl bg-brand-orange px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Speichert..." : "Fixkosten speichern"}
      </button>
    </form>
  );
}