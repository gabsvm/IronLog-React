import React, { useState, useRef, useEffect } from 'react';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../../constants';
import { Icon } from '../../components/ui/Icon';
import { getTranslated } from '../../utils';
import { pickLang } from '../../utils/i18n';
import type { ProgramEditState } from './useProgramEditState';

const MUSCLE_THEMES: Record<string, { text: string; bg: string; border: string; bar: string }> = {
    CHEST: { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/25', bar: 'bg-pink-500' },
    BACK: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', bar: 'bg-cyan-500' },
    LEGS: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', bar: 'bg-emerald-500' },
    QUADS: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', bar: 'bg-emerald-500' },
    HAMSTRINGS: { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/25', bar: 'bg-teal-500' },
    CALVES: { text: 'text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/25', bar: 'bg-teal-400' },
    GLUTES: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25', bar: 'bg-amber-500' },
    SHOULDERS: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/25', bar: 'bg-purple-500' },
    BICEPS: { text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/25', bar: 'bg-sky-500' },
    TRICEPS: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/25', bar: 'bg-rose-500' },
    FOREARMS: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', bar: 'bg-indigo-500' },
    ABS: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25', bar: 'bg-orange-500' },
    TRAPS: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25', bar: 'bg-violet-500' },
};

export const ProgramEditDays: React.FC<{ state: ProgramEditState }> = ({ state }) => {
    const {
        program,
        lang,
        exercises,
        t,
        isEditingActiveRoutine,
        setPickingForSlot,
        setDayToDelete,
        handleUpdateDayName,
        handleAddDay,
        handleAddSlot,
        handleRemoveSlot,
        handleUpdateSlot,
        handleValidateAndOpenStartModal,
        onBack,
    } = state;

    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const prevLengthRef = useRef(program.length);

    useEffect(() => {
        if (program.length > prevLengthRef.current) {
            setActiveDayIdx(program.length - 1);
        }
        prevLengthRef.current = program.length;
    }, [program.length]);

    if (program.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-[6px] bg-surface-raised border border-border-subtle flex items-center justify-center text-primary-400 mb-3">
                    <Icon name="Calendar" size={24} />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                    {pickLang(lang, { es: 'No hay días en la rutina', en: 'No days in routine' })}
                </h3>
                <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                    {pickLang(lang, {
                        es: 'Añade tu primer día de entrenamiento para comenzar a estructurar tu plan.',
                        en: 'Add your first workout day to start building your routine.',
                    })}
                </p>
                <button
                    type="button"
                    onClick={handleAddDay}
                    className="rounded-[4px] bg-primary-500 text-zinc-950 font-black uppercase tracking-wider px-5 py-2.5 text-xs hover:bg-primary-400 active:scale-95 transition-all shadow-md"
                >
                    <Icon name="Plus" size={14} className="inline mr-1" />
                    {t.addDay || 'Add Day'}
                </button>
            </div>
        );
    }

    const currentIdx = Math.min(activeDayIdx, Math.max(0, program.length - 1));
    const currentDay = program[currentIdx];
    const restMatchWord = pickLang(lang, { es: 'descanso', en: 'rest' });
    const isRestDay = Boolean(currentDay.dayName[lang]?.toLowerCase().includes(restMatchWord));

    return (
        <div className="relative flex flex-1 flex-col overflow-hidden">
            {/* Top: Horizontal Segmented Day Selector Bar (1:1 RP builder-4.png) */}
            <div className="shrink-0 p-3 pb-2 bg-surface-app">
                <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-[6px] bg-surface-raised p-1 border border-border-subtle overflow-x-auto no-scrollbar">
                    {program.map((day, idx) => {
                        const isSelected = idx === currentIdx;
                        const fallbackLabel = `${pickLang(lang, { es: 'Día', en: 'Day' })} ${idx + 1}`;
                        const label = day.dayName[lang] || fallbackLabel;
                        return (
                            <button
                                key={day.id}
                                type="button"
                                onClick={() => setActiveDayIdx(idx)}
                                className={`px-3 py-1.5 rounded-[4px] text-xs font-black transition-all truncate text-center ${
                                    isSelected
                                        ? 'bg-white text-zinc-950 shadow-sm'
                                        : 'text-zinc-400 hover:text-white hover:bg-surface-elevated'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={handleAddDay}
                        className="px-2.5 py-1.5 rounded-[4px] text-xs font-bold text-primary-500 hover:bg-primary-500/10 transition-colors flex items-center justify-center shrink-0"
                        title={t.addDay || 'Add Day'}
                        aria-label={t.addDay || 'Add Day'}
                    >
                        <Icon name="Plus" size={14} />
                    </button>
                </div>
            </div>

            {/* Day Name Input + Rest Day Toggle + Delete Day */}
            <div className="shrink-0 px-4 py-2 flex items-center justify-between gap-3 border-b border-border-subtle/50 bg-surface-app">
                <input
                    className="bg-transparent font-black text-[17px] text-white outline-none flex-1 min-w-0 placeholder:text-zinc-500"
                    value={currentDay.dayName[lang] || ''}
                    onChange={(e) => handleUpdateDayName(currentDay.id, e.target.value)}
                    placeholder={TRANSLATIONS[lang].copy.programEdit.dayName}
                />
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => {
                            if (isRestDay) {
                                handleUpdateDayName(currentDay.id, `${pickLang(lang, { es: 'Día', en: 'Day' })} ${currentIdx + 1}`);
                            } else {
                                handleUpdateDayName(currentDay.id, pickLang(lang, { es: 'Descanso', en: 'Rest Day' }));
                            }
                        }}
                        className={`px-2 py-1 rounded-[4px] text-[10px] font-extrabold uppercase tracking-wider border transition-colors ${
                            isRestDay
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-surface-elevated border-border-subtle text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        {isRestDay
                            ? pickLang(lang, { es: 'Descanso', en: 'Rest Day' })
                            : pickLang(lang, { es: '+ Descanso', en: '+ Rest Day' })}
                    </button>
                    <button
                        type="button"
                        onClick={() => setDayToDelete(currentDay.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-[4px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        aria-label={t.delete}
                        title={t.delete}
                    >
                        <Icon name="Trash2" size={16} />
                    </button>
                </div>
            </div>

            {/* Flat Muscle / Exercise Slot Rows (builder-4.png) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-28 scroll-container">
                {(currentDay.slots || []).length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-[6px] border border-dashed border-border-subtle bg-surface-raised/40">
                        <p className="text-xs font-semibold text-zinc-400">
                            {pickLang(lang, { es: 'No hay ejercicios para este día', en: 'No exercises for this day yet' })}
                        </p>
                        <button
                            type="button"
                            onClick={() => handleAddSlot(currentDay.id)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-surface-elevated text-xs font-bold text-primary-400 border border-border-subtle hover:bg-surface-elevated/80 transition-colors"
                        >
                            <Icon name="Plus" size={14} /> {t.addSlot || 'Add Exercise'}
                        </button>
                    </div>
                ) : (
                    (currentDay.slots || []).map((slot, idx) => {
                        const theme = MUSCLE_THEMES[slot.muscle] || {
                            text: 'text-primary-400',
                            bg: 'bg-primary-500/10',
                            border: 'border-primary-500/25',
                            bar: 'bg-primary-500',
                        };
                        const exName = slot.exerciseId
                            ? getTranslated(exercises.find((e) => e.id === slot.exerciseId)?.name, lang)
                            : (TRANSLATIONS[lang].copy.programEdit.selectExercise || 'Select exercise');

                        return (
                            <div
                                key={idx}
                                className="rounded-[6px] border border-border-subtle bg-surface-raised px-3 py-2.5 flex items-center justify-between gap-2.5 transition-colors"
                            >
                                {/* Left: Drag handle + vertical accent bar + stacked info */}
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <Icon name="GripVertical" size={16} className="text-zinc-600 shrink-0 cursor-grab" />
                                    <div className={`w-1 self-stretch rounded-full ${theme.bar || 'bg-primary-500'} shrink-0 opacity-80`} />
                                    <div className="flex-1 min-w-0">
                                        {/* Top line: Rectangular Muscle Tag + sets/reps controls */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div
                                                className={`inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${theme.bg} ${theme.text} ${theme.border}`}
                                            >
                                                <svg
                                                    className="w-2.5 h-2.5 shrink-0"
                                                    viewBox="0 0 16 16"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                >
                                                    <rect x="2" y="2" width="2.5" height="12" rx="1.25" />
                                                    <rect x="6.75" y="2" width="2.5" height="12" rx="1.25" />
                                                    <rect x="11.5" y="2" width="2.5" height="12" rx="1.25" />
                                                </svg>
                                                <select
                                                    className="bg-transparent uppercase font-extrabold cursor-pointer border-none outline-none appearance-none"
                                                    value={slot.muscle}
                                                    onChange={(e) => handleUpdateSlot(currentDay.id, idx, 'muscle', e.target.value)}
                                                >
                                                    {Object.values(MUSCLE_GROUPS).map((m) => (
                                                        <option key={m} value={m} className="bg-zinc-900 text-white font-bold">
                                                            {TRANSLATIONS[lang].muscle[m] || m}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-center gap-1 text-[11px] font-bold text-zinc-400 bg-surface-elevated/70 rounded-[3px] px-1.5 py-0.5 border border-border-subtle">
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold">SETS</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={20}
                                                    className="w-5 bg-transparent text-center font-bold text-white outline-none"
                                                    value={slot.setTarget || ''}
                                                    onChange={(e) =>
                                                        handleUpdateSlot(currentDay.id, idx, 'setTarget', Math.max(1, Number(e.target.value)))
                                                    }
                                                />
                                                <span className="text-zinc-600">×</span>
                                                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-extrabold">REPS</span>
                                                <input
                                                    type="text"
                                                    className="w-12 bg-transparent text-center font-bold text-white outline-none"
                                                    value={slot.reps || ''}
                                                    placeholder="8-12"
                                                    onChange={(e) => handleUpdateSlot(currentDay.id, idx, 'reps', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom line: Exercise Name */}
                                        <button
                                            type="button"
                                            onClick={() => setPickingForSlot({ dayId: currentDay.id, slotIdx: idx })}
                                            className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-200 mt-1 hover:text-white transition-colors text-left truncate w-full"
                                        >
                                            <Icon name="Zap" size={12} className="text-zinc-400 shrink-0" />
                                            <span className={slot.exerciseId ? 'text-zinc-200 truncate' : 'text-primary-400 italic'}>
                                                {exName}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Right: Delete Slot Button */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSlot(currentDay.id, idx)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    aria-label={t.delete}
                                    title={t.delete}
                                >
                                    <Icon name="Trash2" size={16} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating + button to add exercise to active day */}
            <button
                type="button"
                onClick={() => handleAddSlot(currentDay.id)}
                className="fixed right-5 bottom-24 z-20 rounded-full h-11 w-11 bg-white text-zinc-950 shadow-lg flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all"
                aria-label={t.addSlot || 'Add exercise'}
                title={t.addSlot || 'Add exercise'}
            >
                <Icon name="Plus" size={22} strokeWidth={2.5} />
            </button>

            {/* Bottom Primary CTA Button */}
            <div className="shrink-0 border-t border-border-subtle bg-surface-app/95 backdrop-blur-md p-4 pb-safe">
                <button
                    type="button"
                    onClick={isEditingActiveRoutine ? onBack : handleValidateAndOpenStartModal}
                    className="w-full rounded-[4px] bg-primary-500 text-zinc-950 font-black uppercase tracking-wider py-3.5 hover:bg-primary-400 active:scale-[0.99] transition-all shadow-md text-sm"
                >
                    {isEditingActiveRoutine
                        ? pickLang(lang, { es: 'GUARDAR RUTINA', en: 'SAVE ROUTINE' })
                        : pickLang(lang, { es: 'CREAR MESOCICLO', en: 'CREATE MESOCYCLE' })}
                </button>
            </div>
        </div>
    );
};
