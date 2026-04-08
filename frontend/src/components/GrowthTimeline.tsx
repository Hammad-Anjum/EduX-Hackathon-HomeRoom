interface DataPoint {
  term: string;
  score: number;
  subject: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: '#6366f1',
  English: '#f59e0b',
  Science: '#10b981',
  HASS: '#ef4444',
  'The Arts': '#8b5cf6',
};

export default function GrowthTimeline({ data, yLabel }: { data: DataPoint[]; yLabel: string }) {
  if (!data.length) return <p className="text-gray-400 text-sm">No data yet.</p>;

  // Get unique terms (sorted) and subjects
  const terms = [...new Set(data.map((d) => d.term))].sort();
  const subjects = [...new Set(data.map((d) => d.subject))];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 500;
  const height = 250;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxScore = 100;
  const minScore = 0;

  const xScale = (i: number) => padding.left + (i / Math.max(terms.length - 1, 1)) * chartW;
  const yScale = (v: number) => padding.top + chartH - ((v - minScore) / (maxScore - minScore)) * chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={padding.left} x2={width - padding.right} y1={yScale(v)} y2={yScale(v)} stroke="#e5e7eb" strokeWidth={1} />
          <text x={padding.left - 8} y={yScale(v) + 4} textAnchor="end" className="text-[10px] fill-gray-400">{v}</text>
        </g>
      ))}

      {/* Y axis label */}
      <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90 12 ${height / 2})`} className="text-[10px] fill-gray-400">
        {yLabel}
      </text>

      {/* X axis labels */}
      {terms.map((term, i) => (
        <text key={term} x={xScale(i)} y={height - 10} textAnchor="middle" className="text-[10px] fill-gray-500">
          {term}
        </text>
      ))}

      {/* Lines per subject */}
      {subjects.map((subject) => {
        const subjectData = terms.map((term) => {
          const point = data.find((d) => d.term === term && d.subject === subject);
          return point ? point.score : null;
        });

        const color = SUBJECT_COLORS[subject] || '#8b5cf6';
        const points = subjectData
          .map((score, i) => (score !== null ? `${xScale(i)},${yScale(score)}` : null))
          .filter(Boolean)
          .join(' ');

        return (
          <g key={subject}>
            <polyline fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" points={points} />
            {subjectData.map((score, i) =>
              score !== null ? (
                <circle key={i} cx={xScale(i)} cy={yScale(score)} r={4} fill={color} stroke="white" strokeWidth={2} />
              ) : null
            )}
          </g>
        );
      })}

      {/* Legend */}
      {subjects.map((subject, i) => (
        <g key={subject} transform={`translate(${padding.left + i * 120}, ${height - 25})`}>
          <rect width={10} height={10} rx={2} fill={SUBJECT_COLORS[subject] || '#8b5cf6'} />
          <text x={14} y={9} className="text-[10px] fill-gray-600">{subject}</text>
        </g>
      ))}
    </svg>
  );
}
