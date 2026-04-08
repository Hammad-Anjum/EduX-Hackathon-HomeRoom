const ZONE_COLORS: Record<number, string> = {
  1: '#6B7280',
  2: '#818CF8',
  3: '#FBBF24',
  4: '#34D399',
  5: '#F472B6',
};

const ZONE_LABELS: Record<number, string> = {
  1: 'Having a tough day',
  2: 'Not great',
  3: 'Doing okay',
  4: 'Feeling good',
  5: 'Feeling awesome!',
};

interface Checkin {
  id: string;
  date: string;
  zone: number;
}

export function WellbeingLegend({ t }: { t: (key: string) => string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-1">
      <p className="font-semibold text-gray-600 mb-2">{t('wellbeing.legend')}</p>
      {[1, 2, 3, 4, 5].map((z) => (
        <div key={z} className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: ZONE_COLORS[z] }} />
          <span className="text-gray-600">{t(`wellbeing.zone_${z}`)}</span>
        </div>
      ))}
    </div>
  );
}

export default function WellbeingStrip({ checkins }: { checkins: Checkin[] }) {
  if (!checkins.length) return <p className="text-gray-400 text-sm">No check-ins yet.</p>;

  // Show last 20 entries
  const recent = checkins.slice(-20);
  const circleR = 10;
  const gap = 28;
  const padding = { left: 14, top: 14, bottom: 30 };
  const width = padding.left + recent.length * gap;
  const height = padding.top + circleR * 2 + padding.bottom;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-2xl">
      {recent.map((c, i) => {
        const cx = padding.left + i * gap;
        const cy = padding.top + circleR;
        const color = ZONE_COLORS[c.zone] || '#d1d5db';
        const label = ZONE_LABELS[c.zone] || '';
        // Format date as DD/MM
        const d = new Date(c.date + 'T00:00:00');
        const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

        return (
          <g key={c.id || i}>
            <title>{dateStr} — {label}</title>
            <circle cx={cx} cy={cy} r={circleR} fill={color} />
            <text x={cx} y={height - 4} textAnchor="middle" className="text-[8px] fill-gray-400">
              {dateStr}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
