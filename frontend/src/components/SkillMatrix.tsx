import TranslateButton from './TranslateButton';

const LEVEL_COLORS: Record<string, string> = {
  Beginning: 'bg-gray-200 text-gray-600',
  Developing: 'bg-amber-200 text-amber-800',
  Proficient: 'bg-green-200 text-green-800',
  Mastered: 'bg-green-500 text-white',
};

interface Skill {
  skill_name: string;
  subject: string;
  level: string;
}

export function SkillLegend({ t }: { t: (key: string) => string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-xs space-y-1">
      <p className="font-semibold text-gray-600 mb-2">{t('legend.skills')}</p>
      <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-gray-300" /><span className="text-gray-600">{t('legend.skills.beginning')}</span></div>
      <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-amber-300" /><span className="text-gray-600">{t('legend.skills.developing')}</span></div>
      <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-green-300" /><span className="text-gray-600">{t('legend.skills.proficient')}</span></div>
      <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-600">{t('legend.skills.mastered')}</span></div>
    </div>
  );
}

export default function SkillMatrix({ skills, targetLanguage }: { skills: Skill[]; targetLanguage?: string }) {
  // Group by subject
  const bySubject: Record<string, Skill[]> = {};
  for (const s of skills) {
    (bySubject[s.subject] ??= []).push(s);
  }

  return (
    <div className="space-y-4">
      {Object.entries(bySubject).map(([subject, subjectSkills]) => (
        <div key={subject}>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">{subject}</h4>
          <div className="space-y-1.5">
            {subjectSkills.map((skill) => (
              <div key={skill.skill_name} className="flex items-center justify-between bg-white rounded-lg border p-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-700">{skill.skill_name}</span>
                  {targetLanguage && targetLanguage !== 'en' && <TranslateButton text={`${skill.skill_name} — ${skill.level}`} targetLanguage={targetLanguage} />}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[skill.level] || 'bg-gray-100 text-gray-500'}`}>
                  {skill.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
