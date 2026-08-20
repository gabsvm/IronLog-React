import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Log, SessionExercise, WorkoutSet } from '../../types';
import { getTranslated } from '../../utils';
import { evaluateNhPlateauTrend, type NhPlateauStatus } from '../../programs/naturalHypertrophy/nhVerifiedKnowledge';
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
  state: NhPlateauStatus;
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

const stateRank: Record<NhPlateauStatus, number> = {
  plateau_candidate: 0,
  progressing: 1,
  hard_work: 2,
  learning: 3,
};

export const NhLogbookCoachView: React.FC<Props> = ({ lang }) => {
  const { logs, exercises } = useApp();

  const trends = useMemo<ExerciseTrend[]>(() => {
    const safeLogs = (Array.isArray(logs) ? logs : [])
      .filter(log => !log.skipped)
      .slice()
      .sort((a,b) => (b.endTime || b.startTime || 0) - (a.endTime || a.startTime || 0));
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
      const recent = exposures.slice(0, 4);
      const definition = (Array.isArray(exercises) ? exercises : []).find(item => String(item.id) === id);
      const fallbackExercise = safeLogs.flatMap(log => log.exercises || []).find(item => String(item.id) === id);
      const nameValue = definition?.name || fallbackExercise?.name || id;
      const name = typeof nameValue === 'object' ? getTranslated(nameValue, lang) : String(nameValue);
      const cue = evaluateNhPlateauTrend(recent.map(item => ({ maxWeight: item.maxWeight, totalReps: item.totalReps })));
      return { id, name, exposures: recent, state: cue.status, reason: cue.label[lang] };
    }).sort((a,b) => stateRank[a.state] - stateRank[b.state] || b.exposures.length - a.exposures.length).slice(0, 16);
  }, [exercises, lang, logs]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-4">
        <div className="flex items-start gap-3">
          <Icon name="Brain" size={18} className="mt-0.5 shrink-0 text-primary-400"/>
          <div>
            <p className="text-xs font-black text-primary-300">{lang === 'es' ? 'Unlimited Hypertrophy · lectura del logbook' : 'Unlimited Hypertrophy · logbook reading'}</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
              {lang === 'es'
                ? 'NH dice que repetir aproximadamente la misma carga y reps durante dos o tres exposiciones puede ser simplemente la parte difícil que obliga a adaptarte. GainsLab recién eleva una alerta de plateau cuando hay más de 2–3 exposiciones realmente comparables sin cambio claro.'
                : 'NH says repeating roughly the same load and reps for two or three exposures can simply be the hard phase that forces adaptation. GainsLab only escalates a plateau flag after more than 2–3 genuinely comparable exposures without a clear change.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
        <p className="text-[10px] font-black text-amber-300">{lang === 'es' ? 'Qué parte es regla de GainsLab' : 'What part is a GainsLab rule'}</p>
        <p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">
          {lang === 'es'
            ? 'NH usa “aproximadamente las mismas reps”; el margen exacto de ±1 rep total que usa esta pantalla para decidir si dos exposiciones son equivalentes es una heurística del producto, no una cifra prescrita por NH.'
            : 'NH says “approximately the same reps”; this screen’s exact ±1-total-rep tolerance for deciding whether exposures are equivalent is a product heuristic, not a number prescribed by NH.'}
        </p>
      </section>

      {trends.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] p-8 text-center">
          <Icon name="BarChart2" size={24} className="mx-auto text-[rgb(var(--text-muted))]"/>
          <p className="mt-3 text-sm font-black">{lang === 'es' ? 'Todavía no hay suficiente logbook' : 'Not enough logbook data yet'}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Entrená y registrá series. El sistema necesita exposiciones reales para enseñarte a leer tendencias.' : 'Train and log sets. The system needs real exposures before it can teach you to read trends.'}</p>
        </div>
      ) : trends.map(trend => {
        const isPlateau = trend.state === 'plateau_candidate';
        const isProgress = trend.state === 'progressing';
        const isHardWork = trend.state === 'hard_work';
        return (
          <section key={trend.id} className={`rounded-2xl border p-4 ${isPlateau ? 'border-amber-500/20 bg-amber-500/[0.05]' : isProgress ? 'border-emerald-500/20 bg-emerald-500/[0.05]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black">{trend.name}</h3>
                <p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{trend.reason}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] ${isPlateau ? 'bg-amber-500/10 text-amber-400' : isProgress ? 'bg-emerald-500/10 text-emerald-400' : isHardWork ? 'bg-sky-500/10 text-sky-400' : 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]'}`}>
                {isPlateau ? (lang === 'es' ? 'PLATEAU?' : 'PLATEAU?') : isProgress ? (lang === 'es' ? 'PROGRESO' : 'PROGRESS') : isHardWork ? (lang === 'es' ? 'TRABAJO DURO' : 'HARD WORK') : (lang === 'es' ? 'APRENDIENDO' : 'LEARNING')}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {trend.exposures.map((exposure,index) => (
                <div key={exposure.time || index} className="rounded-xl bg-[rgb(var(--surface-base))] p-2 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{`E${trend.exposures.length-index}`}</p>
                  <p className="mt-1 text-[10px] font-black tabular-nums">{exposure.maxWeight > 0 ? `${exposure.maxWeight}kg` : 'BW'}</p>
                  <p className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{exposure.totalReps}r</p>
                </div>
              ))}
            </div>
            {isProgress && <p className="mt-3 text-[10px] font-bold text-emerald-400">{lang === 'es' ? 'Si la dosis sigue produciendo progreso, no agregues complejidad por reflejo.' : 'If the dose is still producing progress, do not add complexity by reflex.'}</p>}
            {isHardWork && <p className="mt-3 text-[10px] font-bold text-sky-400">{lang === 'es' ? 'No esquives la dificultad cambiando el ejercicio demasiado pronto. Esta puede ser justamente la zona que obliga a adaptarte.' : 'Do not dodge difficulty by changing the exercise too early. This may be exactly the zone forcing adaptation.'}</p>}
            {isPlateau && <p className="mt-3 text-[10px] font-bold text-amber-400">{lang === 'es' ? 'Ahora sí revisá: rango, salto de carga, recuperación, técnica y recién después si hace falta una variante relevante.' : 'Now review the bracket, load jump, recovery and technique; only then consider whether a relevant variation is needed.'}</p>}
          </section>
        );
      })}
    </div>
  );
};