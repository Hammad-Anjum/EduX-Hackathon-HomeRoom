import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClassroomStudents, getClassroomCheckins } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { AchievementBadge, AchievementLegend } from '../../components/AchievementBadge';

interface User { id: string; name: string; role: string; language: string }

const ALL_SUBJECTS = ['Mathematics', 'English', 'Science', 'HASS', 'The Arts'];

export default function StudentList({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [checkins, setCheckins] = useState<Record<string, any>>({});

  const ZONE_COLORS: Record<number, string> = { 1: '#6B7280', 2: '#818CF8', 3: '#FBBF24', 4: '#34D399', 5: '#F472B6' };

  useEffect(() => {
    getClassroomStudents('c1').then((res) => setStudents(res.data));
    getClassroomCheckins('c1').then((res) => {
      const map: Record<string, any> = {};
      for (const c of res.data) map[c.student_id] = c.latest;
      setCheckins(map);
    });
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('students.title')}</h1>
          <p className="text-sm text-gray-400 mt-1">Year 3 Blue — {filtered.length} students</p>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('students.search')}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />

      <div className="grid gap-4 mb-6">
        {filtered.map((student) => (
          <Link
            key={student.id}
            to={`/teacher/student/${student.id}`}
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                  {student.name.charAt(0)}
                </div>
                <span className="font-semibold text-gray-800">{student.name}</span>
                {checkins[student.id] && (
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: ZONE_COLORS[checkins[student.id].zone] || '#d1d5db' }} title={`Wellbeing: ${checkins[student.id].zone}/5`} />
                )}
              </div>
              <span className="text-indigo-600 text-sm font-medium">View</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_SUBJECTS.map((subj) => {
                const ach = student.achievements?.[subj];
                return ach ? (
                  <div key={subj} className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">{subj}:</span>
                    <AchievementBadge level={ach.achievement_level} />
                  </div>
                ) : null;
              })}
            </div>
          </Link>
        ))}
      </div>

      <AchievementLegend t={t} />
    </div>
  );
}
