const COLORS: Record<string, string> = {
  Below: 'bg-amber-100 text-amber-700 border-amber-300',
  At: 'bg-green-100 text-green-700 border-green-300',
  Above: 'bg-blue-100 text-blue-700 border-blue-300',
};

const NAPLAN_COLORS: Record<string, string> = {
  'Exceeding': 'bg-blue-50 text-blue-600',
  'Strong': 'bg-green-50 text-green-600',
  'Developing': 'bg-amber-50 text-amber-600',
  'Needs Additional Support': 'bg-red-50 text-red-600',
};

interface Props {
  level: string;
  size?: 'sm' | 'md';
}

export function AchievementBadge({ level, size = 'sm' }: Props) {
  const cls = COLORS[level] || 'bg-gray-100 text-gray-600 border-gray-300';
  const pad = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-block rounded-full border font-medium ${cls} ${pad}`}>
      {level}
    </span>
  );
}

export function AchievementLegend({ t }: { t: (key: string) => string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-3">
      <p className="font-semibold text-gray-600">{t('legend.title')}</p>
      <div>
        <p className="font-medium text-gray-500 mb-1">{t('legend.achievement')}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-amber-300 border border-amber-400" /><span className="text-gray-600">{t('legend.achievement.below')}</span></div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-green-300 border border-green-400" /><span className="text-gray-600">{t('legend.achievement.at')}</span></div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-blue-300 border border-blue-400" /><span className="text-gray-600">{t('legend.achievement.above')}</span></div>
        </div>
      </div>
      <div>
        <p className="font-medium text-gray-500 mb-1">{t('legend.naplan')}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-blue-200" /><span className="text-gray-600">{t('legend.naplan.exceeding')}</span></div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-green-200" /><span className="text-gray-600">{t('legend.naplan.strong')}</span></div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-amber-200" /><span className="text-gray-600">{t('legend.naplan.developing')}</span></div>
          <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-red-200" /><span className="text-gray-600">{t('legend.naplan.needs')}</span></div>
        </div>
      </div>
    </div>
  );
}

export function NaplanBadge({ band }: { band: string }) {
  const cls = NAPLAN_COLORS[band] || 'bg-gray-50 text-gray-500';
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
      {band}
    </span>
  );
}
