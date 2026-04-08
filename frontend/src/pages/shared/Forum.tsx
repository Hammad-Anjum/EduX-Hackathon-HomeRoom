import { useEffect, useState } from 'react';
import { getForumPosts, getForumPost, createForumPost, replyToForumPost } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import TranslateButton from '../../components/TranslateButton';

interface User { id: string; name: string; role: string; language: string }

export default function Forum({ user }: { user: User }) {
  const { t } = useTranslation(user.language);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const loadPosts = () => {
    getForumPosts().then((res) => setPosts(res.data));
  };

  useEffect(() => { loadPosts(); }, []);

  const openPost = async (postId: string) => {
    const res = await getForumPost(postId);
    setSelectedPost(res.data);
  };

  const handleNewPost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setPosting(true);
    await createForumPost(user.id, newTitle.trim(), newBody.trim());
    setNewTitle('');
    setNewBody('');
    setShowNew(false);
    setPosting(false);
    loadPosts();
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedPost) return;
    setPosting(true);
    const res = await replyToForumPost(selectedPost.id, user.id, replyText.trim());
    setSelectedPost(res.data);
    setReplyText('');
    setPosting(false);
    loadPosts();
  };

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none";

  // Thread view
  if (selectedPost) {
    return (
      <div>
        <button onClick={() => setSelectedPost(null)} className="text-sm text-indigo-600 hover:underline mb-4 inline-block">
          {t('forum.back')}
        </button>

        {/* Original post */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              selectedPost.author_role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
            }`}>
              {selectedPost.author_name?.charAt(0)}
            </div>
            <span className="text-sm font-medium text-gray-700">{selectedPost.author_name}</span>
            {selectedPost.author_role === 'teacher' && (
              <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{t('forum.teacher')}</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{new Date(selectedPost.created_at).toLocaleDateString()}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{selectedPost.title}</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{selectedPost.body}</p>
          <TranslateButton text={`${selectedPost.title}. ${selectedPost.body}`} targetLanguage={user.language} />
        </div>

        {/* Replies */}
        <div className="space-y-3 mb-4">
          {(selectedPost.replies || []).map((reply: any) => (
            <div key={reply.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 ml-6">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  reply.author_role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                }`}>
                  {reply.author_name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{reply.author_name}</span>
                {reply.author_role === 'teacher' && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{t('forum.teacher')}</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{new Date(reply.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-600">{reply.body}</p>
              <TranslateButton text={reply.body} targetLanguage={user.language} />
            </div>
          ))}
        </div>

        {/* Reply form */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 ml-6">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t('forum.reply_placeholder')}
            className={`${inputCls} h-20 mb-2`}
          />
          <button
            onClick={handleReply}
            disabled={posting || !replyText.trim()}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {posting ? t('forum.posting') : t('forum.reply')}
          </button>
        </div>
      </div>
    );
  }

  // Posts list view
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('forum.title')}</h1>
          {user.role === 'teacher' && <p className="text-sm text-gray-400 mt-1">{t('forum.teacher_hint')}</p>}
        </div>
        {user.role === 'parent' && (
          <button
            onClick={() => setShowNew(!showNew)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            {t('forum.new_post')}
          </button>
        )}
      </div>

      {/* New post form (parents only) */}
      {showNew && user.role === 'parent' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('forum.title_placeholder')}
            className={`${inputCls} mb-2`}
          />
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder={t('forum.body_placeholder')}
            className={`${inputCls} h-24 mb-3`}
          />
          <div className="flex gap-2">
            <button
              onClick={handleNewPost}
              disabled={posting || !newTitle.trim() || !newBody.trim()}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {posting ? t('forum.posting') : t('forum.post')}
            </button>
            <button onClick={() => setShowNew(false)} className="text-sm text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <p>{t('forum.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <button
              key={post.id}
              onClick={() => openPost(post.id)}
              className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  post.author_role === 'teacher' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'
                }`}>
                  {post.author_name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-700">{post.author_name}</span>
                {post.author_role === 'teacher' && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">{t('forum.teacher')}</span>
                )}
                <span className="text-xs text-gray-400 ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{post.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{post.body}</p>
              <span className="text-xs text-indigo-500 mt-2 inline-block">
                {post.reply_count} {post.reply_count === 1 ? t('forum.reply') : t('forum.replies')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
