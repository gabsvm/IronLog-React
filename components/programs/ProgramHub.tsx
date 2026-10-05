import { pickLang } from '../../utils/i18n';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Log, MesoCycle } from '../../types';
import { Icon } from '../ui/Icon';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { KONG_GUIDE } from '../../programs/kong/kongGuide';
import { getProgramBlockForWeek, resolveProgramDay } from '../../programs/engine/ProgramResolver';
import { calculateProgramMetrics } from '../../programs/engine/ProgramMetrics';
import { TRANSLATIONS } from '../../constants';

type HubPanel = 'home' | 'block' | 'principles' | 'rpe' | 'substitutions' | 'program' | 'progress';

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

const PRINCIPLE_IDS = [
  'weak-points',
  'density',
  'volume',
  'high-reps',
  'fatigued-strength',
  'load-variation',
  'phase-potentiation',
] as const;

const BLOCK_GUIDE_IDS: Record<number, string[]> = {
  1: ['weak-points', 'density', 'volume', 'high-reps'],
  2: ['fatigued-strength', 'load-variation', 'rpe'],
  3: ['phase-potentiation', 'load-variation', 'rpe'],
};

interface Props {
  meso: MesoCycle;
  logs: Log[];
  onClose: () => void;
  lang: 'en' | 'es';
}

