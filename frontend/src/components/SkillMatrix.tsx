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

export default function SkillMatrix({ skills }: { skills: Skill[] }) {
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
                <span className="text-sm text-gray-700">{skill.skill_name}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[skill.level] || 'bg-gray-100 text-gray-500'}`}>
                  {skill.level === 'Mastered' ? '✓ ' : ''}{skill.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
