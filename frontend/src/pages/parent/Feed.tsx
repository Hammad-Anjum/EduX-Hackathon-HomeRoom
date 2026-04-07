import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFeed } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import TranslateButton from '../../components/TranslateButton';

interface User { id: string; name: string; role: string; language: string }

export default function Feed({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFeed(user.id, 'parent')
      .then((res) => setUpdates(res.data))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <p className="text-gray-500">...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('feed.title')}</h1>

      {updates.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p>{t('feed.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {updates.map((update: any) => (
            <div key={update.id} className="bg-white rounded-lg shadow p-6">
              <span className="text-xs text-gray-400">
                {new Date(update.created_at).toLocaleDateString()}
              </span>

              <p className="text-gray-700 mt-2">{update.generated_content}</p>
              <TranslateButton text={update.generated_content} targetLanguage={user.language} />

              {update.home_activities?.length > 0 && (
                <div className="mt-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">{t('feed.activities')}</h3>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {update.home_activities.map((a: string, i: number) => (
                      <li key={i}>
                        {a}
                        <TranslateButton text={a} targetLanguage={user.language} className="inline-block ml-1" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {update.guided_prompts?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('feed.prompts')}</h3>
                  <div className="space-y-2">
                    {update.guided_prompts.map((prompt: string, i: number) => (
                      <div key={i} className="bg-indigo-50 rounded-lg p-3">
                        <p className="text-sm text-indigo-700">{prompt}</p>
                        <TranslateButton text={prompt} targetLanguage={user.language} />
                        <Link
                          to={`/parent/respond/${update.id}?prompt=${i}&q=${encodeURIComponent(prompt)}`}
                          className="inline-block mt-2 text-xs text-indigo-600 font-medium hover:underline"
                        >
                          {t('feed.respond')}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
