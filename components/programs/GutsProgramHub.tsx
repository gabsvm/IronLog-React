import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Log, MesoCycle } from '../../types';
import { Icon } from '../ui/Icon';
import { GUTS_BLACK_SWORDSMAN_V1 } from '../../programs/naturalHypertrophy/gutsBlackSwordsman';
import { GUTS_GUIDE } from '../../programs/naturalHypertrophy/gutsGuide';
import { resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { calculateProgramMetrics } from '../../programs/engine/ProgramMetrics';

type Panel = 'home' | 'philosophy' | 'progression' | 'execution' | 'program';

interface Props {
  meso: MesoCycle;
  logs: Log[];
  onClose: () => void;
  lang: 'en' | 'es';
}

const guideIds: Record<Exclude<Panel, 'home' | 'program'>, string[]> = {
  philosophy: ['guts-identity', 'nh-85-rule', 'nh-stability', 'guts-source-scope'],
  progression: ['nh-evolving-reps', 'nh-evolving-sets', 'nh-failure'],
  execution: ['nh-supersets', 'nh-recovery-schedule'],
};

export const GutsProgramHub: React.FC<Props> = ({ meso, logs, onClose, lang }) => {
  const [panel, setPanel] = useState<Panel>('home');
  const resolvedWeek = useMemo(
    () => resolveProgramWeek(GUTS_BLACK_SWORDSMAN_V1, meso.week, meso.programSystem?.substitutions || {}),
    [meso.programSystem?.substitutions, meso.week],
  );
  const resolvedThisWeek = useMemo(() => new Set(
    logs
      .filter(log => log.mesoId === meso.id && log.week === meso.week)
      .map(log => log.dayIdx)
      .filter(dayIdx => dayIdx >= 0 && dayIdx < GUTS_BLACK_SWORDSMAN_V1.daysPerWeek),
  ).size, [logs, meso.id, meso.week]);
  const expectedResolved = Math.max(1, ((meso.week - 1) * 4) + resolvedThisWeek);
  const metrics = calculateProgramMetrics(
    logs,
    meso.id,
    expectedResolved,
    meso.programSystem?.startedBodyWeight,
    GUTS_BLACK_SWORDSMAN_V1.daysPerWeek,
  );

  const text = (value: { en: string; es: string }) => value[lang];
  const accessItems: Array<{ id: Exclude<Panel, 'home'>; icon: string; label: string; description: string }> = [
    {
      id: 'philosophy', icon: 'Brain',
      label: lang === 'es' ? 'Filosofía NH' : 'NH philosophy',
      description: lang === 'es' ? 'Regla del 85%, estabilidad y por qué no se entrena por entrenar.' : 'The 85% rule, stability and why more work is not automatically better.',
    },
    {
      id: 'progression', icon: 'TrendingUp',
      label: lang === 'es' ? 'Cómo progresar' : 'How to progress',
      description: lang === 'es' ? 'Evolving reps, series como herramienta avanzada y costo del fallo.' : 'Evolving reps, sets as an advanced lever and the cost of failure.',
    },
    {
      id: 'execution', icon: 'Timer',
      label: lang === 'es' ? 'Superseries y recuperación' : 'Supersets & recovery',
      description: lang === 'es' ? 'Cómo ejecutar las parejas y respetar el calendario de recuperación.' : 'How to run the pairings and respect the recovery schedule.',
    },
    {
      id: 'program', icon: 'Calendar',
      label: lang === 'es' ? 'Programa completo' : 'Full program',
      description: lang === 'es' ? 'Black Swordsman · 4 días · series y rangos verificados.' : 'Black Swordsman · 4 days · verified sets and ranges.',
    },
  ];

  const renderGuide = (ids: string[]) => (
    <div className="space-y-3">
      {ids.map(id => {
        const section = GUTS_GUIDE.find(item => item.id === id);
        if (!section) return null;
        return (
          <section key={id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
            <h3 className="text-sm font-black">{text(section.title)}</h3>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{text(section.summary)}</p>
            {section.points && <div className="mt-3 space-y-2">{section.points.map((point, index) => <div key={index} className="flex gap-2 text-xs leading-5 text-[rgb(var(--text-muted))]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"/><span>{text(point)}</span></div>)}</div>}
          </section>
        );
      })}
    </div>
  );

  const renderProgram = () => (
    <div className="space-y-4">
      <section className="rounded-2xl border border-primary-500/25 bg-primary-500/[0.06] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary-500">Black Swordsman · {lang === 'es' ? `Semana ${meso.week}` : `Week ${meso.week}`}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'El roster y los rangos permanecen estables. La progresión sucede dentro del rango, no porque el calendario obligue a subir peso.' : 'The roster and ranges stay stable. Progress happens inside the range, not because the calendar forces a load increase.'}</p>
      </section>
      {resolvedWeek.map((day, dayIndex) => (
        <section key={day.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{lang === 'es' ? `Día ${dayIndex + 1}` : `Day ${dayIndex + 1}`}</p><h3 className="mt-1 text-base font-black">{typeof day.dayName === 'object' ? day.dayName[lang] : day.dayName}</h3></div><span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-[9px] font-black text-[rgb(var(--text-muted))]">{day.slots.length} EX</span></div>
          <div className="mt-3 divide-y divide-[rgb(var(--border-subtle)/0.7)]">
            {day.slots.map(slot => {
              const first = slot.prescription?.[0];
              const range = first?.repRange ? (first.repRange.min === first.repRange.max ? `${first.repRange.min}` : `${first.repRange.min}–${first.repRange.max}`) : first?.reps ?? slot.reps ?? '—';
              return <div key={slot.programSlotId || slot.exerciseId || slot.programSourceName} className="grid grid-cols-[1fr_auto] gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-bold">{slot.programSourceName || slot.exerciseId}</p><p className="mt-0.5 text-[10px] text-[rgb(var(--text-muted))]">{slot.supersetId ? (slot.supersetId.includes('gs') ? 'Giant set' : 'Superset') : ''}</p></div><div className="text-right"><p className="text-xs font-black tabular-nums">{slot.setTarget} × {range}</p></div></div>;
            })}
          </div>
        </section>
      ))}
    </div>
  );

  const home = (
    <div className="space-y-5">
      <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500">Natural Hypertrophy · GUTS</p>
        <h1 className="mt-2 text-3xl font-black">{lang === 'es' ? 'Semana' : 'Week'} {meso.week} / 12</h1>
        <p className="mt-2 text-sm font-black text-[rgb(var(--text-secondary))]">Black Swordsman</p>
        <p className="mt-3 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Lun · Mié · Vie · Sáb. Conserva el roster, acumula reps de calidad y usa la recuperación como parte del programa.' : 'Mon · Wed · Fri · Sat. Keep the roster stable, accumulate quality reps and treat recovery as part of the program.'}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]"><div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, (meso.week / 12) * 100)}%` }} /></div>
      </section>
      <div className="grid grid-cols-3 gap-2">{[[lang === 'es' ? 'Sesiones' : 'Sessions', metrics.sessionsCompleted],[lang === 'es' ? 'Series' : 'Sets', metrics.setsCompleted],[lang === 'es' ? 'Adherencia' : 'Adherence', `${Math.round(metrics.adherence * 100)}%`]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-3 text-center"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[rgb(var(--text-muted))]">{label}</p><p className="mt-1 text-lg font-black">{value}</p></div>)}</div>
      <section><p className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.14em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Entender GUTS' : 'Understand GUTS'}</p><div className="space-y-2">{accessItems.map(item => <button key={item.id} type="button" onClick={() => setPanel(item.id)} className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 py-3 text-left active:bg-[rgb(var(--surface-elevated))]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name={item.icon} size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-black">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-[rgb(var(--text-muted))]">{item.description}</span></span><Icon name="ChevronRight" size={17} className="shrink-0 text-[rgb(var(--text-muted))]"/></button>)}</div></section>
    </div>
  );

  const content = (
    <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
      <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe"><div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3"><button type="button" onClick={panel === 'home' ? onClose : () => setPanel('home')} className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]" aria-label={lang === 'es' ? 'Volver' : 'Back'}><Icon name="ChevronLeft" size={21}/></button><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">GUTS · NH</p><p className="truncate text-sm font-black">{panel === 'home' ? (lang === 'es' ? 'Centro del programa' : 'Program Hub') : accessItems.find(item => item.id === panel)?.label}</p></div></div></header>
      <main className="flex-1 overflow-y-auto scroll-container"><div className="mx-auto w-full max-w-xl p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">{panel === 'home' ? home : panel === 'program' ? renderProgram() : renderGuide(guideIds[panel])}</div></main>
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
};
