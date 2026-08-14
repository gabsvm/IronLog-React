import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { KONG_GUIDE } from '../../programs/kong/kongGuide';

interface Props {
  lang: 'en' | 'es';
  onBack: () => void;
  onStart: () => void;
}

type Tab = 'overview' | 'weeks' | 'guide';

const ES_BLOCK_COPY: Record<number, { name: string; goal: string }> = {
  1: { name: 'Capacidad / Puntos débiles', goal: 'Puntos débiles primero · densidad · altas reps' },
  2: { name: 'Pirámides / Fuerza fatigada', goal: 'Compounds primero · pirámides tradicionales' },
  3: { name: 'Sobrecarga / Pirámides inversas', goal: 'Top sets frescos · backoffs de altas reps' },
};

const ES_DAY_COPY: Record<number, string[]> = {
  1: ['Brazos y pecho', 'Cadena posterior y espalda', 'Brazos y hombros', 'Piernas y espalda'],
  2: ['Hombros y brazos', 'Cadena posterior y espalda', 'Pecho y brazos', 'Piernas y espalda'],
  3: ['Pressing y brazos', 'Peso muerto y espalda', 'Pecho y brazos', 'Sentadilla y espalda'],
};

export const ProgramDetailView: React.FC<Props> = ({ lang, onBack, onStart }) => {
  const [tab, setTab] = useState<Tab>('overview');
  const [openGuideId, setOpenGuideId] = useState<string>('what-is-kong');
  const title = (text: { en: string; es: string }) => text[lang];

  const blockName = (block: (typeof KONG_4DAY_V1.blocks)[number]) =>
    lang === 'es' ? ES_BLOCK_COPY[block.number]?.name || title(block.name) : title(block.name);

  const blockGoal = (block: (typeof KONG_4DAY_V1.blocks)[number]) =>
    lang === 'es' ? ES_BLOCK_COPY[block.number]?.goal || title(block.goal) : title(block.goal);

  return (
    <div
      className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]"
      role="dialog"
      aria-modal="true"
      aria-label="KONG — Savage Size"
    >
      <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] active:scale-95"
            aria-label={lang === 'es' ? 'Volver' : 'Back'}
          >
            <Icon name="ChevronLeft" size={22} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
            <p className="truncate text-sm font-black">Savage Size · 4 Day</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-container">
        <div className="mx-auto w-full max-w-xl p-5 pb-6">
          <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Savage Size · 4 Day</h1>
            <p className="mt-2 text-lg text-[rgb(var(--text-secondary))]">Alexander Bromley</p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              <div><strong className="block text-lg">12</strong><span className="text-xs font-bold text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'semanas' : 'weeks'}</span></div>
              <div><strong className="block text-lg">4</strong><span className="text-xs font-bold text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'días' : 'days'}</span></div>
              <div><strong className="block text-lg">3</strong><span className="text-xs font-bold text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'bloques' : 'blocks'}</span></div>
            </div>
          </section>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-[rgb(var(--surface-raised))] p-1.5">
            {([
              ['overview', lang === 'es' ? 'Cómo funciona' : 'How it works'],
              ['weeks', lang === 'es' ? '12 semanas' : '12 weeks'],
              ['guide', lang === 'es' ? 'Guía' : 'Guide'],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`min-h-11 rounded-xl px-2 text-xs font-black transition-colors ${tab === id ? 'bg-primary-500 text-black' : 'text-[rgb(var(--text-secondary))]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="mt-5 space-y-3">
              {KONG_4DAY_V1.blocks.map((block) => (
                <article key={block.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-primary-500">
                    {lang === 'es' ? 'BLOQUE' : 'BLOCK'} {block.number} · {block.globalWeekStart}-{block.globalWeekEnd}
                  </p>
                  <h2 className="mt-2 text-xl font-black">{blockName(block)}</h2>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">{blockGoal(block)}</p>
                </article>
              ))}
            </div>
          )}

          {tab === 'weeks' && (
            <div className="mt-5 space-y-4">
              <p className="px-1 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                {lang === 'es'
                  ? 'Cada bloque dura 4 semanas y conserva 4 días de entrenamiento. La prescripción de series, reps y RPE cambia automáticamente con la semana.'
                  : 'Each block lasts 4 weeks with 4 training days. Sets, reps and RPE prescriptions change automatically with the week.'}
              </p>
              {KONG_4DAY_V1.blocks.map((block) => (
                <article key={block.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-primary-500">
                        {lang === 'es' ? 'BLOQUE' : 'BLOCK'} {block.number}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{blockName(block)}</h2>
                    </div>
                    <span className="rounded-full bg-primary-500/10 px-3 py-1 text-[10px] font-black text-primary-500">
                      {lang === 'es' ? 'SEM.' : 'WK'} {block.globalWeekStart}-{block.globalWeekEnd}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {Array.from({ length: 4 }, (_, index) => block.globalWeekStart + index).map((week) => (
                      <div key={week} className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] py-2 text-center">
                        <span className="text-[9px] font-bold uppercase text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Semana' : 'Week'}</span>
                        <strong className="block text-sm">{week}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {block.days.map((day, index) => (
                      <div key={day.id} className="flex items-center gap-3 rounded-xl bg-[rgb(var(--surface-base))] px-3 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-xs font-black text-primary-500">{index + 1}</span>
                        <span className="min-w-0 text-sm font-bold">
                          {lang === 'es' ? ES_DAY_COPY[block.number]?.[index] || title(day.name) : title(day.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === 'guide' && (
            <div className="mt-5 space-y-3">
              <p className="px-1 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                {lang === 'es'
                  ? 'La guía resume la lógica del programa. Toca una sección para abrirla.'
                  : 'The guide summarizes the program logic. Tap a section to expand it.'}
              </p>
              {KONG_GUIDE.map((section) => {
                const open = openGuideId === section.id;
                return (
                  <article key={section.id} className="overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
                    <button
                      type="button"
                      onClick={() => setOpenGuideId(open ? '' : section.id)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <h2 className="font-black">{title(section.title)}</h2>
                      <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} className="shrink-0 text-[rgb(var(--text-muted))]" />
                    </button>
                    {open && (
                      <p className="border-t border-[rgb(var(--border-subtle))] px-4 py-4 text-left text-sm leading-6 text-[rgb(var(--text-secondary))]">
                        {title(section.summary)}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-5 pt-3 pb-safe">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onStart}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 px-5 text-base font-black text-black shadow-lg shadow-primary-500/20 active:scale-[0.99]"
          >
            <Icon name="Play" size={20} fill="currentColor" />
            {lang === 'es' ? 'Comenzar KONG' : 'Start KONG'}
          </button>
          <p className="pb-2 pt-2 text-center text-[10px] font-bold uppercase tracking-wider text-[rgb(var(--text-muted))]">
            {lang === 'es' ? 'Empieza en Semana 1 · Bloque 1' : 'Starts at Week 1 · Block 1'}
          </p>
        </div>
      </footer>
    </div>
  );
};
