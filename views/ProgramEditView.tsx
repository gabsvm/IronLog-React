import { formatMessage } from '../utils/i18n';
import React, { useState, useCallback, Suspense, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup, MesoType } from '../types';
import { getTranslated } from '../utils';
import { triggerHaptic } from '../utils/audio';
import { Sheet } from '../components/ui/Sheet';
import { useStore } from '../lib/store';

const ExerciseSelector = React.lazy(() => import('../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface ProgramEditViewProps {
    onBack: () => void;
}

interface UnresolvedSlot {
    dayName: string;
    slotIdx: number;
    muscle: string;
}

export const ProgramEditView: React.FC<ProgramEditViewProps> = ({ onBack }) => {
    const { program, setProgram, lang, exercises } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];
    const isStructuredKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const isEditingActiveRoutine = !!activeMeso;

    const [pickingForSlot, setPickingForSlot] = useState<{ dayId: string; slotIdx: number } | null>(null);
    const [showStartModal, setShowStartModal] = useState(false);
    const [unresolvedSlots, setUnresolvedSlots] = useState<UnresolvedSlot[]>([]);
    const [dayToDelete, setDayToDelete] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

    const [mesoConfig, setMesoConfig] = useState<{
        name: string;
        type: MesoType;
        weeks: number;
    }>(() => ({
        name: activeMeso?.name || (TRANSLATIONS[lang].copy.programEdit.customCycle),
        type: activeMeso?.mesoType || 'hyp_1',
        weeks: activeMeso?.targetWeeks || activeMeso?.duration || 4,
    }));
    const hasKnownPhase = Object.prototype.hasOwnProperty.call(t.phases, mesoConfig.type);

    // Sync active meso plan if editing routine and program slots change
    useEffect(() => {
        if (!activeMeso) return;
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            const updatedPlan = program.map(day => (day.slots || []).map(s => s.exerciseId || null));
            setActiveMeso(prev => prev ? { ...prev, plan: updatedPlan } : prev);
            setSaveStatus('saved');
        }, 300);
        return () => clearTimeout(timer);
    }, [program, activeMeso, setActiveMeso]);

    const handleUpdateDayName = useCallback((id: string, name: string) => {
        setProgram(prev => prev.map(d => d.id === id ? { ...d, dayName: { en: name, es: name } } : d));
    }, [setProgram]);

    const handleAddDay = useCallback(() => {
        const newDay = {
            id: `d_${Date.now()}`,
            dayName: { en: 'New Day', es: 'Nuevo Día' },
            slots: []
        };
        setProgram(prev => [...prev, newDay]);
        triggerHaptic('success');
    }, [setProgram]);

    const handleDeleteDay = useCallback(() => {
        if (dayToDelete) {
            setProgram(prev => prev.filter(d => d.id !== dayToDelete));
            setDayToDelete(null);
            triggerHaptic('medium');
        }
    }, [dayToDelete, setProgram]);

    const handleAddSlot = useCallback((dayId: string) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const currentSlots = d.slots || [];
            return { ...d, slots: [...currentSlots, { muscle: 'CHEST', setTarget: 3 }] };
        }));
        triggerHaptic('light');
    }, [setProgram]);

    const handleRemoveSlot = useCallback((dayId: string, idx: number) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            newSlots.splice(idx, 1);
            return { ...d, slots: newSlots };
        }));
        triggerHaptic('light');
    }, [setProgram]);

    const handleUpdateSlot = useCallback((dayId: string, idx: number, field: string, val: any) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            if (!newSlots[idx]) return d;
            newSlots[idx] = { ...newSlots[idx], [field]: val };
            return { ...d, slots: newSlots };
        }));
    }, [setProgram]);

    const handleSelectExercise = useCallback((exId: string) => {
        if (!pickingForSlot) return;
        handleUpdateSlot(pickingForSlot.dayId, pickingForSlot.slotIdx, 'exerciseId', exId);
        setPickingForSlot(null);
    }, [pickingForSlot, handleUpdateSlot]);

    const handleValidateAndOpenStartModal = () => {
        const unresolved: UnresolvedSlot[] = [];
        program.forEach((day, dIdx) => {
            const dayLabel = getTranslated(day.dayName, lang) || (formatMessage(TRANSLATIONS[lang].copy.programEdit.day, { v: dIdx + 1 }));
            (day.slots || []).forEach((slot, sIdx) => {
                if (!slot.exerciseId) {
                    unresolved.push({
                        dayName: dayLabel,
                        slotIdx: sIdx + 1,
                        muscle: TRANSLATIONS[lang].muscle[slot.muscle] || slot.muscle,
                    });
                }
            });
        });

        if (unresolved.length > 0) {
            setUnresolvedSlots(unresolved);
            triggerHaptic('warning');
            return;
        }

        setShowStartModal(true);
    };

    const handleStartMeso = () => {
        const plan = program.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: mesoConfig.name,
            mesoType: mesoConfig.type,
            week: 1,
            targetWeeks: mesoConfig.weeks,
            plan,
            isDeload: false,
            duration: mesoConfig.weeks
        });
        triggerHaptic('success');
        onBack();
    };

    if (isStructuredKong) {
        return (
            <div className="flex h-full flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]">
                <div className="flex min-h-14 pt-safe shrink-0 items-center border-b border-[rgb(var(--border-subtle))] px-4">
                    <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-bold text-[rgb(var(--text-secondary))]" aria-label={t.back}>
                        <Icon name="ChevronLeft" size={20} /> {t.back}
                    </button>
                </div>
                <div className="flex flex-1 items-center justify-center p-6">
                    <div className="w-full max-w-sm rounded-3xl border border-primary-500/25 bg-[rgb(var(--surface-raised))] p-6 text-center shadow-xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-500">
                            <Icon name="Lock" size={24} />
                        </div>
                        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">KONG</p>
                        <h1 className="mt-2 text-2xl font-black">{TRANSLATIONS[lang].copy.programEdit.structuredProgram}</h1>
                        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                            {TRANSLATIONS[lang].copy.programEdit.theOfficialKongDefinition}
                        </p>
                        <Button onClick={onBack} fullWidth className="mt-6">
                            {TRANSLATIONS[lang].copy.programEdit.backToPlan}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950 relative">
            {/* Header: clearly distinguishes Edit vs Create */}
            <div className="glass px-4 min-h-14 pt-safe shrink-0 flex items-center justify-between z-10 border-b border-zinc-200 dark:border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    aria-label={t.back}
                >
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>

                <h1 className="font-bold text-sm text-zinc-900 dark:text-white truncate max-w-[180px]">
                    {isEditingActiveRoutine
                        ? (TRANSLATIONS[lang].copy.programEdit.editActiveRoutine)
                        : (TRANSLATIONS[lang].copy.programEdit.newRoutine)}
                </h1>

                <div className="flex items-center gap-2">
                    {isEditingActiveRoutine ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                            <Icon name="Check" size={12} strokeWidth={3} />
                            <span>{saveStatus === 'saved' ? (TRANSLATIONS[lang].copy.programEdit.saved) : (TRANSLATIONS[lang].copy.programEdit.saving)}</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleValidateAndOpenStartModal}
                            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-black px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary-500/25 active:scale-95 transition-all"
                        >
                            <Icon name="Play" size={12} fill="currentColor" />
                            {TRANSLATIONS[lang].copy.programEdit.start}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scroll-container space-y-6 pb-24">
                {program.map((day) => (
                    <div key={day.id} className="glass-card rounded-2xl overflow-hidden shadow-lg transition-all hover:border-white/10">
                        <div className="bg-zinc-100/80 dark:bg-white/5 p-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
                            <input
                                className="bg-transparent font-bold text-zinc-900 dark:text-white outline-none w-full"
                                value={day.dayName[lang] || ''}
                                onChange={e => handleUpdateDayName(day.id, e.target.value)}
                                placeholder={TRANSLATIONS[lang].copy.programEdit.dayName}
                            />
                            <button
                                onClick={() => setDayToDelete(day.id)}
                                className="text-zinc-400 hover:text-red-500 ml-2"
                                aria-label={t.delete}
                            >
                                <Icon name="Trash2" size={18} />
                            </button>
                        </div>

                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                            {(day.slots || []).map((slot, idx) => (
                                <div key={idx} className="p-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <select
                                                    className="bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-bold rounded-lg px-2 py-1.5 border-none outline-none text-zinc-900 dark:text-zinc-200 max-w-[110px] transition-colors"
                                                    value={slot.muscle}
                                                    onChange={(e) => handleUpdateSlot(day.id, idx, 'muscle', e.target.value)}
                                                >
                                                    {Object.values(MUSCLE_GROUPS).map(m => (
                                                        <option key={m} value={m}>{TRANSLATIONS[lang].muscle[m]}</option>
                                                    ))}
                                                </select>

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 rounded-lg px-2 py-1 border border-zinc-200 dark:border-white/5">
                                                    <span className="text-[9px] font-bold text-zinc-400">SETS</span>
                                                    <input
                                                        type="number"
                                                        className="w-6 bg-transparent text-xs font-bold text-center outline-none text-zinc-900 dark:text-white"
                                                        value={slot.setTarget || ''}
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'setTarget', Number(e.target.value))}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 rounded-lg px-2 py-1 flex-1 min-w-[80px] border border-zinc-200 dark:border-white/5">
                                                    <span className="text-[9px] font-bold text-zinc-400 whitespace-nowrap">REPS</span>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-transparent text-xs font-bold text-center outline-none text-zinc-900 dark:text-white"
                                                        value={slot.reps || ''}
                                                        placeholder="8-12"
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'reps', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setPickingForSlot({ dayId: day.id, slotIdx: idx })}
                                                className={`text-sm font-medium w-full text-left truncate flex items-center justify-between p-2 rounded-xl bg-zinc-100/50 dark:bg-white/5 hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors ${
                                                    slot.exerciseId ? 'text-zinc-900 dark:text-white font-semibold' : 'text-amber-500 dark:text-amber-400 font-bold'
                                                }`}
                                            >
                                                <span>
                                                    {slot.exerciseId
                                                        ? getTranslated(exercises.find(e => e.id === slot.exerciseId)?.name, lang)
                                                        : (TRANSLATIONS[lang].copy.programEdit.selectExercise)}
                                                </span>
                                                <Icon name="ChevronRight" size={14} className="text-zinc-400 shrink-0 ml-2" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveSlot(day.id, idx)}
                                            className="text-zinc-300 hover:text-red-500 p-2"
                                            aria-label={t.delete}
                                        >
                                            <Icon name="X" size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-zinc-100 dark:border-white/5">
                            <button
                                onClick={() => handleAddSlot(day.id)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            >
                                <Icon name="Plus" size={14} /> {t.addSlot}
                            </button>
                        </div>
                    </div>
                ))}

                <Button variant="outline" onClick={handleAddDay} fullWidth className="py-4 border-dashed">
                    {t.addDay}
                </Button>
            </div>

            {pickingForSlot && (
                <Suspense fallback={null}>
                    <ExerciseSelector
                        onClose={() => setPickingForSlot(null)}
                        onSelect={handleSelectExercise}
                    />
                </Suspense>
            )}

            {/* Unresolved Slots Validation Dialog */}
            {unresolvedSlots.length > 0 && (
                <div
                    className="fixed inset-0 z-confirm bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-fast"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="unresolved-title"
                >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-amber-500">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Icon name="AlertTriangle" size={22} />
                            </div>
                            <div>
                                <h3 id="unresolved-title" className="text-base font-bold text-zinc-900 dark:text-white">
                                    {TRANSLATIONS[lang].copy.programEdit.unassignedExercises}
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {formatMessage(TRANSLATIONS[lang].copy.programEdit.slotSWithoutSelected, { count: unresolvedSlots.length })}
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {TRANSLATIONS[lang].copy.programEdit.eachSlotMustHave}
                        </p>

                        <div className="max-h-40 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/5 text-xs">
                            {unresolvedSlots.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-zinc-700 dark:text-zinc-300 py-0.5">
                                    <span>
                                        <strong className="font-semibold">{item.dayName}</strong> · Slot #{item.slotIdx}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400">
                                        {item.muscle}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <Button
                                fullWidth
                                variant="primary"
                                onClick={() => setUnresolvedSlots([])}
                            >
                                {TRANSLATIONS[lang].copy.programEdit.assignExercises}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Sheet
                open={showStartModal}
                onOpenChange={setShowStartModal}
                title={t.setupCycle}
                accent="primary"
                footer={
                    <Button fullWidth onClick={handleStartMeso} size="lg">
                        {t.startNow}
                    </Button>
                }
            >
                <div className="p-5 space-y-6">
                    <p className="text-xs text-zinc-500 -mt-2">{t.saveAsMeso}</p>
                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2 px-1">{t.mesoName}</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all glow-input-neon"
                            value={mesoConfig.name}
                            onChange={(e) => setMesoConfig({ ...mesoConfig, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2 px-1">{t.mesoType}</label>
                        <select
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            value={mesoConfig.type}
                            onChange={(e) => setMesoConfig({ ...mesoConfig, type: e.target.value as MesoType })}
                        >
                            {!hasKnownPhase && (
                                <option value={mesoConfig.type}>{TRANSLATIONS[lang].copy.programEdit.custom}</option>
                            )}
                            {Object.entries(t.phases).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest block mb-2 px-1">{t.targetWeeks}</label>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.max(1, prev.weeks - 1) }))}
                                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
                                aria-label="Disminuir semanas"
                            >
                                <Icon name="Minus" size={16} />
                            </button>
                            <span className="font-mono text-2xl font-bold w-12 text-center text-zinc-900 dark:text-white">{mesoConfig.weeks}</span>
                            <button
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: prev.weeks + 1 }))}
                                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
                                aria-label="Aumentar semanas"
                            >
                                <Icon name="Plus" size={16} />
                            </button>
                            <span className="text-sm font-bold text-zinc-500">{t.weeks}</span>
                        </div>
                    </div>
                </div>
            </Sheet>

            <Suspense fallback={null}>
                <ConfirmModal
                    isOpen={!!dayToDelete}
                    title={t.delete}
                    description={t.deleteConfirm}
                    onConfirm={handleDeleteDay}
                    onCancel={() => setDayToDelete(null)}
                    variant="danger"
                />
            </Suspense>
        </div>
    );
};
