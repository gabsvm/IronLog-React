import React from 'react';
import { Icon } from '../ui/Icon';
import { PERFORMANCE_UPPER_LOWER_V1, PERFORMANCE_DAY_SPECS } from '../../programs/performance/performanceUpperLower';
import { PERFORMANCE_GUIDE } from '../../programs/performance/performanceGuide';

interface Props {
  lang: 'en' | 'es';
  onBack: () => void;
  onStart: () => void;
}

export const PerformanceProgramDetailView: React.FC<Props> = ({ lang, onBack, onStart }) => {
  const text = (value: { en: string; es: string }) => value[lang];
  const philosophy = PERFORMANCE_GUIDE.find((section) => section.id === 'what-is-performance');
  const progression = PERFORMANCE_GUIDE.find((section) => section.id === 'double-progression');
  const recovery = PERFORMANCE_GUIDE.find((section) => section.id === 'recovery-gate');

  return (
    <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
      <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3">
          <button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]" aria-label={lang === 'es' ? 'Volver' : 'Back'}>
            <Icon name="ChevronLeft" size={21} />
          </button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">GainsLab</p>
            <p className="text-sm font-black">PERFORMANCE</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-container">
        <div className="mx-auto w-full max-w-xl space-y-5 p-4 pb-32">
          <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500">{lang === 'es' ? 'Programa estructurado' : 'Structured program'}</p>
            <h1 className="mt-2 text-3xl font-black">GainsLab PERFORMANCE</h1>
            <p className="mt-2 text-sm font-bold text-[rgb(var(--text-secondary))]">{text(PERFORMANCE_UPPER_LOWER_V1.subtitle)}</p>
            <p className="mt-4 text-sm leading-6 text-[rgb(var(--text-secondary))]">{philosophy ? text(philosophy.summary) : ''}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ['8', lang === 'es' ? 'ciclos' : 'cycles'],
                ['4', lang === 'es' ? 'sesiones' : 'sessions'],
                ['1', lang === 'es' ? 'día libre entre sesiones' : 'rest day between sessions'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-[rgb(var(--surface-base)/0.65)] p-3 text-center">
                  <p className="text-xl font-black">{value}</p>
                  <p className="mt-1 text-[9px] font-bold leading-4 text-[rgb(var(--text-muted))]">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
            <div className="flex items-center gap-2"><Icon name="TrendingUp" size={16} className="text-primary-500" /><h2 className="text-sm font-black">{lang === 'es' ? 'Progresión' : 'Progression'}</h2></div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{progression ? text(progression.summary) : ''}</p>
            <div className="mt-3 rounded-xl bg-[rgb(var(--surface-base))] p-3 text-xs leading-5 text-[rgb(var(--text-muted))]">
              {lang === 'es' ? 'Ejemplo: 3×6–10 @ RPE 8. Mantén la carga hasta lograr 10/10/10 alrededor del RPE previsto; recién entonces sube el incremento práctico más pequeño.' : 'Example: 3×6–10 @ RPE 8. Keep the load until you reach 10/10/10 around the intended RPE; only then add the smallest practical increment.'}
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
            <div className="flex items-center gap-2"><Icon name="BatteryCharging" size={16} className="text-primary-500" /><h2 className="text-sm font-black">Recovery Gate</h2></div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{recovery ? text(recovery.summary) : ''}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-black">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">GREEN<br/><span className="font-medium">0–1</span></div>
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">YELLOW<br/><span className="font-medium">2</span></div>
              <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">RED<br/><span className="font-medium">3+</span></div>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">{lang === 'es' ? 'Las 4 sesiones' : 'The 4 sessions'}</h2><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">Upper / Lower</span></div>
            <div className="space-y-2">
              {PERFORMANCE_DAY_SPECS.map((day) => (
                <div key={day.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary-500">{lang === 'es' ? `Sesión ${day.dayNumber}` : `Session ${day.dayNumber}`}</p><h3 className="mt-1 text-base font-black">{day.name[lang]}</h3></div><span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-[9px] font-black text-[rgb(var(--text-muted))]">{day.slots.length} EX</span></div>
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{day.focus[lang]}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {day.slots.slice(0, 4).map((slot) => <span key={slot.slotId} className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-[9px] font-bold text-[rgb(var(--text-secondary))]">{slot.sourceExerciseName}</span>)}
                    {day.slots.length > 4 && <span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-[9px] font-bold text-[rgb(var(--text-muted))]">+{day.slots.length - 4}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
            <h2 className="text-sm font-black">{lang === 'es' ? 'Fases' : 'Phases'}</h2>
            <div className="mt-3 space-y-2">
              {PERFORMANCE_UPPER_LOWER_V1.blocks.map((block) => (
                <div key={block.id} className="grid grid-cols-[4.5rem_1fr] gap-3 rounded-xl bg-[rgb(var(--surface-base))] p-3">
                  <div className="text-[10px] font-black text-primary-500">{block.globalWeekStart === block.globalWeekEnd ? `${lang === 'es' ? 'Ciclo' : 'Cycle'} ${block.globalWeekStart}` : `${block.globalWeekStart}–${block.globalWeekEnd}`}</div>
                  <div><p className="text-xs font-black">{block.name[lang]}</p><p className="mt-1 text-[10px] leading-4 text-[rgb(var(--text-muted))]">{block.goal[lang]}</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.98)] to-transparent px-4 pb-safe pt-5">
        <div className="pointer-events-auto mx-auto max-w-xl pb-4"><button type="button" onClick={onStart} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black active:scale-[0.99]">{lang === 'es' ? 'Empezar PERFORMANCE' : 'Start PERFORMANCE'}</button></div>
      </div>
    </div>
  );
};
