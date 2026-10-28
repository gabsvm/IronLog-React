import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { MuscleTag } from '../../components/ui/MuscleTag';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import { resolveMuscleLabel } from '../../utils/muscle';
import { triggerHaptic } from '../../utils/audio';
import type { HomeViewState } from './useHomeViewState';

export const HomeMesosView: React.FC<{ state: HomeViewState }> = ({ state }) => {
    const {
        activeMeso,
        setActiveMeso,
        safeProgram,
        exercises,
        uniqueDaysDone,
        lang,
        t,
        h,
        kongBlock,
        onEditProgram,
        setShowMesoSettings,
        setShowCompleteModal,
        setShowKongHub,
        startSession,
    } = state;

    const [expandedDayIdx, setExpandedDayIdx] = useState<number | null>(0);

    if (!activeMeso) return null;

    const totalWeeks = activeMeso.targetWeeks || activeMeso.duration || 1;
    const weekPct = Math.min(100, Math.round((activeMeso.week / totalWeeks) * 100));
    const p = t.planActions;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">
                        {pickLang(lang, { es: 'GESTIÓN DE CICLO', en: 'CYCLE MANAGEMENT' })}
                    </p>
                    <h1 className="text-[22px] font-black uppercase tracking-tight text-white">
                        {pickLang(lang, { es: 'Mesociclos', en: 'Mesocycles' })}
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('gainslab:navigate', { detail: { view: 'templates' } }));
                    }}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] bg-primary-500 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-zinc-950 shadow-sm transition-all hover:brightness-110 active:scale-95"
                >
                    <Icon name="Plus" size={15} strokeWidth={2.5} />
                    <span>{pickLang(lang, { es: 'Nuevo mesociclo', en: 'New mesocycle' })}</span>
                </button>
            </div>

            {/* Active Mesocycle Overview Card */}
            <div className="rounded-[6px] border border-border-subtle bg-surface-raised p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-[4px] border border-primary-500/30 bg-primary-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                                {pickLang(lang, { es: 'ACTIVO', en: 'ACTIVE' })}
                            </span>
                            <span className="inline-flex items-center rounded-[4px] border border-border-subtle bg-surface-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                                {pickLang(lang, {
                                    es: `SEMANA ${activeMeso.week} DE ${totalWeeks}`,
                                    en: `WEEK ${activeMeso.week} OF ${totalWeeks}`,
                                })}
                            </span>
                            {activeMeso.isDeload && (
                                <span className="inline-flex items-center rounded-[4px] border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-400">
                                    DELOAD
                                </span>
                            )}
                        </div>
                        <h2 className="mt-2 text-[18px] font-black tracking-tight text-white truncate">
                            {activeMeso.name || p.activeFallback}
                        </h2>
                        <p className="mt-0.5 text-xs text-zinc-400">
                            {safeProgram.length} {h.daysWord} / {pickLang(lang, { es: 'semana', en: 'week' })} · {uniqueDaysDone.size}/{safeProgram.length} {pickLang(lang, { es: 'completados esta semana', en: 'completed this week' })}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        <span>{pickLang(lang, { es: 'Progreso del mesociclo', en: 'Mesocycle progress' })}</span>
                        <span className="text-primary-400 tabular-nums">{weekPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-base">
                        <div
                            className="h-full rounded-full bg-primary-500 transition-all duration-300"
                            style={{ width: `${weekPct}%` }}
                        />
                    </div>
                </div>

                {/* Week Switcher Strip */}
                <div className="pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        {pickLang(lang, { es: 'Semana activa', en: 'Active week' })}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((wNum) => {
                            const isCurrent = wNum === activeMeso.week;
                            return (
                                <button
                                    key={wNum}
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setActiveMeso(prev => (prev ? { ...prev, week: wNum } : prev));
                                    }}
                                    className={`flex h-8 min-w-[38px] px-2.5 items-center justify-center rounded-[4px] text-xs font-bold transition-all ${
                                        isCurrent
                                            ? 'bg-primary-500 text-zinc-950 font-black'
                                            : 'border border-border-subtle bg-surface-base text-zinc-400 hover:text-white'
                                    }`}
                                >
                                    W{wNum}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Management Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onEditProgram}
                        className="flex items-center gap-2.5 rounded-[6px] border border-border-subtle bg-surface-base px-3 py-2.5 text-left hover:border-zinc-600 active:scale-[0.98] transition-all"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-primary-500/10 text-primary-400">
                            <Icon name="Edit" size={16} />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-xs font-bold text-white truncate">
                                {pickLang(lang, { es: 'Editar rutina', en: 'Edit routine' })}
                            </span>
                            <span className="block text-[10px] text-zinc-400 truncate">
                                {pickLang(lang, { es: 'Días y ejercicios', en: 'Days & exercises' })}
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowMesoSettings(true)}
                        className="flex items-center gap-2.5 rounded-[6px] border border-border-subtle bg-surface-base px-3 py-2.5 text-left hover:border-zinc-600 active:scale-[0.98] transition-all"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-primary-500/10 text-primary-400">
                            <Icon name="Settings" size={16} />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-xs font-bold text-white truncate">
                                {pickLang(lang, { es: 'Ajustes del ciclo', en: 'Cycle settings' })}
                            </span>
                            <span className="block text-[10px] text-zinc-400 truncate">
                                {pickLang(lang, { es: 'Semanas y descarga', en: 'Weeks & deload' })}
                            </span>
                        </div>
                    </button>
                </div>

                {kongBlock && (
                    <button
                        type="button"
                        onClick={() => setShowKongHub(true)}
                        className="flex w-full items-center justify-between rounded-[6px] border border-primary-500/30 bg-primary-500/10 px-3 py-2.5 text-left transition-colors hover:bg-primary-500/15"
                    >
                        <div className="flex items-center gap-2">
                            <Icon name="Zap" size={15} className="text-primary-400" />
                            <span className="text-xs font-extrabold uppercase tracking-wider text-primary-300">
                                {`KONG · ${pickLang(lang, { es: 'Bloque', en: 'Block' })} ${kongBlock.block.number}`}
                            </span>
                        </div>
                        <Icon name="ChevronRight" size={15} className="text-primary-400" />
                    </button>
                )}
            </div>

            {/* Routine Breakdown by Day */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                        {pickLang(lang, { es: 'Estructura semanal', en: 'Weekly structure' })}
                    </h3>
                    <button
                        type="button"
                        onClick={() => setShowCompleteModal('meso')}
                        className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        {t.finishCycle}
                    </button>
                </div>

                <div className="space-y-2">
                    {safeProgram.map((day, idx) => {
                        const isExpanded = expandedDayIdx === idx;
                        const isDone = uniqueDaysDone.has(idx);
                        const slots = day.slots || [];
                        const totalSets = slots.reduce((sum: number, slot: any) => sum + (slot.setTarget || 3), 0);
                        const dayName = String(getTranslated(day.dayName, lang));

                        return (
                            <div
                                key={idx}
                                className="overflow-hidden rounded-[6px] border border-border-subtle bg-surface-raised"
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedDayIdx(isExpanded ? null : idx)}
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-surface-elevated/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-xs font-black ${
                                                isDone
                                                    ? 'bg-primary-500/15 text-primary-400'
                                                    : 'bg-surface-base border border-border-subtle text-zinc-300'
                                            }`}
                                        >
                                            {isDone ? <Icon name="Check" size={14} strokeWidth={3} /> : idx + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <span className="block text-sm font-bold text-white truncate">{dayName}</span>
                                            <span className="block text-xs text-zinc-400">
                                                {slots.length} {h.exercisesLower} · {totalSets} {h.setsLower}
                                            </span>
                                        </div>
                                    </div>
                                    <Icon
                                        name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                                        size={16}
                                        className="shrink-0 text-zinc-400"
                                    />
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-border-subtle bg-surface-base/60 px-4 py-3 space-y-2">
                                        {slots.map((slot: any, sIdx: number) => {
                                            const exDef = (exercises || []).find((e: any) => e.id === slot.exerciseId);
                                            const exName = exDef
                                                ? String(getTranslated(exDef.name, lang))
                                                : (slot.exerciseId || pickLang(lang, { es: 'Ejercicio sin asignar', en: 'Unassigned exercise' }));
                                            return (
                                                <div
                                                    key={slot.id || sIdx}
                                                    className="flex items-center justify-between gap-2 rounded-[4px] border border-border-subtle/70 bg-surface-raised px-3 py-2"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <MuscleTag
                                                            label={resolveMuscleLabel(slot.muscle, lang)}
                                                            muscle={slot.muscle}
                                                        />
                                                        <p className="mt-1 text-xs font-bold text-white truncate">
                                                            {exName}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 rounded-[4px] border border-border-subtle bg-surface-base px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-300 tabular-nums">
                                                        {slot.setTarget || 3} {h.setsLower}
                                                    </span>
                                                </div>
                                            );
                                        })}

                                        <div className="pt-1 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => startSession(idx)}
                                                className="inline-flex items-center gap-1.5 rounded-[4px] bg-primary-500/15 border border-primary-500/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-400 hover:bg-primary-500/25 transition-colors"
                                            >
                                                <Icon name="Play" size={12} />
                                                <span>
                                                    {pickLang(lang, { es: 'Ir a entrenar', en: 'Go to workout' })}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
