import React, { useMemo } from 'react';
import type { GlobalTemplate, Log, MesoCycle } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateProgramMetrics } from '../../programs/engine/ProgramMetrics';
import { resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { getKongDayDisplay } from '../../programs/kong/kongDisplay';
import { triggerHaptic } from '../../utils/audio';

interface Props {
  meso: MesoCycle;
  logs: Log[];
  onFinish: () => void;
  onKeep: () => void;
  lang: 'en' | 'es';
}

export const ProgramCompletionView: React.FC<Props> = ({ meso, logs, onFinish, onKeep, lang }) => {
  const { setPersonalTemplates } = useApp();
  const metrics = calculateProgramMetrics(logs, meso.id, 48, meso.programSystem?.startedBodyWeight, KONG_4DAY_V1.daysPerWeek);

  const finalRoutine = useMemo(() => resolveProgramWeek(
    KONG_4DAY_V1,
    12,
    meso.programSystem?.substitutions || {},
  ).map((day, dayIndex) => ({
    ...day,
    dayName: getKongDayDisplay(3, dayIndex),
  })), [meso.programSystem?.substitutions]);

  const saveAsPersonal = () => {
    const now = Date.now();
    const template: GlobalTemplate = {
      id: `personal_kong_${now}`,
      name: `KONG Personal ${new Date(now).toLocaleDateString()}`,
      title: {
        en: 'KONG · Block 3 Personal',
        es: 'KONG · Bloque 3 Personal',
      },
      description: {
        en: 'Personal routine created from your completed KONG Block 3 structure.',
        es: 'Rutina personal creada desde la estructura final de tu Bloque 3 de KONG.',
      },
      isPro: false,
      program: finalRoutine,
      order: now,
      scope: 'personal',
    };

    setPersonalTemplates(prev => [template, ...(Array.isArray(prev) ? prev : [])]);
    triggerHaptic('success');
    onKeep();
  };

  const metricCards: Array<[string, string, string]> = [
    ['sessions', lang === 'es' ? 'Sesiones' : 'Sessions', String(metrics.sessionsCompleted)],
    ['sets', lang === 'es' ? 'Series' : 'Sets', String(metrics.setsCompleted)],
    ['time', lang === 'es' ? 'Tiempo' : 'Time', `${Math.round(metrics.totalSeconds / 60)} min`],
    ['volume', lang === 'es' ? 'Volumen' : 'Volume', Math.round(metrics.totalVolume).toLocaleString()],
    ['density', lang === 'es' ? 'Densidad' : 'Density', metrics.averageDensity.toFixed(metrics.averageDensity >= 10 ? 0 : 1)],
    ['adherence', lang === 'es' ? 'Adherencia' : 'Adherence', `${Math.round(metrics.adherence * 100)}%`],
  ];

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center overflow-y-auto bg-black/70 p-4 pb-safe pt-safe backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-6 text-[rgb(var(--text-primary))] shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
        <h1 className="mt-2 text-3xl font-black">{lang === 'es' ? 'KONG completado' : 'KONG complete'}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">12 {lang === 'es' ? 'semanas' : 'weeks'} · 48 {lang === 'es' ? 'sesiones programadas' : 'scheduled sessions'}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {metricCards.map(([key, label, value]) => (
            <div key={key} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">{label}</p>
              <p className="mt-1 text-lg font-black">{value}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-[rgb(var(--text-muted))]">
          {metrics.initialBodyWeight || metrics.currentBodyWeight
            ? `${lang === 'es' ? 'Peso corporal' : 'Body weight'}: ${metrics.initialBodyWeight ?? '—'} → ${metrics.currentBodyWeight ?? '—'}`
            : (lang === 'es' ? 'Peso corporal: sin datos' : 'Body weight: no data')}
        </p>

        <div className="mt-6 space-y-2">
          <button onClick={saveAsPersonal} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 font-black text-black active:scale-[0.99]">
            {lang === 'es' ? 'Guardar Bloque 3 como rutina personal' : 'Save Block 3 as personal routine'}
          </button>
          <button onClick={onFinish} className="min-h-12 w-full rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] px-4 font-black">
            {lang === 'es' ? 'Terminar programa' : 'Finish program'}
          </button>
        </div>
      </div>
    </div>
  );
};
