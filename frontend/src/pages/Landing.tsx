import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">HomeRoom</h1>
          <p className="text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed">
            From classroom to home, in any language.
          </p>
          <p className="text-sm text-indigo-300 mt-3 max-w-xl mx-auto">
            AI-powered teacher-parent communication for Australian K-12 schools.
            Translates curriculum into actionable guidance for every family.
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Link to="/teacher/dashboard" className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-50 shadow-lg transition-all hover:scale-105">
              Enter as Teacher
            </Link>
            <Link to="/parent/feed" className="bg-indigo-500/30 text-white px-6 py-3 rounded-xl font-semibold text-sm border border-indigo-400/40 hover:bg-indigo-500/50 transition-all hover:scale-105">
              Enter as Parent
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { title: 'AI Updates', desc: 'Teacher writes 2 sentences, AI generates a full parent-friendly update with home activities', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
            { title: 'Multilingual', desc: '3-language UI + auto-translate messages + voice messages with TTS in recipient\'s language', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
            { title: 'Curriculum RAG', desc: '10,051 ACARA documents + CurricuLLM API. Parents ask anything about the Australian Curriculum', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { title: 'Progress Tracking', desc: '5 subjects, NAPLAN, skills, assignments — non-comparative, parents see only their child', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { title: 'Wellbeing', desc: 'Non-invasive daily check-ins. Teacher sees daily strip, parent sees weekly summary', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
            { title: 'AI Recommendations', desc: 'Personalised per-subject recommendations from all student data. Teacher approves before parents see', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
            { title: 'Voice Messages', desc: 'Type and send as voice. Backend generates audio in both languages via Google TTS', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
            { title: 'Parent Forum', desc: 'Parents ask questions in any language. Teacher and other parents reply. All translatable', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
          ].map((f, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <svg className="w-6 h-6 text-indigo-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} />
              </svg>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-indigo-200 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-12 mb-16">
          {[
            { num: '~50', label: 'API Routes' },
            { num: '190+', label: 'i18n Keys' },
            { num: '10,051', label: 'Curriculum Docs' },
            { num: '3', label: 'Languages' },
            { num: '8', label: 'Modules' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold">{s.num}</p>
              <p className="text-xs text-indigo-300">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="text-center">
          <p className="text-xs text-indigo-400 mb-2">Built with</p>
          <div className="flex gap-3 justify-center flex-wrap">
            {['FastAPI', 'React 19', 'TypeScript', 'ChromaDB', 'CurricuLLM', 'Zephyr-7B', 'gTTS', 'Tailwind CSS'].map((t) => (
              <span key={t} className="text-xs bg-white/10 px-3 py-1 rounded-full text-indigo-200">{t}</span>
            ))}
          </div>
          <p className="text-xs text-indigo-400 mt-4">Zero paid APIs. Hackathon 2026.</p>
        </div>
      </div>
    </div>
  );
}
