type KpiCardProps = {
  title: string;
  value: string;
  hint?: string;
};

export function KpiCard({ title, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</div>
      {hint ? <div className="mt-2 text-sm text-gray-500">{hint}</div> : null}
    </div>
  );
}