"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type RevenueCostChartProps = {
  data: Array<{
    label: string;
    revenue: number;
    costs: number;
  }>;
};

export function RevenueCostChart({ data }: RevenueCostChartProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="mb-4 text-lg font-semibold text-gray-900">Umsatz vs. Kosten</div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#f15124" strokeWidth={3} />
            <Line type="monotone" dataKey="costs" stroke="#111827" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}