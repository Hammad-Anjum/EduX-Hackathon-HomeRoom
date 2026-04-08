import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeed, sendUpdate, deleteUpdate } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

export default function Dashboard({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUpdates = () => {
    getFeed(user.id, 'teacher').then((res) => setUpdates(res.data));
  };

  useEffect(() => { loadUpdates(); }, [user.id]);

  const handleSend = async (id: string) => {
    setActionLoading(id);
    await sendUpdate(id);
    loadUpdates();
    setActionLoading(null);
    setExpanded(null);
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    await deleteUpdate(id);
    loadUpdates();
    setActionLoading(null);
    setExpanded(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h1>
        <Link
          to="/teacher/compose"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium"
        >
          {t('dashboard.new_update')}
        </Link>
      </div>

      {updates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          <p>{t('dashboard.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((update: any) => {
            const isDraft = update.status !== 'sent';
            const isExpanded = expanded === update.id;

            return (
              <div
                key={update.id}
                className={`bg-white rounded-xl shadow-sm border transition-all ${isDraft ? 'border-amber-200 cursor-pointer hover:shadow-md' : 'border-gray-100'}`}
                onClick={() => isDraft && setExpanded(isExpanded ? null : update.id)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${update.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {update.status === 'sent' ? t('common.sent') : t('common.draft')}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(update.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{t('dashboard.notes')} {update.teacher_notes}</p>
                  <p className="text-sm text-gray-700 line-clamp-3">{update.generated_content}</p>

                  {update.status === 'sent' && (
                    <Link
                      to={`/teacher/insights/${update.id}`}
                      className="inline-block mt-3 text-indigo-600 text-sm hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {t('dashboard.view_insights')}
                    </Link>
                  )}
                </div>

                {/* Expanded draft view */}
                {isDraft && isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 rounded-b-xl" onClick={(e) => e.stopPropagation()}>
                    {update.home_activities?.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">{t('compose.activities_label')}</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {update.home_activities.map((a: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-gray-300 mt-0.5">-</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {update.guided_prompts?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 mb-1">{t('compose.prompts_label')}</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {update.guided_prompts.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-gray-300 mt-0.5">{i + 1}.</span>
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSend(update.id)}
                        disabled={actionLoading === update.id}
                        className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === update.id ? t('compose.sending') : t('compose.send')}
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/compose?edit=${update.id}`)}
                        className="bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-300"
                      >
                        {t('recommendations.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(update.id)}
                        disabled={actionLoading === update.id}
                        className="bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-sm hover:bg-red-200 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
