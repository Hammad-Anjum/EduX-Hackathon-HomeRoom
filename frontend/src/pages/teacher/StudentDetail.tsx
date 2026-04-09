import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentDetail, updateAchievement, updateSkill, updateNaplan, updateStudentAssignmentResult, createAssignment, getStudentCheckins, logCheckin, generateRecommendations, getStudentRecommendations, updateRecommendationItem } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { AchievementBadge, NaplanBadge, AchievementLegend } from '../../components/AchievementBadge';
import WellbeingStrip, { WellbeingLegend } from '../../components/WellbeingStrip';
import WellbeingCheckinForm from '../../components/WellbeingCheckinForm';
import WithLegend from '../../components/WithLegend';

interface User { id: string; name: string; role: string; language: string }

const ACHIEVEMENT_LEVELS = ['Below', 'At', 'Above'];
const NAPLAN_BANDS = ['Needs Additional Support', 'Developing', 'Strong', 'Exceeding'];
const NAPLAN_DOMAINS = ['Reading', 'Writing', 'Spelling', 'Grammar and Punctuation', 'Numeracy'];
const SKILL_LEVELS = ['Beginning', 'Developing', 'Proficient', 'Mastered'];
const SUBJECTS = ['Mathematics', 'English', 'Science', 'HASS', 'The Arts'];
const TERMS = ['T4-2025', 'T1-2026', 'T2-2026'];