export const ProgramHub: React.FC<Props> = ({ meso, logs, onClose, lang }) => {
  const [panel, setPanel] = useState<HubPanel>('home');
  const [selectedWeek, setSelectedWeek] = useState(Math.max(1, Math.min(12, meso.week || 1)));
  const [selectedDay, setSelectedDay] = useState(0);
  const [openPrinciple, setOpenPrinciple] = useState<string>('weak-points');
  const onCloseRef = useRef(onClose);
  const handlingPopState = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentState = window.history.state || {};
    window.history.pushState({ ...currentState, kongHub: true, kongPanel: 'home' }, '', '#kong');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.kongHub) {
        handlingPopState.current = true;
        setPanel(event.state.kongPanel || 'home');
        return;
      }
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (handlingPopState.current) {
      handlingPopState.current = false;
      return;
    }
    const currentState = window.history.state;
    if (!currentState?.kongHub || currentState.kongPanel === panel) return;
    window.history.pushState({ ...currentState, kongPanel: panel }, '', `#kong-${panel}`);
  }, [panel]);

  const { block, blockWeek } = getProgramBlockForWeek(KONG_4DAY_V1, meso.week);
  const scheduleProgress = useMemo(() => {
    const resolved = new Set<string>();
    const completed = new Set<string>();
    logs.forEach((log) => {
      if (log.mesoId !== meso.id || log.week < 1 || log.week > meso.week || log.dayIdx < 0 || log.dayIdx >= KONG_4DAY_V1.daysPerWeek) return;
      const key = `${log.week}:${log.dayIdx}`;
      resolved.add(key);
      if (!log.skipped) completed.add(key);
    });
    return { resolved: resolved.size, completed: completed.size };
  }, [logs, meso.id, meso.week]);
  const metrics = calculateProgramMetrics(logs, meso.id, scheduleProgress.resolved, meso.programSystem?.startedBodyWeight, KONG_4DAY_V1.daysPerWeek);
  const h = TRANSLATIONS[lang].programHub;
  const title = (text: { en: string; es: string }) => text[lang];
  const blockName = (blockNumber: number) =>
    pickLang(lang, { es: ES_BLOCK_COPY[blockNumber]?.name, en: undefined }) || title(KONG_4DAY_V1.blocks[blockNumber - 1].name);
  const blockGoal = (blockNumber: number) =>
    pickLang(lang, { es: ES_BLOCK_COPY[blockNumber]?.goal, en: undefined }) || title(KONG_4DAY_V1.blocks[blockNumber - 1].goal);

  const selectedResolution = getProgramBlockForWeek(KONG_4DAY_V1, selectedWeek);
  const selectedResolvedDay = resolveProgramDay(KONG_4DAY_V1, selectedWeek, selectedDay, meso.programSystem?.substitutions || {});

  const persistentSubstitutions = useMemo(() => {
    const substitutions = meso.programSystem?.substitutions || {};
    const allSlots = KONG_4DAY_V1.blocks.flatMap((candidateBlock) => candidateBlock.days.flatMap((day) => day.exercises));
    return Object.entries(substitutions).map(([slotId, replacementId]) => {
      const slot = allSlots.find((candidate) => candidate.slotId === slotId);
      return {
        slotId,
        source: slot?.sourceExerciseName || slotId,
        replacement: String(replacementId).replaceAll('_', ' '),
      };
    });
  }, [meso.programSystem?.substitutions]);

  const metricCards: Array<{ key: keyof typeof metrics; label: string; value: string }> = [
    { key: 'sessionsCompleted', label: h.metricSessions, value: String(metrics.sessionsCompleted) },
    { key: 'weeksCompleted', label: h.metricWeeks, value: String(metrics.weeksCompleted) },
    { key: 'setsCompleted', label: h.metricSets, value: String(metrics.setsCompleted) },
    { key: 'totalVolume', label: h.metricVolume, value: Math.round(metrics.totalVolume).toLocaleString() },
    { key: 'totalSeconds', label: h.metricTimeMin, value: String(Math.round(metrics.totalSeconds / 60)) },
    { key: 'averageDensity', label: h.metricDensity, value: metrics.averageDensity.toFixed(metrics.averageDensity >= 10 ? 0 : 1) },
    { key: 'adherence', label: h.metricAdherence, value: `${Math.round(metrics.adherence * 100)}%` },
  ];

  const accessItems: Array<{ id: HubPanel; icon: string; label: string; description: string }> = [
    {
      id: 'block',
      icon: 'Layers',
      label: h.accessBlockLabel,
      description: `${h.blockWord} ${block.number} · ${blockName(block.number)}`,
    },
    {
      id: 'principles',
      icon: 'BookOpen',
      label: h.accessPrinciplesLabel,
      description: h.accessPrinciplesDesc,
    },
    {
      id: 'rpe',
      icon: 'Target',
      label: h.accessRpeLabel,
      description: h.accessRpeDesc,
    },
    {
      id: 'substitutions',
      icon: 'Repeat2',
      label: h.accessSubsLabel,
      description: persistentSubstitutions.length > 0
        ? `${persistentSubstitutions.length} ${persistentSubstitutions.length === 1 ? h.subsChangeOne : h.subsChangeMany}`
        : h.accessSubsEmpty,
    },
    {
      id: 'program',
      icon: 'Calendar',
      label: h.accessProgramLabel,
      description: h.accessProgramDesc,
    },
    {
      id: 'progress',
      icon: 'TrendingUp',
      label: h.accessProgressLabel,
      description: h.accessProgressDesc,
    },
  ];

  const goHome = () => {
    if (typeof window !== 'undefined' && window.history.state?.kongHub && panel !== 'home') {
      window.history.back();
      return;
    }
    setPanel('home');
  };

  const closeHub = () => {
    if (typeof window !== 'undefined' && window.history.state?.kongHub) {
      window.history.back();
      return;
    }
    onCloseRef.current();
  };

  const Header = () => (
    <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
      <div className="mx-auto flex h-14 w-full max-w-xl items-center gap-3">
        <button
          type="button"
          onClick={panel === 'home' ? closeHub : goHome}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] active:scale-95"
          aria-label={panel === 'home' ? h.close : h.goBack}
        >
          <Icon name="ChevronLeft" size={22} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
          <p className="truncate text-sm font-black">
            {panel === 'home'
              ? h.hubTitle
              : accessItems.find((item) => item.id === panel)?.label}
          </p>
        </div>
      </div>
    </header>
  );

  const Hero = () => (
    <section className="rounded-3xl border border-primary-500/30 bg-gradient-to-br from-primary-500/15 to-[rgb(var(--surface-raised))] p-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary-500">KONG · {h.blockWord} {block.number}</p>
      <h1 className="mt-2 text-3xl font-black">{h.heroWeek} {meso.week} / 12</h1>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">
        {blockName(block.number)} · {h.heroBlockWeek} {blockWeek} / 4
      </p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]">
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${(meso.week / 12) * 100}%` }} />
      </div>
    </section>
  );

  const MetricGrid = () => (
    <div className="grid grid-cols-2 gap-3">
      {metricCards.map((card) => (
        <div key={card.key} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
          <p className="text-xs text-[rgb(var(--text-muted))]">{card.label}</p>
          <p className="mt-2 text-2xl font-black">{card.value}</p>
        </div>
      ))}
    </div>
  );

  const renderHome = () => (
    <div className="space-y-5">
      <Hero />
      <MetricGrid />
      <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-sm text-[rgb(var(--text-secondary))]">
        {metrics.initialBodyWeight || metrics.currentBodyWeight
          ? `${h.bodyWeight}: ${metrics.initialBodyWeight ?? '—'} → ${metrics.currentBodyWeight ?? '—'}`
          : h.bodyWeightNoData}
      </div>

      <section>
        <p className="mb-3 px-1 text-xs font-black uppercase tracking-widest text-[rgb(var(--text-muted))]">{h.accessTitle}</p>
        <div className="space-y-2">
          {accessItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id)}
              className="flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] px-4 py-3 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                <Icon name={item.icon} size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-[rgb(var(--text-muted))]">{item.description}</span>
              </span>
              <Icon name="ChevronRight" size={18} className="shrink-0 text-[rgb(var(--text-muted))]" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderBlock = () => {
    const sections = KONG_GUIDE.filter((section) => (BLOCK_GUIDE_IDS[block.number] || []).includes(section.id));
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-primary-500/30 bg-primary-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-500">{h.blockWord} {block.number} · {h.blockWeeksWord} {block.globalWeekStart}-{block.globalWeekEnd}</p>
          <h1 className="mt-2 text-2xl font-black">{blockName(block.number)}</h1>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">{blockGoal(block.number)}</p>
        </section>
        {sections.map((section) => (
          <article key={section.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5">
            <h2 className="font-black">{title(section.title)}</h2>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--text-secondary))]">{title(section.summary)}</p>
          </article>
        ))}
        {block.number === 1 && (
          <div className="rounded-2xl border border-primary-500/25 bg-primary-500/10 p-4 text-sm leading-6 text-[rgb(var(--text-secondary))]">
            <strong className="text-primary-500">{h.restTitle}</strong>{' '}
            {h.restBody}
          </div>
        )}
      </div>
    );
  };

  const renderPrinciples = () => (
    <div className="space-y-3">
      {PRINCIPLE_IDS.map((id, index) => {
        const section = KONG_GUIDE.find((candidate) => candidate.id === id);
        if (!section) return null;
        const open = openPrinciple === id;
        return (
          <article key={id} className="overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
            <button type="button" onClick={() => setOpenPrinciple(open ? '' : id)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-sm font-black text-primary-500">{index + 1}</span>
              <span className="flex-1 font-black">{title(section.title).replace(/^Principio \d+ — |^Tenet \d+ — /, '')}</span>
              <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={18} className="text-[rgb(var(--text-muted))]" />
            </button>
            {open && <p className="border-t border-[rgb(var(--border-subtle))] px-4 py-4 text-sm leading-6 text-[rgb(var(--text-secondary))]">{title(section.summary)}</p>}
          </article>
        );
      })}
    </div>
  );

  const renderRpe = () => {
    const section = KONG_GUIDE.find((candidate) => candidate.id === 'rpe');
    return (
      <div className="space-y-4">
        <section className="rounded-3xl border border-primary-500/30 bg-primary-500/10 p-5">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-500">RPE</p>
          <h1 className="mt-2 text-2xl font-black">{section ? title(section.title) : 'RPE en KONG'}</h1>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">{section ? title(section.summary) : ''}</p>
        </section>
        <article className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5">
          <h2 className="font-black">{h.rpePractice}</h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
            <p>{h.rpeTip1}</p>
            <p>{h.rpeTip2}</p>
            <p>{h.rpeTip3}</p>
          </div>
        </article>
      </div>
    );
  };

  const renderSubstitutions = () => (
    <div className="space-y-4">
      <section className="rounded-3xl border border-primary-500/30 bg-primary-500/10 p-5">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-primary-500">{h.subsEyebrow}</p>
        <h1 className="mt-2 text-2xl font-black">{h.subsTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
          {h.subsIntro}
        </p>
      </section>

      <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-sm leading-6 text-[rgb(var(--text-secondary))]">
        {h.subsScope}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-[rgb(var(--text-muted))]">{h.subsPersistent}</h2>
          <span className="rounded-full bg-primary-500/10 px-2.5 py-1 text-[10px] font-black text-primary-500">{persistentSubstitutions.length}</span>
        </div>
        {persistentSubstitutions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[rgb(var(--border-strong))] p-6 text-center text-sm text-[rgb(var(--text-muted))]">
            {h.subsNone}
          </div>
        ) : (
          <div className="space-y-2">
            {persistentSubstitutions.map((item) => (
              <div key={item.slotId} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
                <p className="text-xs text-[rgb(var(--text-muted))]">{item.source}</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-black"><Icon name="ArrowRight" size={15} className="text-primary-500" /><span className="capitalize">{item.replacement}</span></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  const renderProgram = () => (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[rgb(var(--text-secondary))]">
        {h.programIntro}
      </p>
      {KONG_4DAY_V1.blocks.map((candidateBlock) => (
        <section key={candidateBlock.id} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-primary-500">{h.blockWord} {candidateBlock.number}</p>
              <h2 className="mt-1 text-sm font-black">{blockName(candidateBlock.number)}</h2>
            </div>
            <span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">{candidateBlock.globalWeekStart}-{candidateBlock.globalWeekEnd}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, index) => candidateBlock.globalWeekStart + index).map((week) => (
              <button
                key={week}
                type="button"
                onClick={() => { setSelectedWeek(week); setSelectedDay(0); }}
                className={`min-h-11 rounded-xl border text-xs font-black ${selectedWeek === week ? 'border-primary-500 bg-primary-500 text-black' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-secondary))]'}`}
              >
                {h.weekAbbr}{week}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-3xl border border-primary-500/25 bg-[rgb(var(--surface-raised))] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary-500">{h.weekWord} {selectedWeek} · {h.blockWord} {selectedResolution.block.number}</p>
            <h2 className="mt-1 font-black">{blockName(selectedResolution.block.number)}</h2>
          </div>
          <span className="rounded-full bg-primary-500/10 px-2.5 py-1 text-[10px] font-black text-primary-500">{selectedResolution.blockWeek}/4</span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {selectedResolution.block.days.map((day, index) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDay(index)}
              className={`min-h-12 rounded-xl border text-xs font-black ${selectedDay === index ? 'border-primary-500 bg-primary-500/15 text-primary-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] text-[rgb(var(--text-secondary))]'}`}
            >
              {h.dayWord} {index + 1}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-[rgb(var(--surface-base))] p-4">
          <h3 className="font-black">{pickLang(lang, { es: ES_DAY_COPY[selectedResolution.block.number]?.[selectedDay], en: undefined }) || title(selectedResolvedDay.dayName)}</h3>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{selectedResolvedDay.slots.length} {h.exercisesLower}</p>
        </div>

        <div className="mt-3 space-y-2">
          {selectedResolvedDay.slots.map((slot, index) => {
            const prescription = slot.prescription || [];
            const repsText = prescription.map((set) => set.reps === 'FAILURE' ? h.failure : String(set.reps)).join(' · ');
            const rpes = prescription.map((set) => set.targetRpe).filter((value): value is number => typeof value === 'number');
            const uniqueRpes = Array.from(new Set(rpes));
            const rpeText = uniqueRpes.length === 1 ? `RPE ${uniqueRpes[0]}` : uniqueRpes.length > 1 ? `RPE ${rpes.join('/')}` : '';
            return (
              <div key={slot.programSlotId || `${slot.exerciseId}-${index}`} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base))] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[rgb(var(--text-muted))]">#{index + 1}</span>
                      {slot.supersetId && <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-primary-500">SUPERSET</span>}
                    </div>
                    <h4 className="mt-1 text-sm font-black">{slot.programSourceName || slot.exerciseId || slot.muscle}</h4>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-primary-500/10 px-2.5 py-1.5 text-xs font-black text-primary-500">{repsText}</span>
                  {rpeText && <span className="rounded-lg bg-[rgb(var(--surface-raised))] px-2.5 py-1.5 text-xs font-bold text-[rgb(var(--text-secondary))]">{rpeText}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-5">
      <Hero />
      <MetricGrid />
      <section className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[rgb(var(--text-muted))]">{h.resolvedLabel}</p>
            <p className="mt-1 text-2xl font-black">{scheduleProgress.completed} / {scheduleProgress.resolved}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/10 text-lg font-black text-primary-500">{Math.round(metrics.adherence * 100)}%</div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-elevated))]">
          <div className="h-full rounded-full bg-primary-500" style={{ width: `${Math.min(100, metrics.adherence * 100)}%` }} />
        </div>
        <p className="mt-3 text-[11px] leading-5 text-[rgb(var(--text-muted))]">
          {h.adherenceNote}
        </p>
      </section>
      <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-sm text-[rgb(var(--text-secondary))]">
        {metrics.initialBodyWeight || metrics.currentBodyWeight
          ? `${h.bodyWeight}: ${metrics.initialBodyWeight ?? '—'} → ${metrics.currentBodyWeight ?? '—'}`
          : h.bodyWeightNoFollowup}
      </div>
    </div>
  );

  const content = panel === 'home' ? renderHome()
    : panel === 'block' ? renderBlock()
      : panel === 'principles' ? renderPrinciples()
        : panel === 'rpe' ? renderRpe()
          : panel === 'substitutions' ? renderSubstitutions()
            : panel === 'program' ? renderProgram()
              : renderProgress();

  const hub = (
    <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]" role="dialog" aria-modal="true" aria-label="KONG Program Hub">
      <Header />
      <main className="flex-1 overflow-y-auto scroll-container">
        <div className="mx-auto w-full max-w-xl p-5 pb-[calc(var(--safe-area-bottom)+24px)]">
          {content}
        </div>
      </main>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(hub, document.body) : hub;
};
