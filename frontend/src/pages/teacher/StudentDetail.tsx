import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStudentDetail, updateAchievement, updateSkill } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { AchievementBadge, NaplanBadge } from '../../components/AchievementBadge';

interface User { id: string; name: string; role: string; language: string }

const ACHIEVEMENT_LEVELS = ['Below', 'At', 'Above'];
const NAPLAN_BANDS = ['Needs Additional Support', 'Developing', 'Strong', 'Exceeding'];
const SKILL_LEVELS = ['Beginning', 'Developing', 'Proficient', 'Mastered'];
const SUBJECTS = ['Mathematics', 'English'];
const TERMS = ['T4-2025', 'T1-2026', 'T2-2026'];

export default function StudentDetail({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const { studentId } = useParams();
  const [detail, setDetail] = useState<any>(null);
  const [tab, setTab] = useState<'achievements' | 'skills' | 'assignments'>('achievements');

  // Edit state for achievement form
  const [editSubject, setEditSubject] = useState('Mathematics');
  const [editTerm, setEditTerm] = useState('T1-2026');
  const [editLevel, setEditLevel] = useState('At');
  const [editBand, setEditBand] = useState('Strong');
  const [editScore, setEditScore] = useState('');
  const [editComment, setEditComment] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    getStudentDetail(studentId).then((res) => setDetail(res.data));
  }, [studentId]);

  const handleSaveAchievement = async () => {
    if (!studentId) return;
    await updateAchievement(studentId, {
      subject: editSubject,
      term: editTerm,
      achievement_level: editLevel,
      naplan_band: editBand,
      score: editScore ? parseFloat(editScore) : null,
      teacher_comment: editComment,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    getStudentDetail(studentId).then((res) => setDetail(res.data));
  };

  const handleSaveSkill = async (skillName: string, subject: string, level: string) => {
    if (!studentId) return;
    await updateSkill(studentId, { subject, skill_name: skillName, level });
    getStudentDetail(studentId).then((res) => setDetail(res.data));
  };

  if (!detail) return <p className="text-gray-500">Loading...</p>;

  const tabs = [
    { key: 'achievements' as const, label: t('student.achievements') },
    { key: 'skills' as const, label: t('student.skills') },
    { key: 'assignments' as const, label: t('student.assignments') },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('student.detail')}</h1>
      <p className="text-gray-500 mb-6">ID: {studentId}</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === tb.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Achievement tab */}
      {tab === 'achievements' && (
        <div className="space-y-6">
          {/* Current records */}
          <div className="grid gap-3">
            {detail.progress?.map((p: any) => (
              <div key={p.id} className="bg-white rounded-lg shadow p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{p.subject}</span>
                    <span className="text-xs text-gray-400">{p.term}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <AchievementBadge level={p.achievement_level} size="md" />
                    {p.naplan_band && <NaplanBadge band={p.naplan_band} />}
                    {p.score != null && <span className="text-sm text-gray-500">Score: {p.score}</span>}
                  </div>
                  {p.teacher_comment && <p className="text-xs text-gray-500 mt-1">{p.teacher_comment}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Edit form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-sm mb-3">Update Achievement</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={editTerm} onChange={(e) => setEditTerm(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                {ACHIEVEMENT_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={editBand} onChange={(e) => setEditBand(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
                {NAPLAN_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <input value={editScore} onChange={(e) => setEditScore(e.target.value)} placeholder="Score (0-100)" type="number" className="border rounded px-2 py-1.5 text-sm" />
              <input value={editComment} onChange={(e) => setEditComment(e.target.value)} placeholder="Teacher comment" className="border rounded px-2 py-1.5 text-sm" />
            </div>
            <button onClick={handleSaveAchievement} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              {saved ? t('student.saved') : t('student.save')}
            </button>
          </div>
        </div>
      )}

      {/* Skills tab */}
      {tab === 'skills' && (
        <div className="bg-white rounded-lg shadow p-6">
          {detail.skills?.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const bySubject: Record<string, any[]> = {};
                for (const s of detail.skills) (bySubject[s.subject] ??= []).push(s);
                return Object.entries(bySubject).map(([subject, subjectSkills]) => (
                  <div key={subject}>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">{subject}</h4>
                    <div className="space-y-2">
                      {subjectSkills.map((skill: any) => (
                        <div key={skill.skill_name} className="flex items-center justify-between border rounded-lg p-2">
                          <span className="text-sm text-gray-700">{skill.skill_name}</span>
                          <select
                            value={skill.level}
                            onChange={(e) => handleSaveSkill(skill.skill_name, skill.subject, e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                          >
                            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No skills recorded yet.</p>
          )}
        </div>
      )}

      {/* Assignments tab */}
      {tab === 'assignments' && (
        <div className="space-y-3">
          {detail.assignments?.length > 0 ? (
            detail.assignments.map((a: any) => (
              <div key={a.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="font-medium text-sm">{a.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{a.subject}</span>
                  </div>
                  <span className="text-xs text-gray-400">{a.due_date}</span>
                </div>
                {a.result && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-indigo-600">Score: {a.result.score}</span>
                    {a.result.feedback && <p className="text-xs text-gray-500 mt-1">{a.result.feedback}</p>}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No assignments yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