function SavedNotice({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="text-green-600 text-xs font-medium ml-2">Saved!</span>;
}

export default function StudentDetail({ user, classroomId }: { user: User; classroomId: string }) {
  const { t } = useTranslation(user.language);
  const { studentId } = useParams();
  const [detail, setDetail] = useState<any>(null);
  const [tab, setTab] = useState<'achievements' | 'naplan' | 'skills' | 'assignments' | 'wellbeing' | 'recommendations'>('achievements');
  const [wellbeingData, setWellbeingData] = useState<any>(null);
  const [savedFlag, setSavedFlag] = useState('');
  const [recs, setRecs] = useState<any>(null);
  const [recsLoading, setRecsLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Achievement form
  const [editSubject, setEditSubject] = useState('Mathematics');
  const [editTerm, setEditTerm] = useState('T1-2026');
  const [editLevel, setEditLevel] = useState('At');
  const [editScore, setEditScore] = useState('');
  const [editComment, setEditComment] = useState('');

  // NAPLAN form
  const [napDomain, setNapDomain] = useState('Reading');
  const [napBand, setNapBand] = useState('Strong');
  const [napScore, setNapScore] = useState('');
  const [napYear, setNapYear] = useState('2025');

  // Skill form
  const [newSkillSubject, setNewSkillSubject] = useState('Mathematics');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Beginning');

  // Assignment form
  const [newAssignSubject, setNewAssignSubject] = useState('Mathematics');
  const [newAssignTitle, setNewAssignTitle] = useState('');
  const [newAssignDue, setNewAssignDue] = useState('');

  // Assignment result editing
  const [editingResult, setEditingResult] = useState<string | null>(null);
  const [editResultScore, setEditResultScore] = useState('');
  const [editResultFeedback, setEditResultFeedback] = useState('');

  useEffect(() => {
    if (!studentId) return;
    getStudentDetail(studentId).then((res) => setDetail(res.data));
  }, [studentId]);

  const loadWellbeing = () => {
    if (!studentId) return;
    getStudentCheckins(studentId).then((res) => setWellbeingData(res.data)).catch(() => {});
  };

  useEffect(() => { loadWellbeing(); loadRecs(); }, [studentId]);

  const loadRecs = () => {
    if (!studentId) return;
    getStudentRecommendations(studentId).then((res) => setRecs(res.data)).catch(() => {});
  };

  const handleGenerate = async () => {
    if (!studentId) return;
    setRecsLoading(true);
    try {
      const res = await generateRecommendations(studentId);
      setRecs(res.data);
    } catch { /* fallback handled server-side */ }
    setRecsLoading(false);
  };

  const handleApproveItem = async (itemId: string, status: string, edited?: string) => {
    if (!recs) return;
    await updateRecommendationItem(recs.id, itemId, { status, edited_text: edited });
    loadRecs();
  };

  const reload = () => {
    if (!studentId) return;
    getStudentDetail(studentId).then((res) => setDetail(res.data));
    loadWellbeing();
  };

  const flashSaved = (key: string) => {
    setSavedFlag(key);
    setTimeout(() => setSavedFlag(''), 2000);
  };

  const handleSaveAchievement = async () => {
    if (!studentId) return;
    await updateAchievement(studentId, {
      subject: editSubject, term: editTerm, achievement_level: editLevel,
      score: editScore ? parseFloat(editScore) : null, teacher_comment: editComment,
    });
    flashSaved('achievement');
    reload();
  };

  const handleSaveNaplan = async () => {
    if (!studentId) return;
    await updateNaplan(studentId, {
      domain: napDomain, band: napBand,
      score: napScore ? parseInt(napScore) : null, year: parseInt(napYear),
    });
    flashSaved('naplan');
    reload();
  };

  const handleSaveSkill = async (skillName: string, subject: string, level: string) => {
    if (!studentId) return;
    await updateSkill(studentId, { subject, skill_name: skillName, level });
    reload();
  };

  const handleAddSkill = async () => {
    if (!studentId || !newSkillName.trim()) return;
    await updateSkill(studentId, { subject: newSkillSubject, skill_name: newSkillName.trim(), level: newSkillLevel });
    setNewSkillName('');
    flashSaved('skill');
    reload();
  };

  const handleCreateAssignment = async () => {
    if (!newAssignTitle.trim()) return;
    await createAssignment({
      classroom_id: classroomId, subject: newAssignSubject, title: newAssignTitle.trim(),
      due_date: newAssignDue || null,
    });
    setNewAssignTitle('');
    setNewAssignDue('');
    flashSaved('assignment');
    reload();
  };

  const handleSaveResult = async (assignmentId: string) => {
    if (!studentId) return;
    await updateStudentAssignmentResult(
      studentId, assignmentId,
      editResultScore ? parseFloat(editResultScore) : null,
      editResultFeedback,
    );
    setEditingResult(null);
    setEditResultScore('');
    setEditResultFeedback('');
    flashSaved('result');
    reload();
  };

  if (!detail) return <p className="text-gray-500 p-6">Loading...</p>;

  const latestBySubject: Record<string, any> = {};
  for (const p of detail.progress || []) {
    if (!latestBySubject[p.subject] || p.term > latestBySubject[p.subject].term) {
      latestBySubject[p.subject] = p;
    }
  }

  const tabs = [
    { key: 'achievements' as const, label: t('student.achievements') },
    { key: 'naplan' as const, label: 'NAPLAN' },
    { key: 'skills' as const, label: t('student.skills') },
    { key: 'assignments' as const, label: t('student.assignments') },
    { key: 'wellbeing' as const, label: t('wellbeing.title') },
    { key: 'recommendations' as const, label: t('recommendations.title') },
  ];

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none";
  const btnCls = "bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/teacher/students" className="text-sm text-indigo-600 hover:underline mb-2 inline-block">
          {t('students.title')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{detail?.student_name || studentId}</h1>
        <p className="text-sm text-gray-400 mt-1">{studentId}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {SUBJECTS.map((subj) => {
          const p = latestBySubject[subj];
          return (
            <div key={subj} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 mb-1.5">{subj}</p>
              {p ? (
                <div className="flex flex-col gap-1">
                  <AchievementBadge level={p.achievement_level} size="md" />
                  {p.score != null && <span className="text-xs text-gray-500 mt-1">Score: {p.score}</span>}
                </div>
              ) : (
                <span className="text-xs text-gray-300">No data</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === tb.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── ACHIEVEMENTS TAB ── */}
      {tab === 'achievements' && (
        <WithLegend legend={<AchievementLegend t={t} />}>
        <div className="space-y-6">
          {(() => {
            const bySubject: Record<string, any[]> = {};
            for (const p of detail.progress || []) (bySubject[p.subject] ??= []).push(p);
            return Object.entries(bySubject).map(([subject, records]) => (
              <div key={subject}>
                <h4 className="text-sm font-semibold text-gray-600 mb-2">{subject}</h4>
                <div className="grid gap-2">
                  {records.sort((a: any, b: any) => b.term.localeCompare(a.term)).map((p: any) => (
                    <div key={p.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <AchievementBadge level={p.achievement_level} size="md" />
                          {p.score != null && <span className="text-sm text-gray-500">Score: {p.score}</span>}
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{p.term}</span>
                      </div>
                      {p.teacher_comment && <p className="text-xs text-gray-500 mt-2">{p.teacher_comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Update Achievement <SavedNotice show={savedFlag === 'achievement'} /></h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Subject</label>
                <select value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className={inputCls}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Term</label>
                <select value={editTerm} onChange={(e) => setEditTerm(e.target.value)} className={inputCls}>{TERMS.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Level</label>
                <select value={editLevel} onChange={(e) => setEditLevel(e.target.value)} className={inputCls}>{ACHIEVEMENT_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Score (0-100)</label>
                <input value={editScore} onChange={(e) => setEditScore(e.target.value)} type="number" placeholder="Optional" className={inputCls} /></div>
              <div className="col-span-2"><label className="text-xs text-gray-400 mb-1 block">Comment</label>
                <input value={editComment} onChange={(e) => setEditComment(e.target.value)} placeholder="Optional comment..." className={inputCls} /></div>
            </div>
            <button onClick={handleSaveAchievement} className={btnCls}>{t('student.save')}</button>
          </div>
        </div>
        </WithLegend>
      )}

      {/* ── NAPLAN TAB ── */}
      {tab === 'naplan' && (
        <div className="space-y-6">
          {detail.naplan?.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Domain</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Band</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Score</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.naplan.map((n: any) => (
                    <tr key={n.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{n.domain}</td>
                      <td className="px-4 py-3"><NaplanBadge band={n.band} /></td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right font-mono">{n.score}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 text-right">{n.year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm">No NAPLAN results recorded.</p>
            </div>
          )}

          {/* NAPLAN legend */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-1">
            <p className="font-semibold text-gray-600 mb-2">{t('legend.naplan')}</p>
            {NAPLAN_BANDS.slice().reverse().map((band) => (
              <div key={band} className="flex items-center gap-2"><NaplanBadge band={band} /></div>
            ))}
          </div>

          {/* Add/Update NAPLAN form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Add / Update NAPLAN Result <SavedNotice show={savedFlag === 'naplan'} /></h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Domain</label>
                <select value={napDomain} onChange={(e) => setNapDomain(e.target.value)} className={inputCls}>{NAPLAN_DOMAINS.map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Band</label>
                <select value={napBand} onChange={(e) => setNapBand(e.target.value)} className={inputCls}>{NAPLAN_BANDS.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Score</label>
                <input value={napScore} onChange={(e) => setNapScore(e.target.value)} type="number" placeholder="e.g. 430" className={inputCls} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Year</label>
                <select value={napYear} onChange={(e) => setNapYear(e.target.value)} className={inputCls}>
                  <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                </select></div>
            </div>
            <button onClick={handleSaveNaplan} className={btnCls}>{t('student.save')}</button>
          </div>
        </div>
      )}

      {/* ── SKILLS TAB ── */}
      {tab === 'skills' && (
        <div className="space-y-5">
          {detail.skills?.length > 0 && (() => {
            const bySubject: Record<string, any[]> = {};
            for (const s of detail.skills) (bySubject[s.subject] ??= []).push(s);
            return Object.entries(bySubject).map(([subject, subjectSkills]) => (
              <div key={subject} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">{subject}</h4>
                <div className="space-y-2">
                  {subjectSkills.map((skill: any) => (
                    <div key={skill.skill_name} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-700">{skill.skill_name}</span>
                      <select value={skill.level}
                        onChange={(e) => handleSaveSkill(skill.skill_name, skill.subject, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
                        {SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()}

          {/* Add new skill */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">Add New Skill <SavedNotice show={savedFlag === 'skill'} /></h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Subject</label>
                <select value={newSkillSubject} onChange={(e) => setNewSkillSubject(e.target.value)} className={inputCls}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Skill Name</label>
                <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="e.g. Solves word problems" className={inputCls} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Level</label>
                <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value)} className={inputCls}>{SKILL_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
            </div>
            <button onClick={handleAddSkill} disabled={!newSkillName.trim()} className={`${btnCls} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('student.save')}</button>
          </div>
        </div>
      )}

      {/* ── ASSIGNMENTS TAB ── */}
      {tab === 'assignments' && (
        <div className="space-y-4">
          {detail.assignments?.length > 0 && detail.assignments.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-sm text-gray-800">{a.title}</span>
                  <span className="text-xs text-gray-400 ml-2 bg-gray-50 px-2 py-0.5 rounded">{a.subject}</span>
                </div>
                <span className="text-xs text-gray-400">{a.due_date}</span>
              </div>

              {a.result ? (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-50">
                  <span className="text-lg font-bold text-indigo-600">{a.result.score ?? '--'}</span>
                  {a.result.feedback && <p className="text-xs text-gray-500 flex-1">{a.result.feedback}</p>}
                  <button onClick={() => {
                    setEditingResult(a.id);
                    setEditResultScore(a.result.score?.toString() || '');
                    setEditResultFeedback(a.result.feedback || '');
                  }} className="text-xs text-indigo-600 hover:underline ml-auto">Edit</button>
                </div>
              ) : (
                <div className="mt-2 pt-2 border-t border-gray-50">
                  <button onClick={() => {
                    setEditingResult(a.id);
                    setEditResultScore('');
                    setEditResultFeedback('');
                  }} className="text-xs text-indigo-600 hover:underline">Add mark</button>
                </div>
              )}

              {editingResult === a.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 items-end">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Score</label>
                    <input value={editResultScore} onChange={(e) => setEditResultScore(e.target.value)} type="number" placeholder="0-100" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Feedback</label>
                    <input value={editResultFeedback} onChange={(e) => setEditResultFeedback(e.target.value)} placeholder="Optional feedback" className={inputCls} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveResult(a.id)} className={btnCls}>{t('student.save')}</button>
                    <button onClick={() => setEditingResult(null)} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Create assignment */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-sm text-gray-700 mb-4">{t('student.add_assignment')} <SavedNotice show={savedFlag === 'assignment'} /></h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div><label className="text-xs text-gray-400 mb-1 block">Subject</label>
                <select value={newAssignSubject} onChange={(e) => setNewAssignSubject(e.target.value)} className={inputCls}>{SUBJECTS.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Title</label>
                <input value={newAssignTitle} onChange={(e) => setNewAssignTitle(e.target.value)} placeholder="e.g. Spelling Test Wk 5" className={inputCls} /></div>
              <div><label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                <input value={newAssignDue} onChange={(e) => setNewAssignDue(e.target.value)} type="date" className={inputCls} /></div>
            </div>
            <button onClick={handleCreateAssignment} disabled={!newAssignTitle.trim()} className={`${btnCls} disabled:opacity-50 disabled:cursor-not-allowed`}>{t('student.save')}</button>
          </div>
        </div>
      )}

      {/* ── WELLBEING TAB ── */}
      {tab === 'wellbeing' && (
        <WithLegend legend={<WellbeingLegend t={t} />}>
        <div className="space-y-5">
          {/* Trend */}
          {wellbeingData && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-1">
                <span className={`text-sm font-medium ${
                  wellbeingData.trend === 'improving' ? 'text-green-600' :
                  wellbeingData.trend === 'declining' ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {wellbeingData.trend === 'improving' ? t('wellbeing.trend_improving') :
                   wellbeingData.trend === 'declining' ? t('wellbeing.trend_declining') :
                   t('wellbeing.trend_steady')}
                </span>
              </div>
              <p className="text-xs text-gray-400">{wellbeingData.trend_message}</p>
            </div>
          )}

          {/* Strip */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Last 20 School Days</h4>
            <WellbeingStrip checkins={wellbeingData?.checkins || []} />
          </div>

          {/* Check-in form */}
          <WellbeingCheckinForm
            t={t}
            onSubmit={async (zone, note) => {
              if (!studentId) return;
              await logCheckin(studentId, { zone, teacher_note: note, classroom_id: classroomId });
              loadWellbeing();
            }}
          />

          {/* Recent notes (teacher-only) */}
          {wellbeingData?.checkins?.some((c: any) => c.teacher_note) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h4 className="text-sm font-semibold text-gray-600 mb-3">{t('wellbeing.recent_notes')}</h4>
              <div className="space-y-2">
                {wellbeingData.checkins
                  .filter((c: any) => c.teacher_note)
                  .reverse()
                  .slice(0, 10)
                  .map((c: any) => (
                    <div key={c.id} className="flex items-start gap-2 text-xs">
                      <span className="text-gray-400 whitespace-nowrap">{c.date}</span>
                      <span className="text-gray-600">{c.teacher_note}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </div>
        </WithLegend>
      )}

      {/* ── RECOMMENDATIONS TAB ── */}
      {tab === 'recommendations' && (
        <div className="space-y-5">
          {/* Generate / Regenerate button */}
          <div className="flex items-center gap-3">
            <button onClick={handleGenerate} disabled={recsLoading}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {recsLoading ? t('recommendations.generating') : recs ? t('recommendations.regenerate') : t('recommendations.generate')}
            </button>
            {recs && !recs.llm_available && (
              <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg">{t('recommendations.llm_fallback')}</span>
            )}
          </div>

          {recs ? (
            <>
              {/* Wellbeing warning */}
              {recs.wellbeing_flag === 'declining' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  {t('recommendations.wellbeing_warning')}
                </div>
              )}

              {/* Summary (teacher-only) */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t('recommendations.summary')}</h4>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t('recommendations.teacher_only')}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{recs.summary}</p>
              </div>

              {/* Per-subject recommendations */}
              {recs.subjects?.map((subj: any) => (
                <div key={subj.subject} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">{subj.subject}</h4>
                  <div className="space-y-3">
                    {subj.items?.map((item: any) => (
                      <div key={item.id} className={`rounded-lg p-3 ${item.status === 'approved' ? 'bg-green-50 border border-green-200' : item.status === 'hidden' ? 'bg-gray-50 border border-gray-200 opacity-50' : 'bg-gray-50 border border-gray-200'}`}>
                        {editingItem === item.id ? (
                          <div className="space-y-2">
                            <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} />
                            <div className="flex gap-2">
                              <button onClick={() => { handleApproveItem(item.id, 'approved', editText); setEditingItem(null); }}
                                className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700">{t('recommendations.approve')}</button>
                              <button onClick={() => setEditingItem(null)}
                                className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-700 mb-2">{item.edited_text || item.text}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                item.status === 'approved' ? 'bg-green-100 text-green-700' :
                                item.status === 'hidden' ? 'bg-gray-200 text-gray-500' :
                                'bg-gray-100 text-gray-500'
                              }`}>{t(`recommendations.${item.status}`)}</span>
                              {item.status !== 'approved' && (
                                <button onClick={() => handleApproveItem(item.id, 'approved')}
                                  className="text-xs text-green-600 hover:underline">{t('recommendations.approve')}</button>
                              )}
                              {item.status !== 'hidden' && (
                                <button onClick={() => handleApproveItem(item.id, 'hidden')}
                                  className="text-xs text-gray-400 hover:underline">{t('recommendations.hide')}</button>
                              )}
                              <button onClick={() => { setEditingItem(item.id); setEditText(item.edited_text || item.text); }}
                                className="text-xs text-indigo-600 hover:underline">{t('recommendations.edit')}</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <p className="text-gray-400 text-sm">{t('recommendations.no_data')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
