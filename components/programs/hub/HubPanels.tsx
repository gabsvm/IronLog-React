// U5: ProgramHub panels as top-level components (they were defined inside
// the render, so React re-created and remounted them on every render).
import { pickLang } from '../../../utils/i18n';
import React from 'react';
import { Icon } from '../../ui/Icon';
import { KONG_4DAY_V1 } from '../../../programs/kong/kong4Day';
import { KONG_GUIDE } from '../../../programs/kong/kongGuide';
import { ES_DAY_COPY, PRINCIPLE_IDS, BLOCK_GUIDE_IDS } from './hubData';
import type { HubState } from './useProgramHubState';

export const HubHeader: React.FC<{ s: HubState }> = ({ s }) => {
    const { panel, h, accessItems, goHome, closeHub } = s;
  return (
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
};

export const HubHero: React.FC<{ s: HubState }> = ({ s }) => {
    const { meso, block, blockWeek, h, blockName } = s;
  return (
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
};

export const HubMetricGrid: React.FC<{ s: HubState }> = ({ s }) => {
    const { metricCards } = s;
  return (
    <div className="grid grid-cols-2 gap-3">
      {metricCards.map((card) => (
        <div key={card.key} className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4">
          <p className="text-xs text-[rgb(var(--text-muted))]">{card.label}</p>
          <p className="mt-2 text-2xl font-black">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export const HubHome: React.FC<{ s: HubState }> = ({ s }) => {
    const { setPanel, block, metrics, h, accessItems } = s;
  return (
    <div className="space-y-5">
      <HubHero s={s} />
      <HubMetricGrid s={s} />
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
};

export const HubBlock: React.FC<{ s: HubState }> = ({ s }) => {
    const { block, h, title, blockName, blockGoal } = s;
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

export const HubPrinciples: React.FC<{ s: HubState }> = ({ s }) => {
    const { openPrinciple, setOpenPrinciple, h, title } = s;
  return (
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
};

export const HubRpe: React.FC<{ s: HubState }> = ({ s }) => {
    const { h, title } = s;
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

export const HubSubstitutions: React.FC<{ s: HubState }> = ({ s }) => {
    const { h, persistentSubstitutions } = s;
  return (
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
};

export const HubProgram: React.FC<{ s: HubState }> = ({ s }) => {
    const { lang, selectedWeek, setSelectedWeek, selectedDay, setSelectedDay, h, title, blockName, selectedResolution, selectedResolvedDay } = s;
  return (
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
};

export const HubProgress: React.FC<{ s: HubState }> = ({ s }) => {
    const { scheduleProgress, metrics, h } = s;
  return (
    <div className="space-y-5">
      <HubHero s={s} />
      <HubMetricGrid s={s} />
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
};
