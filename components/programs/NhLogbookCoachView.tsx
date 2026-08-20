import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getTranslated } from '../../utils';
import { buildNhCoachTrends, type NhCoachState } from '../../programs/naturalHypertrophy/nhLogbookAnalysis';
import { Icon } from '../ui/Icon';

interface Props { lang: 'en' | 'es'; }

const stateRank: Record<NhCoachState, number> = {
  plateau_candidate: 0,
  context_changed: 1,
  progressing: 2,
  hard_work: 3,
  learning: 4,
};

export const NhLogbookCoachView: React.FC<Props> = ({ lang }) => {
  const { logs, exercises } = useApp();

  const trends = useMemo(() => buildNhCoachTrends(Array.isArray(logs) ? logs : [])
    .map(trend => {
      const definition = (Array.isArray(exercises) ? exercises : []).find(item => String(item.id) === trend.exerciseId);
      const fallback = (Array.isArray(logs) ? logs : [])
        .flatMap(log => log.exercises || [])
        .find(item => String(item.id) === trend.exerciseId);
      const value = definition?.name || fallback?.name || trend.exerciseId;
      const name = typeof value === 'object' ? getTranslated(value, lang) : String(value);
      return { ...trend, name };
    })
    .sort((a, b) => stateRank[a.state] - stateRank[b.state] || b.exposures.length - a.exposures.length)
    .slice(0, 16), [exercises, lang, logs]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-primary-500/20 bg-primary-500/[0.05] p-4">
        <div className="flex items-start gap-3">
          <Icon name="Brain" size={18} className="mt-0.5 shrink-0 text-primary-400"/>
          <div>
            <p className="text-xs font-black text-primary-300">{lang === 'es' ? 'Unlimited Hypertrophy · lectura del logbook' : 'Unlimited Hypertrophy · logbook reading'}</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--text-muted))]">
              {lang === 'es'
                ? 'NH permite que 2–3 exposiciones difíciles y planas sean parte normal de la adaptación. GainsLab ahora sólo compara exposiciones del mismo contexto: mismo slot cuando existe, mismo rango objetivo y mismo número de series efectivas.'
                : 'NH allows 2–3 hard flat exposures to be a normal part of adaptation. GainsLab now compares only like-for-like contexts: the same slot when available, the same target bracket and the same number of work sets.'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
        <p className="text-[10px] font-black text-amber-300">{lang === 'es' ? 'REGLA GAINSLAB · comparabilidad' : 'GAINSLAB RULE · comparability'}</p>
        <p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">
          {lang === 'es'
            ? 'NH dice “aproximadamente la misma carga/reps”, pero no define una llave de software. GainsLab segmenta por contexto y mantiene ±1 rep total como tolerancia de producto. Si cambian series, slot o rango, la pantalla dice CONTEXTO CAMBIÓ en vez de fabricar progreso o plateau.'
            : 'NH says “approximately the same load/reps” but does not define a software key. GainsLab segments by context and keeps ±1 total rep as a product tolerance. If sets, slot or bracket change, the screen says CONTEXT CHANGED instead of manufacturing progress or a plateau.'}
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
        const contextChanged = trend.state === 'context_changed';
        const badge = isPlateau ? 'PLATEAU?'
          : isProgress ? (lang === 'es' ? 'PROGRESO' : 'PROGRESS')
          : isHardWork ? (lang === 'es' ? 'TRABAJO DURO' : 'HARD WORK')
          : contextChanged ? (lang === 'es' ? 'CONTEXTO CAMBIÓ' : 'CONTEXT CHANGED')
          : (lang === 'es' ? 'APRENDIENDO' : 'LEARNING');
        const badgeClass = isPlateau ? 'bg-amber-500/10 text-amber-400'
          : isProgress ? 'bg-emerald-500/10 text-emerald-400'
          : isHardWork ? 'bg-sky-500/10 text-sky-400'
          : contextChanged ? 'bg-violet-500/10 text-violet-400'
          : 'bg-[rgb(var(--surface-base))] text-[rgb(var(--text-muted))]';
        const cardClass = isPlateau ? 'border-amber-500/20 bg-amber-500/[0.05]'
          : isProgress ? 'border-emerald-500/20 bg-emerald-500/[0.05]'
          : contextChanged ? 'border-violet-500/20 bg-violet-500/[0.05]'
          : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]';
        const displayed = trend.exposures.length ? trend.exposures : trend.allRecent.slice(0, 4);

        return (
          <section key={trend.exerciseId} className={`rounded-2xl border p-4 ${cardClass}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-black">{trend.name}</h3>
                <p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{trend.label[lang]}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${badgeClass}`}>{badge}</span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {displayed.map((exposure, index) => (
                <div key={`${exposure.time}-${index}`} className="rounded-xl bg-[rgb(var(--surface-base))] p-2 text-center">
                  <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{`E${displayed.length-index}`}</p>
                  <p className="mt-1 text-[10px] font-black tabular-nums">{exposure.maxWeight > 0 ? `${exposure.maxWeight}kg` : 'BW'}</p>
                  <p className="text-[9px] font-bold text-[rgb(var(--text-muted))]">{exposure.totalReps}r · {exposure.completedSets}s</p>
                  {exposure.targetReps && <p className="mt-0.5 truncate text-[8px] text-[rgb(var(--text-muted))]">{exposure.targetReps}</p>}
                </div>
              ))}
            </div>

            {trend.excludedForContext > 0 && !contextChanged && <p className="mt-2 text-[9px] leading-4 text-violet-400">{lang === 'es' ? `${trend.excludedForContext} exposición reciente quedó fuera de esta comparación porque cambió el contexto.` : `${trend.excludedForContext} recent exposure was excluded because its context changed.`}</p>}
            {isProgress && <p className="mt-3 text-[10px] font-bold text-emerald-400">{lang === 'es' ? 'La comparación sí es equivalente. Si la dosis sigue produciendo progreso, no agregues complejidad por reflejo.' : 'The comparison is like-for-like. If the dose is still producing progress, do not add complexity by reflex.'}</p>}
            {isHardWork && <p className="mt-3 text-[10px] font-bold text-sky-400">{lang === 'es' ? 'No esquives la dificultad cambiando el ejercicio demasiado pronto. Esta puede ser justamente la zona que obliga a adaptarte.' : 'Do not dodge difficulty by changing the exercise too early. This may be exactly the zone forcing adaptation.'}</p>}
            {isPlateau && <p className="mt-3 text-[10px] font-bold text-amber-400">{lang === 'es' ? 'Ahora sí revisá: rango, salto de carga, recuperación y técnica; recién después considerá una variante relevante.' : 'Now review the bracket, load jump, recovery and technique; only then consider a relevant variation.'}</p>}
            {contextChanged && <p className="mt-3 text-[10px] font-bold text-violet-400">{lang === 'es' ? 'No declaramos progreso ni plateau: primero reuní otra exposición con el nuevo contexto.' : 'No progress or plateau is declared: collect another exposure in the new context first.'}</p>}
          </section>
        );
      })}
    </div>
  );
};
