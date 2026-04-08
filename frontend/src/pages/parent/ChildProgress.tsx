import { useEffect, useState } from 'react';
import { getChildProgress, getChildRecommendations } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { AchievementBadge, NaplanBadge, AchievementLegend } from '../../components/AchievementBadge';
import GrowthTimeline from '../../components/GrowthTimeline';
import SkillMatrix, { SkillLegend } from '../../components/SkillMatrix';
import TranslateButton from '../../components/TranslateButton';
import { WellbeingLegend } from '../../components/WellbeingStrip';
import WithLegend from '../../components/WithLegend';

interface User { id: string; name: string; role: string; language: string }

const ZONE_COLORS: Record<number, string> = { 1: '#6B7280', 2: '#818CF8', 3: '#FBBF24', 4: '#34D399', 5: '#F472B6' };
const ZONE_LABELS: Record<number, string> = { 1: 'wellbeing.zone_1', 2: 'wellbeing.zone_2', 3: 'wellbeing.zone_3', 4: 'wellbeing.zone_4', 5: 'wellbeing.zone_5' };

function WeeklySummary({ checkins, t }: { checkins: { date: string; zone: number }[]; t: (k: string) => string }) {
  // Group checkins into ISO weeks
  const weeks: Record<string, number[]> = {};
  for (const c of checkins) {
    const d = new Date(c.date + 'T00:00:00');
    // Get Monday of the week
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const key = monday.toISOString().slice(0, 10);
    (weeks[key] ??= []).push(c.zone);
  }

  const sortedWeeks = Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-3">
      {sortedWeeks.map(([weekStart, zones]) => {
        const avg = Math.round(zones.reduce((a, b) => a + b, 0) / zones.length);
        const color = ZONE_COLORS[avg] || '#d1d5db';
        const endDate = new Date(weekStart + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 4);
        const label = `${new Date(weekStart + 'T00:00:00').getDate()}/${new Date(weekStart + 'T00:00:00').getMonth() + 1} — ${endDate.getDate()}/${endDate.getMonth() + 1}`;

        return (
          <div key={weekStart} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '33' }}>
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{t(ZONE_LABELS[avg])}</p>
              <p className="text-xs text-gray-400">{label} — {zones.length} check-in{zones.length > 1 ? 's' : ''}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ChildProgress({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'achievements' | 'naplan' | 'growth' | 'skills' | 'assignments' | 'wellbeing' | 'recommendations'>('achievements');
  const [childRecs, setChildRecs] = useState<any[]>([]);

  useEffect(() => {
    getChildProgress(user.id)
      .then((res) => setChildren(res.data))
      .finally(() => setLoading(false));
    getChildRecommendations(user.id)
      .then((res) => setChildRecs(res.data || []))
      .catch(() => {});
  }, [user.id]);

  if (loading) return <p className="text-gray-500 p-6">Loading...</p>;

  if (!children.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
        <p className="text-lg">{t('progress.no_data')}</p>
      </div>
    );
  }

  const tabs = [
    { key: 'achievements' as const, label: t('progress.achievement') },
    { key: 'naplan' as const, label: t('progress.naplan') },
    { key: 'growth' as const, label: t('progress.growth') },
    { key: 'skills' as const, label: t('progress.skills') },
    { key: 'assignments' as const, label: t('student.assignments') },
    { key: 'wellbeing' as const, label: t('wellbeing.title') },
    { key: 'recommendations' as const, label: t('recommendations.title') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('progress.title')}</h1>

      {children.map((child) => {
        const latestBySubject: Record<string, any> = {};
        for (const p of child.progress) {
          if (!latestBySubject[p.subject] || p.term > latestBySubject[p.subject].term) {
            latestBySubject[p.subject] = p;
          }
        }

        const growthData = child.progress
          .filter((p: any) => p.score != null)
          .map((p: any) => ({ term: p.term, score: p.score, subject: p.subject }));

        return (
          <div key={child.student_id}>
            {/* Child header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold">
                {child.student_name.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold text-gray-700">{child.student_name}</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
              {tabs.map((tb) => (
                <button key={tb.key} onClick={() => setTab(tb.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${tab === tb.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                  {tb.label}
                </button>
              ))}
            </div>

            {/* ── ACHIEVEMENTS ── */}
            {tab === 'achievements' && (
              <WithLegend legend={<AchievementLegend t={t} />}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.values(latestBySubject).map((p: any) => (
                    <div key={p.subject} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                      <p className="text-xs font-medium text-gray-400 mb-2">{p.subject}</p>
                      <AchievementBadge level={p.achievement_level} size="md" />
                      {p.score != null && (
                        <p className="text-xs text-gray-400 mt-2">{t('progress.score_label')}: {p.score}</p>
                      )}
                      {p.teacher_comment && (
                        <div className="mt-2 pt-2 border-t border-gray-50">
                          <p className="text-xs text-gray-500 italic leading-relaxed">{p.teacher_comment}</p>
                          <TranslateButton text={p.teacher_comment} targetLanguage={user.language} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </WithLegend>
            )}

            {/* ── NAPLAN ── */}
            {tab === 'naplan' && (
              <div>
                {child.naplan?.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">{t('progress.naplan_domain')}</th>
                          <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">{t('progress.naplan_band')}</th>
                          <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">{t('progress.naplan_score')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {child.naplan.map((n: any) => (
                          <tr key={n.id}>
                            <td className="px-4 py-3 text-sm text-gray-700">{n.domain}</td>
                            <td className="px-4 py-3"><NaplanBadge band={n.band} /></td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right font-mono">{n.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                    <p className="text-gray-400 text-sm">{t('progress.no_data')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── GROWTH ── */}
            {tab === 'growth' && (
              <div>
                {growthData.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <GrowthTimeline data={growthData} yLabel={t('progress.score_label')} />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                    <p className="text-gray-400 text-sm">{t('progress.no_data')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── SKILLS ── */}
            {tab === 'skills' && (
              <WithLegend legend={<SkillLegend t={t} />}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <SkillMatrix skills={child.skills} targetLanguage={user.language} />
                </div>
              </WithLegend>
            )}

            {/* ── ASSIGNMENTS ── */}
            {tab === 'assignments' && (
              <div className="space-y-2">
                {child.assignments?.length > 0 ? (
                  child.assignments.map((a: any) => (
                    <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{a.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.subject} -- {a.due_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{a.result?.score ?? '--'}</p>
                        {a.result?.feedback && (
                          <div className="max-w-xs">
                            <p className="text-xs text-gray-500">{a.result.feedback}</p>
                            <TranslateButton text={a.result.feedback} targetLanguage={user.language} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                    <p className="text-gray-400 text-sm">{t('progress.no_data')}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── WELLBEING ── */}
            {tab === 'wellbeing' && (
              <WithLegend legend={<WellbeingLegend t={t} />}>
              <div className="space-y-4">
                {child.wellbeing && child.wellbeing.checkins?.length > 0 ? (
                  <>
                    {/* Trend summary */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-sm font-medium ${
                          child.wellbeing.trend === 'improving' ? 'text-green-600' :
                          child.wellbeing.trend === 'declining' ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {child.wellbeing.trend === 'improving' ? t('wellbeing.trend_improving') :
                           child.wellbeing.trend === 'declining' ? t('wellbeing.trend_declining') :
                           t('wellbeing.trend_steady')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{child.wellbeing.trend_message}</p>
                    </div>

                    {/* Weekly summary blocks */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <h4 className="text-sm font-semibold text-gray-600 mb-4">{t('wellbeing.weekly_summary')}</h4>
                      <WeeklySummary checkins={child.wellbeing.checkins} t={t} />
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                    <p className="text-gray-400 text-sm">{t('wellbeing.no_data')}</p>
                  </div>
                )}
              </div>
              </WithLegend>
            )}

            {/* ── RECOMMENDATIONS ── */}
            {tab === 'recommendations' && (() => {
              const childRec = childRecs.find((r: any) => r.student_id === child.student_id);
              const hasRecs = childRec?.subjects?.length > 0;
              return (
                <div className="space-y-4">
                  {hasRecs ? (
                    childRec.subjects.map((subj: any) => (
                      <div key={subj.subject} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3">{subj.subject}</h4>
                        <div className="space-y-2">
                          {subj.items.map((item: any, i: number) => (
                            <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-gray-700">{item.text}</p>
                              <TranslateButton text={item.text} targetLanguage={user.language} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
                      <p className="text-gray-400 text-sm">{t('recommendations.no_data')}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
