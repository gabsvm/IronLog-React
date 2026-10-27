import { pickLang } from '../../utils/i18n';
import { TRANSLATIONS } from '../../constants/translations';
import React, { useState } from 'react';
import { CardioSession, CardioActivityType } from '../../types';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { todayLocalDateKey } from '../../utils/localDate';
import { isValidCardioEntry } from '../../utils/cardioValidation';
import { fromDisplayDistance, distanceUnitLabel } from '../../utils/strongTraining';
import { useTrainingConfig } from '../../hooks/useTrainingConfig';
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
  const bodyWeight = Number.isFinite(userProfile?.bodyWeight) && (userProfile?.bodyWeight ?? 0) > 0 ? userProfile!.bodyWeight! : 75;
  const today = todayLocalDateKey();
  const [activity, setActivity]   = useState<CardioActivityType>('running');
  const [duration, setDuration]   = useState('');
  const [distance, setDistance]   = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes]         = useState('');
  // Independent distance unit: entry/display only, storage stays canonical km
  // (historical sessions are never rewritten on unit change).
  const [trainingPrefs] = useTrainingConfig();
  const distanceUnit = trainingPrefs.distanceUnit;
  const distLabel = distanceUnitLabel(distanceUnit);

  const durationMin = Number(duration);
  // Typed in the display unit; converted to canonical km for storage.
  const distanceKm = distance === '' ? undefined : fromDisplayDistance(Number(distance), distanceUnit);
  const avgHeartRate = heartRate === '' ? undefined : Number(heartRate);
  const canSubmit = isValidCardioEntry(durationMin, distanceKm, avgHeartRate);
  const calEstimate = canSubmit ? getCalEstimate(activity, durationMin, bodyWeight) : 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      id: `cardio_${Date.now()}`,
      date: today,
      activityType: activity,
      durationMin,
      distanceKm,
      caloriesBurned: calEstimate,
      avgHeartRate,
      notes: notes || undefined,
      timestamp: Date.now(),
    });
    setDuration(''); setDistance(''); setHeartRate(''); setNotes('');
    onClose();
  };

  const t = {
    title:     TRANSLATIONS[lang].copy.addCardioModal.logCardio,
    duration:  TRANSLATIONS[lang].copy.addCardioModal.durationMin,
    // Translation key stays `distanceKm` (canonical storage); the suffix
    // follows the display unit without touching shared translations.
    distance:  TRANSLATIONS[lang].copy.addCardioModal.distanceKm.replace('km', distLabel).replace('KM', distLabel.toUpperCase()),
    heartRate: TRANSLATIONS[lang].copy.addCardioModal.avgHeartRate,
    notes:     TRANSLATIONS[lang].copy.addCardioModal.notesOptional,
    estimated: TRANSLATIONS[lang].copy.addCardioModal.estBurned,
    add:       TRANSLATIONS[lang].copy.addCardioModal.saveSession,
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={t.title}
      accent="primary"
      footer={
        <Button onClick={handleSubmit} fullWidth variant="primary" disabled={!canSubmit}>
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
              aria-pressed={activity === a.id}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl min-h-11 text-xs font-semibold border transition-colors duration-fast ease-natural
                ${activity === a.id
                  ? 'bg-surface-elevated text-[rgb(var(--text-primary))] border-border-strong'
                  : 'bg-surface-base text-muted border-border-subtle hover:border-border-strong'}`}
            >
              <span aria-hidden="true">{a.emoji}</span>
              <span>{pickLang(lang, a)}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="cardio-duration" className="block text-sm font-semibold text-muted mb-1 px-1">{t.duration}</label>
            <input
              id="cardio-duration"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="0"
              type="number"
              min="1"
              max="1440"
              step="1"
              inputMode="numeric"
              className="nutri-field premium-form-input w-full px-4 py-3 text-[rgb(var(--text-primary))] placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all "
            />
          </div>
          
          {duration && (
            <div className="bg-surface-raised border border-border-subtle rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-muted">{t.estimated}</span>
              <span className="text-sm font-semibold text-accent">~{calEstimate} kcal</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="cardio-distance" className="block text-sm font-semibold text-muted mb-1 px-1">{t.distance}</label>
              <input
                id="cardio-distance"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                placeholder="0.0"
                type="number"
                min="0"
                max="1000"
                step="any"
                inputMode="decimal"
              className="nutri-field premium-form-input w-full px-4 py-3 text-[rgb(var(--text-primary))] placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all "
              />
            </div>
            <div>
              <label htmlFor="cardio-heart-rate" className="block text-sm font-semibold text-muted mb-1 px-1">{t.heartRate}</label>
              <input
                id="cardio-heart-rate"
                value={heartRate}
                onChange={e => setHeartRate(e.target.value)}
                placeholder="0"
                type="number"
                min="30"
                max="250"
                step="1"
                inputMode="numeric"
              className="nutri-field premium-form-input w-full px-4 py-3 text-[rgb(var(--text-primary))] placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all "
              />
            </div>
          </div>

          <div>
            <label htmlFor="cardio-notes" className="block text-sm font-semibold text-muted mb-1 px-1">{t.notes}</label>
            <input
              id="cardio-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="..."
              className="nutri-field premium-form-input w-full px-4 py-3 text-[rgb(var(--text-primary))] placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all "
            />
          </div>
        </div>
      </div>
    </Sheet>
  );
};