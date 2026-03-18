import React, { useState } from 'react';
import { CardioSession, CardioActivityType } from '../../types';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';

interface AddCardioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (session: CardioSession) => void;
  lang: 'en' | 'es';
}

const ACTIVITIES: { id: CardioActivityType; emoji: string; en: string; es: string }[] = [
  { id: 'running',   emoji: '🏃', en: 'Running',      es: 'Correr' },
  { id: 'cycling',   emoji: '🚴', en: 'Cycling',      es: 'Ciclismo' },
  { id: 'walking',   emoji: '🚶', en: 'Walking',      es: 'Caminar' },
  { id: 'swimming',  emoji: '🏊', en: 'Swimming',     es: 'Natación' },
  { id: 'rowing',    emoji: '🚣', en: 'Rowing',       es: 'Remo' },
  { id: 'elliptical',emoji: '⚙️', en: 'Elliptical',   es: 'Elíptica' },
  { id: 'jump_rope', emoji: '🪢', en: 'Jump Rope',    es: 'Soga' },
  { id: 'hiit',      emoji: '⚡', en: 'HIIT',         es: 'HIIT' },
  { id: 'other',     emoji: '🏋️', en: 'Other',        es: 'Otro' },
];

const getCalEstimate = (type: CardioActivityType, durationMin: number): number => {
  const MET: Record<CardioActivityType, number> = {
    running: 9.8, cycling: 7.5, walking: 3.8, swimming: 8.0,
    rowing: 7.0, elliptical: 5.0, jump_rope: 11.0, hiit: 10.0, other: 5.0
  };
  const bodyWeight = 75; // kg approximation
  return Math.round(MET[type] * bodyWeight * (durationMin / 60));
};

export const AddCardioModal: React.FC<AddCardioModalProps> = ({ isOpen, onClose, onAdd, lang }) => {
  const today = new Date().toISOString().split('T')[0];
  const [activity, setActivity]   = useState<CardioActivityType>('running');
  const [duration, setDuration]   = useState('');
  const [distance, setDistance]   = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes]         = useState('');

  const calEstimate = duration ? getCalEstimate(activity, Number(duration)) : 0;

  const handleSubmit = () => {
    if (!duration) return;
    onAdd({
      id: `cardio_${Date.now()}`,
      date: today,
      activityType: activity,
      durationMin: Number(duration),
      distanceKm: distance ? Number(distance) : undefined,
      caloriesBurned: calEstimate,
      avgHeartRate: heartRate ? Number(heartRate) : undefined,
      notes: notes || undefined,
      timestamp: Date.now(),
    });
    setDuration(''); setDistance(''); setHeartRate(''); setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  const t = {
    title:     lang === 'en' ? 'Log Cardio'      : 'Registrar Cardio',
    duration:  lang === 'en' ? 'Duration (min)'   : 'Duración (min)',
    distance:  lang === 'en' ? 'Distance (km)'    : 'Distancia (km)',
    heartRate: lang === 'en' ? 'Avg Heart Rate'   : 'FC Promedio',
    notes:     lang === 'en' ? 'Notes (optional)' : 'Notas (opcional)',
    estimated: lang === 'en' ? 'Est. Burned'      : 'Est. Quemadas',
    add:       lang === 'en' ? 'Save Session'     : 'Guardar Sesión',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
      <div className="w-full bg-zinc-900 rounded-t-3xl border-t border-zinc-800 p-6 pb-safe max-h-[90vh] overflow-y-auto scroll-container animate-spring-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">{t.title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Activity picker */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {ACTIVITIES.map(a => (
            <button key={a.id} onClick={() => setActivity(a.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all
                ${activity === a.id ? 'bg-red-600 text-white border-transparent' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
              <span>{a.emoji}</span>
              <span>{lang === 'en' ? a.en : a.es}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input value={duration} onChange={e => setDuration(e.target.value)} placeholder={t.duration}
            type="number" inputMode="numeric"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500" />
          
          {duration && (
            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-zinc-400">{t.estimated}</span>
              <span className="text-sm font-bold text-red-400">~{calEstimate} kcal</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <input value={distance} onChange={e => setDistance(e.target.value)} placeholder={t.distance}
              type="number" inputMode="decimal"
              className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500" />
            <input value={heartRate} onChange={e => setHeartRate(e.target.value)} placeholder={t.heartRate}
              type="number" inputMode="numeric"
              className="bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500" />
          </div>

          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notes}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-zinc-500" />
        </div>

        <Button onClick={handleSubmit} fullWidth className="mt-5" variant="danger" disabled={!duration}>
          {t.add}
        </Button>
      </div>
    </div>
  );
};