import React, { useState } from 'react';
import { CardioSession, CardioActivityType } from '../../types';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';

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

const MET: Record<CardioActivityType, number> = {
  running: 9.8, cycling: 7.5, walking: 3.8, swimming: 8.0,
  rowing: 7.0, elliptical: 5.0, jump_rope: 11.0, hiit: 10.0, other: 5.0
};

const getCalEstimate = (type: CardioActivityType, durationMin: number, bodyWeightKg: number): number =>
  Math.round(MET[type] * bodyWeightKg * (durationMin / 60));

export const AddCardioModal: React.FC<AddCardioModalProps> = ({ isOpen, onClose, onAdd, lang }) => {
  const { userProfile } = useApp();
  const bodyWeight = userProfile?.bodyWeight ?? 75;
  const today = new Date().toISOString().split('T')[0];
  const [activity, setActivity]   = useState<CardioActivityType>('running');
  const [duration, setDuration]   = useState('');
  const [distance, setDistance]   = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes]         = useState('');

  const calEstimate = duration ? getCalEstimate(activity, Number(duration), bodyWeight) : 0;

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
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={t.title}
      accent="primary"
      footer={
        <Button onClick={handleSubmit} fullWidth variant="primary" disabled={!duration}>
          {t.add}
        </Button>
      }
    >
      <div className="p-5 space-y-5">
        {/* Activity picker */}
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITIES.map(a => (
            <button
              key={a.id}
              onClick={() => setActivity(a.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all active:scale-95 duration-fast ease-natural
                ${activity === a.id 
                  ? 'bg-primary-500 text-white border-transparent shadow-[0_4px_12px] shadow-primary-500/30' 
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'}`}
            >
              <span aria-hidden="true">{a.emoji}</span>
              <span>{lang === 'en' ? a.en : a.es}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{t.duration}</label>
            <input
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="0"
              type="number"
              inputMode="numeric"
              className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
            />
          </div>
          
          {duration && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl px-4 py-3 flex justify-between items-center animate-in fade-in duration-slow">
              <span className="text-xs text-zinc-400">{t.estimated}</span>
              <span className="text-sm font-bold text-primary-400">~{calEstimate} kcal</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{t.distance}</label>
              <input
                value={distance}
                onChange={e => setDistance(e.target.value)}
                placeholder="0.0"
                type="number"
                inputMode="decimal"
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{t.heartRate}</label>
              <input
                value={heartRate}
                onChange={e => setHeartRate(e.target.value)}
                placeholder="0"
                type="number"
                inputMode="numeric"
                className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 px-1">{t.notes}</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="..."
              className="w-full bg-zinc-800 border border-zinc-700/50 rounded-2xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
};