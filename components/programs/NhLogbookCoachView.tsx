import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Log, SessionExercise, WorkoutSet } from '../../types';
import { getTranslated } from '../../utils';
import { Icon } from '../ui/Icon';

interface Props { lang: 'en' | 'es'; }

interface Exposure {
  time: number;
  maxWeight: number;
  totalReps: number;
  completedSets: number;
}

interface ExerciseTrend {
  id: string;
  name: string;
  exposures: Exposure[];
  state: 'progressing' | 'review' | 'learning';
  reason: string;
}

const workingSets = (exercise: SessionExercise): WorkoutSet[] => (exercise.sets || []).filter(set =>
  set.completed && !set.skipped && set.type !== 'warmup' && set.type !== 'avt_hop'
);

const toExposure = (log: Log, exercise: SessionExercise): Exposure | null => {
  const sets = workingSets(exercise);
  if (sets.length === 0) return null;
  const weighted = sets.map(set => Number(set.weight || 0)).filter(value => Number.isFinite(value));
  const reps = sets.map(set => Number(set.reps || 0)).filter(value => Number.isFinite(value));
  return {
    time: log.endTime || log.startTime || 0,
    maxWeight: weighted.length ? Math.max(...weighted) : 0,
    totalReps: reps.reduce((sum, value) => sum + value, 0),
    completedSets: sets.length,
  };
};

const compareExposure = (latest: Exposure, previous: Exposure) => {
  if (latest.maxWeight > previous.maxWeight) return 1;
  if (latest.maxWeight < previous.maxWeight) return -1;
  if (latest.totalReps > previous.totalReps) return 1;
  if (latest.totalReps < previous.totalReps) return -1;
  return 0;
};

export const NhLogbookCoachView: React.FC<Props> = ({ lang }) => {
  const { logs, exercises } = useApp();

  const trends = useMemo<ExerciseTrend[]>(() => {
    const safeLogs = (Array.isArray(logs) ? logs : []).filter(log => !log.skipped).slice().sort((a,b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));
    const byExercise = new Map<string, Exposure[]>();
    safeLogs.forEach(log => (log.exercises || []).forEach(exercise => {
      const exposure = toExposure(log, exercise);
      if (!exposure) return;
      const key = String(exercise.id);
      const list = byExercise.get(key) || [];
      list.push(exposure);
      byExercise.set(key, list);
    }));

    return Array.from(byExercise.entries()).map(([id, exposures]) => {
      const recent = exposures.slice(0, 3);
      const definition = (Array.isArray(exercises) ? exercises : []).find(item => String(item.id) === id);
      const fallbackExercise = safeLogs.flatMap(log => log.exercises || []).find(item => String(item.id) === id);
      const nameValue = definition?.name || fallbackExercise?.name || id;
      const name = typeof nameValue === 'object' ? getTranslated(nameValue, lang) : String(nameValue);
      if (recent.length < 2) return { id, name, exposures: recent, state: 'learning' as const, reason: lang === 'es' ? 'Todavía faltan exposiciones comparables.' : 'More comparable exposures are needed.' };
      const latestChange = compareExposure(recent[0], recent[1]);
      if (latestChange > 0) return { id, name, exposures: recent, state: 'progressing' as const, reason: lang === 'es' ? 'La exposición más reciente mejoró carga o reps con una carga comparable.' : 'The latest exposure improved load or reps at a comparable load.' };
      if (recent.length >= 3) {
        const secondChange = compareExposure(recent[1], recent[2]);
        if (latestChange <= 0 && secondChange <= 0) return { id, name, exposures: recent, state: 'review' as const, reason: lang === 'es' ? 'Tres exposiciones comparables sin una mejora clara. Revisá antes de añadir trabajo.' : 'Three comparable exposures without a clear improvement. Review before adding work.' };
      }
      return { id, name, exposures: recent, state: 'learning' as const, reason: lang === 'es' ? 'No hay una tendencia suficientemente estable todavía.' : 'There is not a stable enough trend yet.' };
    }).sort((a,b) => {
      const rank = { review: 0, progressing: 1, learning: 2 };
      return rank[a.state] - rank[b.state] || b.exposures.length - a.exposures.length;
    }).slice(0, 16);
  }, [exercises, lang, logs]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
        <div className="flex items-start gap-3"><Icon name="Brain" size={18} className="mt-0.5 shrink-0 text-amber-400"/><div><p className="text-xs font-black text-amber-300">{lang === 'es' ? 'Regla operativa de GainsLab' : 'GainsLab operational rule'}</p><p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'La alerta de tres exposiciones no es un número dictado por Natural Hypertrophy. GainsLab la usa como disparador para que revises contexto, técnica, recuperación y programación; nunca como orden automática de añadir series.' : 'The three-exposure flag is not a number prescribed by Natural Hypertrophy. GainsLab uses it as a trigger to review context, technique, recovery and programming; never as an automatic order to add sets.'}</p></div></div>
      </section>

      {trends.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] p-8 text-center"><Icon name="BarChart2" size={24} className="mx-auto text-[rgb(var(--text-muted))]"/><p className="mt-3 text-sm font-black">{lang === 'es' ? 'Todavía no hay suficiente logbook' : 'Not enough logbook data yet'}</p><p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Entrená y registrá series. El sistema necesita exposiciones reales para enseñarte a leer tendencias.' : 'Train and log sets. The system needs real exposures before it can teach you to read trends.'}</p></div>
      ) : trends.map(trend => (
        <section key={trend.id} className={`rounded-2xl border p-4 ${trend.state === 'review' ? 'border-amber-500/20 bg-amber-500/[0.05]' : trend.state === 'progressing' ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-black">{trend.name}</h3><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{trend.reason}</p></div><span className={`shrink-0 rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${trend.state === 'review' ? 'bg-amber-500/10 text-amber-400' : trend.state === 'progressing' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'}`}>{trend.state === 'review' ? (lang === 'es' ? 'REVISAR' : 'REVIEW') : trend.state === 'progressing' ? (lang === 'es' ? 'PROGRESANDO' : 'PROGRESSING') : (lang === 'es' ? 'APRENDIENDO' : 'LEARNING')}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2">{trend.exposures.map((exposure,index) => <div key={exposure.time || index} className="rounded-xl bg-[rgb(var(--surface-base))] p-2 text-center"><p className="text-[8px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{lang === 'es' ? `Exp ${trend.exposures.length-index}` : `Exp ${trend.exposures.length-index}`}</p><p className="mt-1 text-xs font-black tabular-nums">{exposure.maxWeight > 0 ? `${exposure.maxWeight}kg` : 'BW'} · {exposure.totalReps}r</p></div>)}</div>
          {trend.state === 'progressing' && <p className="mt-3 text-[10px] font-bold text-emerald-400">{lang === 'es' ? 'Lección NH: si la dosis sigue produciendo progreso, no hay un problema que resolver por defecto.' : 'NH lesson: if the dose is still producing progress, there is no default problem to solve.'}</p>}
          {trend.state === 'review' && <p className="mt-3 text-[10px] font-bold text-amber-400">{lang === 'es' ? 'Antes de añadir volumen: revisá recuperación, técnica, ejercicio, rango, distribución y motivación.' : 'Before adding volume: review recovery, technique, exercise, range, distribution and motivation.'}</p>}
        </section>
      ))}
    </div>
  );
};
