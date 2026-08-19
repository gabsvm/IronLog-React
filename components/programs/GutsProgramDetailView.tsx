import React from 'react';
import { Icon } from '../ui/Icon';
import { GUTS_BLACK_SWORDSMAN_V1, GUTS_BLACK_SWORDSMAN_DAY_SPECS } from '../../programs/naturalHypertrophy/gutsBlackSwordsman';
import { GUTS_GUIDE } from '../../programs/naturalHypertrophy/gutsGuide';

interface Props {
  lang: 'en' | 'es';
  onBack: () => void;
  onStart: () => void;
}

export const GutsProgramDetailView: React.FC<Props> = ({ lang, onBack, onStart }) => {
  const text = (value: { en: string; es: string }) => value[lang];
  const philosophy = GUTS_GUIDE.find(section => section.id === 'nh-85-rule');
  const progression = GUTS_GUIDE.find(section => section.id === 'nh-evolving-reps');
  const sourceScope = GUTS_GUIDE.find(section => section.id === 'guts-source-scope');

  return (
    <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
      <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3">
          <button type="button" onClick={onBack} className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]" aria-label={lang === 'es' ? 'Volver' : 'Back'}>
            <Icon name="ChevronLeft" size={21} />
          </button>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-500">Natural Hypertrophy</p>
            <p className="text-sm font-black">GUTS · Black Swordsman</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-container">
        <div className="mx-auto w-full max-w-xl space-y-5 p-4 pb-32">
          <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary-500">{lang === 'es' ? 'Programa estructurado · variante verificada' : 'Structured program · verified variation'}</p>
            <h1 className="mt-2 text-3xl font-black">GUTS</h1>
            <p className="mt-1 text-base font-black text-[rgb(var(--text-secondary))]">Black Swordsman</p>
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">{text(GUTS_BLACK_SWORDSMAN_V1.subtitle)}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[
                ['12', lang === 'es' ? 'semanas' : 'weeks'],
                ['4', lang === 'es' ? 'días / semana' : 'days / week'],
                ['NH', lang === 'es' ? 'filosofía' : 'philosophy'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl bg-[rgb(var(--surface-base)/0.65)] p-3 text-center">
                  <p className="text-xl font-black">{value}</p>
                  <p className="mt-1 text-[9px] font-bold leading-4 text-[rgb(var(--text-muted))]">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
            <div className="flex items-center gap-2"><Icon name="Brain" size={16} className="text-primary-500" /><h2 className="text-sm font-black">{lang === 'es' ? 'Regla del 85%' : 'The 85% rule'}</h2></div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{philosophy ? text(philosophy.summary) : ''}</p>
            <p className="mt-3 rounded-xl bg-[rgb(var(--surface-base))] p-3 text-[10px] leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'No significa 85% del 1RM. En GainsLab se presenta como NH la plantea: una relación entre trabajo útil, intensidad y recuperación.' : 'It does not mean 85% of 1RM. GainsLab presents it as NH frames it: a relationship between useful work, intensity and recovery.'}</p>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
            <div className="flex items-center gap-2"><Icon name="TrendingUp" size={16} className="text-primary-500" /><h2 className="text-sm font-black">{lang === 'es' ? 'Evolving rep ranges' : 'Evolving rep ranges'}</h2></div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{progression ? text(progression.summary) : ''}</p>
            <div className="mt-3 rounded-xl bg-[rgb(var(--surface-base))] p-3 text-xs leading-5 text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Ejemplo: 3×6–10. 8/7/6 no es una serie fallida. Conserva la carga y construye reps. Cuando el rango esté claramente maduro, considera el incremento práctico más pequeño.' : 'Example: 3×6–10. 8/7/6 is not a failed set. Keep the load and build reps. Once the range has clearly matured, consider the smallest practical increase.'}</div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black">{lang === 'es' ? 'Black Swordsman · 4 días' : 'Black Swordsman · 4 days'}</h2><span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">Mon · Wed · Fri · Sat</span></div>
            <div className="space-y-2">
              {GUTS_BLACK_SWORDSMAN_DAY_SPECS.map(day => (
                <div key={day.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-primary-500">{lang === 'es' ? `Día ${day.dayNumber}` : `Day ${day.dayNumber}`}</p><h3 className="mt-1 text-base font-black">{day.name[lang]}</h3></div>
                    <span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-[9px] font-black text-[rgb(var(--text-muted))]">{day.slots.length} EX</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-muted))]">{day.focus[lang]}</p>
                  <div className="mt-3 divide-y divide-[rgb(var(--border-subtle)/0.65)]">
                    {day.slots.map(slot => (
                      <div key={slot.slotId} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0"><p className="truncate text-[11px] font-bold">{slot.sourceExerciseName}</p><p className="mt-0.5 text-[9px] text-[rgb(var(--text-muted))]">{slot.supersetId.includes('gs') ? 'Giant set' : 'Superset'}</p></div>
                        <p className="shrink-0 text-[11px] font-black tabular-nums">{slot.sets}×{slot.range[0] === slot.range[1] ? slot.range[0] : `${slot.range[0]}–${slot.range[1]}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
            <div className="flex items-center gap-2"><Icon name="Info" size={16} className="text-amber-400" /><h2 className="text-sm font-black">{lang === 'es' ? 'Trazabilidad' : 'Source scope'}</h2></div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--text-secondary))]">{sourceScope ? text(sourceScope.summary) : ''}</p>
          </section>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-[rgb(var(--surface-app))] via-[rgb(var(--surface-app)/0.98)] to-transparent px-4 pb-safe pt-5">
        <div className="pointer-events-auto mx-auto max-w-xl pb-4"><button type="button" onClick={onStart} className="min-h-12 w-full rounded-2xl bg-primary-500 px-4 text-sm font-black text-black active:scale-[0.99]">{lang === 'es' ? 'Empezar Black Swordsman' : 'Start Black Swordsman'}</button></div>
      </div>
    </div>
  );
};
