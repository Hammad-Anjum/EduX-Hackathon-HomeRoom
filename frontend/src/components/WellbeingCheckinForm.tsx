import { useState } from 'react';

const ZONES = [
  { zone: 1, color: '#6B7280', bg: 'bg-gray-200', label: 'Having a tough day' },
  { zone: 2, color: '#818CF8', bg: 'bg-indigo-200', label: 'Not great' },
  { zone: 3, color: '#FBBF24', bg: 'bg-amber-200', label: 'Doing okay' },
  { zone: 4, color: '#34D399', bg: 'bg-green-200', label: 'Feeling good' },
  { zone: 5, color: '#F472B6', bg: 'bg-pink-200', label: 'Feeling awesome!' },
];

interface Props {
  onSubmit: (zone: number, note: string) => Promise<void>;
  t: (key: string) => string;
}

export default function WellbeingCheckinForm({ onSubmit, t }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (zone: number) => {
    setSelected(zone);
    setSaving(true);
    await onSubmit(zone, note);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        {t('wellbeing.checkin')}
        {saved && <span className="text-green-600 text-xs font-medium ml-2">Logged!</span>}
      </h4>
      <div className="flex gap-2 mb-3">
        {ZONES.map((z) => (
          <button
            key={z.zone}
            onClick={() => handleSelect(z.zone)}
            disabled={saving}
            className={`flex-1 rounded-xl py-3 px-1 text-center transition-all border-2 ${
              selected === z.zone ? 'border-gray-800 scale-105 shadow-md' : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: z.color + '22' }}
          >
            <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{ backgroundColor: z.color }} />
            <span className="text-[10px] text-gray-600 leading-tight block">{z.label}</span>
          </button>
        ))}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('wellbeing.note_placeholder')}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
      />
    </div>
  );
}
