import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getClassroomStudents } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { AchievementBadge } from '../../components/AchievementBadge';

interface User { id: string; name: string; role: string; language: string }

export default function StudentList({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getClassroomStudents('c1').then((res) => setStudents(res.data));
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('students.title')}</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('students.search')}
        className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-indigo-500"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Mathematics</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">English</th>
              <th className="text-right text-xs font-medium text-gray-500 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-sm text-gray-800">{student.name}</td>
                <td className="px-4 py-3">
                  {student.achievements?.Mathematics ? (
                    <AchievementBadge level={student.achievements.Mathematics.achievement_level} />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {student.achievements?.English ? (
                    <AchievementBadge level={student.achievements.English.achievement_level} />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    to={`/teacher/student/${student.id}`}
                    className="text-indigo-600 text-sm hover:underline"
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
