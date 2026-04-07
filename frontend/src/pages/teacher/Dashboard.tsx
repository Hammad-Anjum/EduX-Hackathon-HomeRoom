import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeed } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

export default function Dashboard({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    getFeed(user.id, 'teacher').then((res) => setUpdates(res.data));
  }, [user.id]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
        <Link
          to="/teacher/compose"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          {t('dashboard.new_update')}
        </Link>
      </div>

      {updates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p>{t('dashboard.empty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update: any) => (
            <div key={update.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-1 rounded ${update.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {update.status === 'sent' ? t('common.sent') : t('common.draft')}
                </span>
                <span className="text-xs text-gray-400">{new Date(update.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{t('dashboard.notes')} {update.teacher_notes}</p>
              <p className="text-gray-700 line-clamp-3">{update.generated_content}</p>
              {update.status === 'sent' && (
                <Link
                  to={`/teacher/insights/${update.id}`}
                  className="inline-block mt-3 text-indigo-600 text-sm hover:underline"
                >
                  {t('dashboard.view_insights')}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
