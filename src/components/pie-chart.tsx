'use client';

// Mevcut kütüphane katalog paletine (oak/brass/spine/moss) sadık kalmak
// için harici bir grafik kütüphanesi (recharts vb.) eklemek yerine
// bağımlılıksız bir SVG pasta grafik çiziyoruz. Yeterli dilim için
// paletin farklı tonları döngüsel kullanılıyor.
const SLICE_COLORS = [
  'var(--oak)',
  'var(--brass)',
  'var(--spine)',
  'var(--moss)',
  'color-mix(in srgb, var(--oak) 55%, white)',
  'color-mix(in srgb, var(--brass) 55%, white)',
  'color-mix(in srgb, var(--spine) 55%, white)',
  'color-mix(in srgb, var(--moss) 55%, white)',
  'var(--ink)',
];

interface PieSlice {
  name: string;
  count: number;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

export function PieChart({ data }: { data: PieSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <p className="text-sm text-ink/40">Veri yok.</p>;
  }

  const cx = 100;
  const cy = 100;
  const radius = 90;
  let cumulative = 0;

  const slices = data.map((d, i) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += d.count;
    const endAngle = (cumulative / total) * 360;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const [x1, y1] = polarToCartesian(cx, cy, radius, startAngle);
    const [x2, y2] = polarToCartesian(cx, cy, radius, endAngle);
    // Tek dilim (tüm veri tek kategoride) durumunda tam daire çizilir.
    const path =
      data.length === 1
        ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...d, path, color: SLICE_COLORS[i % SLICE_COLORS.length], percent: Math.round((d.count / total) * 100) };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 200 200" className="h-40 w-40 shrink-0">
        {slices.map((s) => (
          <path key={s.name} d={s.path} fill={s.color} stroke="var(--paper-elevated)" strokeWidth="1" />
        ))}
      </svg>
      <ul className="w-full space-y-1.5">
        {slices.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate text-ink/80">{s.name}</span>
            <span className="shrink-0 text-ink/50">
              {s.count} (%{s.percent})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
