"use client";

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

export function GrafikIpk({ data }: { data: { periodeKode: string; ipk: number | null }[] }) {
  const dataChart = data.map((d) => ({ periode: d.periodeKode, ipk: d.ipk }));

  if (dataChart.every((d) => d.ipk === null)) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-surface-alt/40 text-xs text-muted">
        Belum ada riwayat data IPK semester yang tercatat.
      </div>
    );
  }

  return (
    <div className="h-44 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dataChart} margin={{ top: 10, right: 15, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="colorIpk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#116e63" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#116e63" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e6ea" vertical={false} />
          <XAxis
            dataKey="periode"
            fontSize={11}
            stroke="#757f95"
            tickLine={false}
            axisLine={{ stroke: "#e3e6ea" }}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[0, 1.0, 2.0, 3.0, 4.0]}
            fontSize={11}
            stroke="#757f95"
            tickLine={false}
            axisLine={{ stroke: "#e3e6ea" }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value;
                return (
                  <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-md">
                    <p className="text-[11px] font-semibold text-muted">
                      Semester {payload[0].payload.periode}
                    </p>
                    <p className="font-heading text-sm font-bold text-primary">
                      IPK: {val !== null && val !== undefined ? Number(val).toFixed(2) : "-"}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="ipk"
            stroke="#116e63"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorIpk)"
            dot={{ r: 4, fill: "#116e63", stroke: "#ffffff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#fda31b", stroke: "#ffffff", strokeWidth: 2 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
