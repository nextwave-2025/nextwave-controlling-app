import { formatEuro } from "@/lib/money";

export function BreakEvenCard({ gap }: { gap: number }) {
  const covered = gap <= 0;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="text-sm font-medium text-gray-500">Break-even Status</div>
      <div className="mt-3 text-2xl font-bold text-gray-900">
        {covered ? "Kosten gedeckt" : `Es fehlen ${formatEuro(gap)}`}
      </div>
      <div className="mt-2 text-sm text-gray-500">
        {covered
          ? "Der aktuelle Monatsumsatz deckt bereits die bisherige Kostenbasis."
          : "So viel Umsatz fehlt aktuell noch, um die Monatskosten zu decken."}
      </div>
    </div>
  );
}