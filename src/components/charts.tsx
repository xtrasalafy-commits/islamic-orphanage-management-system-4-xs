"use client";

import { rupiah } from "@/lib/utils";

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = Math.max(
    1,
    segments.reduce((acc, s) => acc + s.value, 0)
  );
  const r = 44;
  const c = 2 * Math.PI * r;

  const offsets = new Array<number>(segments.length);
  let cumulative = 0;
  for (let i = 0; i < segments.length; i++) {
    offsets[i] = -cumulative;
    cumulative += (segments[i].value / total) * c;
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#e7e5e4" strokeWidth="14" />
          {segments.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={s.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={offsets[i]}
                className="transition-all duration-500"
              />
            );
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-stone-900">{centerValue}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="grid flex-1 gap-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-bold text-stone-800">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarsChart({ data }: { data: { label: string; total: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-44 items-end gap-3">
      {data.map((d, i) => {
        const h = Math.max(4, (d.total / max) * 100);
        const isLast = i === data.length - 1;
        return (
          <div key={d.label} className="group flex h-full flex-1 flex-col justify-end gap-1.5">
            <div className="relative flex h-full items-end">
              <div
                title={`${d.label}: ${rupiah(d.total)}`}
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  isLast ? "bg-pine-600" : "bg-pine-200 group-hover:bg-pine-300"
                }`}
                style={{ height: `${h}%` }}
              />
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                {rupiah(d.total)}
              </span>
            </div>
            <span className="text-center text-[10px] font-semibold text-stone-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
