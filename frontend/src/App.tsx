import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from './hooks/useTranslation';

// Teacher pages
import Dashboard from './pages/teacher/Dashboard';
import ComposeUpdate from './pages/teacher/ComposeUpdate';
import Insights from './pages/teacher/Insights';
import TeacherMessages from './pages/teacher/Messages';
import TeacherMeetingRoom from './pages/teacher/MeetingRoom';
import StudentList from './pages/teacher/StudentList';
import StudentDetail from './pages/teacher/StudentDetail';
import Integrations from './pages/teacher/Integrations';

// Parent pages
import Feed from './pages/parent/Feed';
import Respond from './pages/parent/Respond';
import CurriculumAsk from './pages/parent/CurriculumAsk';
import ParentMessages from './pages/parent/Messages';
import ParentMeetingRoom from './pages/parent/MeetingRoom';
import ChildProgress from './pages/parent/ChildProgress';

// Shared pages
import Forum from './pages/shared/Forum';

const USERS = {
  teacher: { id: 't1', name: 'Ms. Smith', role: 'teacher' as const, language: 'en' },
  parent_zh: { id: 'p1', name: 'Wei Chen', role: 'parent' as const, language: 'zh' },
  parent_en: { id: 'p2', name: 'Sarah Jones', role: 'parent' as const, language: 'en' },
  parent_ar: { id: 'p3', name: 'Fatima Al-Hassan', role: 'parent' as const, language: 'ar' },
};

type UserKey = keyof typeof USERS;

function NavBar({ userKey, setUserKey }: { userKey: UserKey; setUserKey: (k: UserKey) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = USERS[userKey];

  // Redirect to home when role changes and current path doesn't match
  useEffect(() => {
    const isTeacherPath = location.pathname.startsWith('/teacher');
    const isParentPath = location.pathname.startsWith('/parent');
    if (user.role === 'teacher' && !isTeacherPath) {
      navigate('/teacher/dashboard');
    } else if (user.role === 'parent' && !isParentPath) {
      navigate('/parent/feed');
    }
  }, [userKey]);
  const { t } = useTranslation(user.language);
  const isTeacher = user.role === 'teacher';

  const navLinks = isTeacher
    ? [
        { to: '/teacher/dashboard', label: t('nav.dashboard') },
        { to: '/teacher/compose', label: t('nav.new_update') },
        { to: '/teacher/students', label: t('nav.students') },
        { to: '/teacher/integrations', label: t('nav.integrations') },
        { to: '/teacher/forum', label: t('nav.forum') },
        { to: '/teacher/messages', label: t('nav.messages') },
      ]
    : [
        { to: '/parent/feed', label: t('nav.updates') },
        { to: '/parent/progress', label: t('nav.progress') },
        { to: '/parent/curriculum', label: t('nav.curriculum') },
        { to: '/parent/forum', label: t('nav.forum') },
        { to: '/parent/messages', label: t('nav.messages') },
      ];

  return (
    <nav className="bg-indigo-600 text-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-lg font-bold">{t('app.name')}</Link>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm hover:text-indigo-200 ${location.pathname.startsWith(link.to) ? 'underline underline-offset-4' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-80">{user.name}</span>
        <select
          value={userKey}
          onChange={(e) => setUserKey(e.target.value as UserKey)}
          className="bg-indigo-700 text-white text-sm rounded px-2 py-1 border border-indigo-500"
        >
          <option value="teacher">Ms. Smith (Teacher)</option>
          <option value="parent_zh">Wei Chen (Parent - ZH)</option>
          <option value="parent_en">Sarah Jones (Parent - EN)</option>
          <option value="parent_ar">Fatima Al-Hassan (Parent - AR)</option>
        </select>
      </div>
    </nav>
  );
}

function App() {
  const [userKey, setUserKey] = useState<UserKey>('teacher');
  const user = USERS[userKey];

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar userKey={userKey} setUserKey={setUserKey} />
        <main className="max-w-5xl mx-auto p-6">
          <Routes>
            {/* Teacher routes */}
            <Route path="/teacher/dashboard" element={<Dashboard user={user} />} />
            <Route path="/teacher/compose" element={<ComposeUpdate user={user} />} />
            <Route path="/teacher/insights/:updateId" element={<Insights user={user} />} />
            <Route path="/teacher/students" element={<StudentList user={user} />} />
            <Route path="/teacher/student/:studentId" element={<StudentDetail user={user} />} />
            <Route path="/teacher/integrations" element={<Integrations user={user} />} />
            <Route path="/teacher/forum" element={<Forum user={user} />} />
            <Route path="/teacher/messages" element={<TeacherMessages user={user} />} />
            <Route path="/teacher/meeting/:meetingId" element={<TeacherMeetingRoom user={user} />} />

            {/* Parent routes */}
            <Route path="/parent/feed" element={<Feed user={user} />} />
            <Route path="/parent/respond/:updateId" element={<Respond user={user} />} />
            <Route path="/parent/progress" element={<ChildProgress user={user} />} />
            <Route path="/parent/curriculum" element={<CurriculumAsk user={user} />} />
            <Route path="/parent/forum" element={<Forum user={user} />} />
            <Route path="/parent/messages" element={<ParentMessages user={user} />} />
            <Route path="/parent/meeting/:meetingId" element={<ParentMeetingRoom user={user} />} />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/parent/feed'} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
