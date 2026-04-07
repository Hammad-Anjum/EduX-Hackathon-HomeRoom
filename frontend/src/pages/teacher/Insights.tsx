import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInsights } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';

interface User { id: string; name: string; role: string; language: string }

export default function Insights({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const { updateId } = useParams();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!updateId) return;
    getInsights(updateId)
      .then((res) => setInsights(res.data))
      .finally(() => setLoading(false));
  }, [updateId]);

  if (loading) return <p className="text-gray-500">{t('insights.loading')}</p>;
  if (!insights) return <p className="text-gray-500">{t('insights.none')}</p>;

  const sentiment = insights.sentiment || {};

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('insights.title')}</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{insights.total_responses}</p>
          <p className="text-sm text-gray-500">{t('insights.responses')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{Math.round(insights.response_rate * 100)}%</p>
          <p className="text-sm text-gray-500">{t('insights.rate')}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-indigo-600">{insights.themes?.length || 0}</p>
          <p className="text-sm text-gray-500">{t('insights.themes_count')}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('insights.sentiment')}</h2>
        <div className="flex gap-4">
          {Object.entries(sentiment).map(([key, value]) => (
            <div key={key} className="flex-1 text-center">
              <div className="h-2 bg-gray-200 rounded-full mb-2">
                <div
                  className={`h-2 rounded-full ${key === 'positive' ? 'bg-green-500' : key === 'neutral' ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${(value as number) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 capitalize">{key}: {Math.round((value as number) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">{t('insights.summary')}</h2>
        <p className="text-gray-700">{insights.summary}</p>
      </div>

      {insights.themes?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">{t('insights.common_themes')}</h2>
          <div className="flex flex-wrap gap-2">
            {insights.themes.map((theme: string, i: number) => (
              <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
