import { formatEuro } from "@/lib/money";

type FixedCostRow = {
  id: string;
  name: string;
  category: string | null;
  amountMonthly: number;
  active: boolean;
  note: string | null;
};

export function FixedCostsTable({ items }: { items: FixedCostRow[] }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 text-lg font-semibold text-gray-900">Fixkosten</div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Kategorie</th>
              <th className="py-3 pr-4">Monat</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Notiz</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 text-gray-800">
                <td className="py-3 pr-4 font-medium">{item.name}</td>
                <td className="py-3 pr-4">{item.category || "-"}</td>
                <td className="py-3 pr-4">{formatEuro(item.amountMonthly)}</td>
                <td className="py-3 pr-4">{item.active ? "Aktiv" : "Inaktiv"}</td>
                <td className="py-3 pr-4">{item.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
