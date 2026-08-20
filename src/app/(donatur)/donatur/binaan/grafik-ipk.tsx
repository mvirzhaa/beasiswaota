"use client";

import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function GrafikIpk({ data }: { data: { periodeKode: string; ipk: number | null }[] }) {
  const dataChart = data.map((d) => ({ periode: d.periodeKode, ipk: d.ipk }));

  if (dataChart.every((d) => d.ipk === null)) {
    return <p className="text-xs text-muted">Belum ada data IPK.</p>;
  }

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataChart} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periode" fontSize={11} />
          <YAxis domain={[0, 4]} fontSize={11} />
          <Tooltip />
          <Line type="monotone" dataKey="ipk" stroke="#000000" strokeWidth={2} connectNulls dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
