import { useEffect, useState } from 'react';
import { getChildProgress } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { AchievementBadge, NaplanBadge } from '../../components/AchievementBadge';
import GrowthTimeline from '../../components/GrowthTimeline';
import SkillMatrix from '../../components/SkillMatrix';
import TranslateButton from '../../components/TranslateButton';

interface User { id: string; name: string; role: string; language: string }

export default function ChildProgress({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChildProgress(user.id)
      .then((res) => setChildren(res.data))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  if (!children.length) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <p>{t('progress.no_data')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('progress.title')}</h1>

      {children.map((child) => {
        // Get latest progress per subject for achievement cards
        const latestBySubject: Record<string, any> = {};
        for (const p of child.progress) {
          if (!latestBySubject[p.subject] || p.term > latestBySubject[p.subject].term) {
            latestBySubject[p.subject] = p;
          }
        }

        // Growth timeline data
        const growthData = child.progress
          .filter((p: any) => p.score != null)
          .map((p: any) => ({ term: p.term, score: p.score, subject: p.subject }));

        return (
          <div key={child.student_id} className="mb-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{child.student_name}</h2>

            {/* Section A: Achievement Level Cards */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('progress.achievement')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.values(latestBySubject).map((p: any) => (
                  <div key={p.subject} className="bg-white rounded-lg shadow p-5">
                    <p className="text-sm font-medium text-gray-600 mb-2">{p.subject}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <AchievementBadge level={p.achievement_level} size="md" />
                      {p.naplan_band && <NaplanBadge band={p.naplan_band} />}
                    </div>
                    {p.score != null && (
                      <p className="text-xs text-gray-400 mb-1">{t('progress.score_label')}: {p.score}</p>
                    )}
                    {p.teacher_comment && (
                      <div>
                        <p className="text-xs text-gray-500 italic">{p.teacher_comment}</p>
                        <TranslateButton text={p.teacher_comment} targetLanguage={user.language} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Section B: Growth Timeline */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('progress.growth')}</h3>
              <div className="bg-white rounded-lg shadow p-5">
                <GrowthTimeline data={growthData} yLabel={t('progress.score_label')} />
              </div>
            </div>

            {/* Section C: Skill Mastery */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('progress.skills')}</h3>
              <div className="bg-white rounded-lg shadow p-5">
                <SkillMatrix skills={child.skills} />
              </div>
            </div>

            {/* Assignments */}
            {child.assignments?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('student.assignments')}</h3>
                <div className="space-y-2">
                  {child.assignments.map((a: any) => (
                    <div key={a.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.subject} — {a.due_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-indigo-600">{a.result?.score ?? '—'}</p>
                        {a.result?.feedback && (
                          <div>
                            <p className="text-xs text-gray-500">{a.result.feedback}</p>
                            <TranslateButton text={a.result.feedback} targetLanguage={user.language} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
