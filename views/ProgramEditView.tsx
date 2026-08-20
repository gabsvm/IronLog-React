
import React, { useState, useCallback, Suspense, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { isNhLabTemplate, nhLabCanStartAlpha } from '../programs/naturalHypertrophy/nhLabLifecycle';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MesoType } from '../types';
import { getTranslated } from '../utils';
import { triggerHaptic } from '../utils/audio';
import { Sheet } from '../components/ui/Sheet';
import { useStore } from '../lib/store';

const ExerciseSelector = React.lazy(() => import('../components/ui/ExerciseSelector').then(m => ({ default: m.ExerciseSelector })));
const ConfirmModal = React.lazy(() => import('../components/ui/ConfirmModal').then(m => ({ default: m.ConfirmModal })));

interface ProgramEditViewProps {
    onBack: () => void;
}

const programFingerprint = (program: unknown) => {
    try { return JSON.stringify(program); } catch { return ''; }
};

export const ProgramEditView: React.FC<ProgramEditViewProps> = ({ onBack }) => {
    const { program, setProgram, lang, exercises, personalTemplates, setPersonalTemplates } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];
    const isStructuredKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;

    const [editingNhLabId] = useState(() => {
        const current = programFingerprint(program);
        if (!current) return '';
        const match = (Array.isArray(personalTemplates) ? personalTemplates : [])
            .find(template => isNhLabTemplate(template) && programFingerprint(template.program) === current);
        return match?.id || '';
    });
    const editingNhLabTemplate = useMemo(() => {
        if (!editingNhLabId) return null;
        return (Array.isArray(personalTemplates) ? personalTemplates : [])
            .find(template => template.id === editingNhLabId && isNhLabTemplate(template)) || null;
    }, [editingNhLabId, personalTemplates]);

    const [pickingForSlot, setPickingForSlot] = useState<{dayId: string, slotIdx: number} | null>(null);
    const [showStartModal, setShowStartModal] = useState(false);
    const [dayToDelete, setDayToDelete] = useState<string | null>(null);

    const [mesoConfig, setMesoConfig] = useState<{
        name: string,
        type: MesoType,
        weeks: number
    }>(() => ({
        name: activeMeso?.name || (lang === 'en' ? 'Custom Cycle' : 'Ciclo Personalizado'),
        type: activeMeso?.mesoType || 'hyp_1',
        weeks: activeMeso?.targetWeeks || activeMeso?.duration || 4,
    }));
    const hasKnownPhase = Object.prototype.hasOwnProperty.call(t.phases, mesoConfig.type);

    // If Programming School opened this exact NH Lab draft, keep the personal
    // template synchronized with the generic editor. New exercise IDs are not
    // assumed to be known/tolerated: they enter readiness as unverified.
    useEffect(() => {
        if (!editingNhLabId) return;
        const usedExerciseIds = Array.from(new Set(program.flatMap(day => (day.slots || [])
            .map(slot => String(slot.exerciseId || '').trim())
            .filter(Boolean))));
        setPersonalTemplates(prev => prev.map(template => {
            if (template.id !== editingNhLabId || !isNhLabTemplate(template)) return template;
            const previousReadiness = template.nhLab.exerciseReadiness || {};
            const nextReadiness = { ...previousReadiness };
            usedExerciseIds.forEach(id => {
                if (!nextReadiness[id]) nextReadiness[id] = { experienced: false, fit: 'unsure' };
            });
            const sameProgram = programFingerprint(template.program) === programFingerprint(program);
            const sameReadiness = programFingerprint(previousReadiness) === programFingerprint(nextReadiness);
            if (sameProgram && sameReadiness) return template;
            return {
                ...template,
                program: program.map(day => ({ ...day, slots: (day.slots || []).map(slot => ({ ...slot })) })),
                nhLab: { ...template.nhLab, exerciseReadiness: nextReadiness },
            };
        }));
    }, [editingNhLabId, program, setPersonalTemplates]);

    const confirmNhLabReadiness = useCallback(() => {
        if (!editingNhLabId) return;
        const usedExerciseIds = Array.from(new Set(program.flatMap(day => (day.slots || [])
            .map(slot => String(slot.exerciseId || '').trim())
            .filter(Boolean))));
        if (usedExerciseIds.length === 0) return;
        setPersonalTemplates(prev => prev.map(template => {
            if (template.id !== editingNhLabId || !isNhLabTemplate(template)) return template;
            const readiness = { ...(template.nhLab.exerciseReadiness || {}) };
            usedExerciseIds.forEach(id => { readiness[id] = { experienced: true, fit: 'works' }; });
            return { ...template, nhLab: { ...template.nhLab, exerciseReadiness: readiness } };
        }));
        triggerHaptic('success');
    }, [editingNhLabId, program, setPersonalTemplates]);

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
        if(dayToDelete) {
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
                <div className="flex h-14 shrink-0 items-center border-b border-[rgb(var(--border-subtle))] px-4">
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
                        <h1 className="mt-2 text-2xl font-black">{lang === 'es' ? 'Programa estructurado' : 'Structured program'}</h1>
                        <p className="mt-3 text-sm leading-6 text-[rgb(var(--text-secondary))]">
                            {lang === 'es'
                                ? 'La definición oficial de KONG no se edita desde el editor genérico. Vuelve y usa Opciones del plan → Editar rutina para convertir la semana actual en una copia personal editable.'
                                : 'The official KONG definition is not edited in the generic editor. Go back and use Plan options → Edit routine to convert the current week into an editable personal copy.'}
                        </p>
                        <Button onClick={onBack} fullWidth className="mt-6">
                            {lang === 'es' ? 'Volver al plan' : 'Back to plan'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950 relative">
             <div className="glass px-4 h-14 shrink-0 flex items-center justify-between z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white" aria-label="Previous"> <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowStartModal(true)}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary-500/25 active:scale-95 transition-all"
                    >
                        <Icon name="Play" size={12} fill="currentColor" /> {t.startNow}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scroll-container space-y-6 pb-24">
                {editingNhLabTemplate?.nhLab && (
                    <section className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.07] p-4 text-zinc-800 dark:text-zinc-100">
                        <div className="flex items-start gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500"><Icon name="Brain" size={17}/></span>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black">NH Lab · {editingNhLabTemplate.nhLab.phase.toUpperCase()}</p><span className={`rounded-lg px-2 py-1 text-[8px] font-black ${nhLabCanStartAlpha(editingNhLabTemplate) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{nhLabCanStartAlpha(editingNhLabTemplate) ? (lang === 'es' ? 'READINESS OK' : 'READINESS OK') : (lang === 'es' ? 'READINESS PENDIENTE' : 'READINESS PENDING')}</span></div>
                                <p className="mt-1 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400">{lang === 'es' ? 'Los cambios de estructura se sincronizan con este mismo template de Mías. El changelog sigue siendo manual: registrá el motivo en Programming School para conservar el razonamiento, no cada pulsación.' : 'Structural edits sync to this same Mine template. The changelog stays manual: record the reason in Programming School so it captures reasoning, not every keystroke.'}</p>
                            </div>
                        </div>
                        <button type="button" onClick={confirmNhLabReadiness} className="mt-3 min-h-10 w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 text-[10px] font-black text-violet-600 dark:text-violet-300">{lang === 'es' ? 'Confirmo: conozco y tolero todos los ejercicios actuales' : 'I confirm: I know and tolerate every current exercise'}</button>
                        <p className="mt-2 text-[9px] leading-4 text-zinc-500">{lang === 'es' ? 'GAINSLAB RULE · no pulses esto si alguno te molesta, es nuevo para vos o todavía no sabés si te funciona.' : 'GAINSLAB RULE · do not press this if any movement irritates you, is new to you, or you do not yet know whether it fits.'}</p>
                    </section>
                )}

                {program.map((day) => (
                    <div key={day.id} className="glass-card rounded-2xl overflow-hidden shadow-lg transition-all hover:border-white/10">
                        <div className="bg-zinc-100/80 dark:bg-white/5 p-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
                            <input 
                                className="bg-transparent font-bold text-zinc-900 dark:text-white outline-none w-full"
                                value={day.dayName[lang]}
                                onChange={e => handleUpdateDayName(day.id, e.target.value)}
                                placeholder="Day Name"
                            />
                            <button onClick={() => setDayToDelete(day.id)} className="text-zinc-400 hover:text-red-500 ml-2">
                                <Icon name="Trash2" size={18} />
                            </button>
                        </div>
                        
                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                            {(day.slots || []).map((slot, idx) => (
                                <div key={idx} className="p-3 flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex gap-2 items-center">
                                                <select 
                                                    className="bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-xs font-bold rounded-lg px-2 py-1.5 border-none outline-none text-zinc-900 dark:text-zinc-200 max-w-[100px] transition-colors"
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

                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white/5 rounded-lg px-2 py-1 flex-1 border border-zinc-200 dark:border-white/5">
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
                                                onClick={() => setPickingForSlot({dayId: day.id, slotIdx: idx})}
                                                className={`text-sm font-medium w-full text-left truncate ${slot.exerciseId ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 italic'}`}
                                            >
                                                {slot.exerciseId 
                                                    ? getTranslated(exercises.find(e => e.id === slot.exerciseId)?.name, lang)
                                                    : t.selectExBtn
                                                }
                                            </button>
                                        </div>
                                        <button onClick={() => handleRemoveSlot(day.id, idx)} className="text-zinc-300 hover:text-red-500 p-2">
                                            <Icon name="X" size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-2 border-t border-zinc-100 dark:border-white/5">
                            <button onClick={() => handleAddSlot(day.id)} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
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
                                <option value={mesoConfig.type}>{lang === 'es' ? 'Personalizado' : 'Custom'}</option>
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
                            >
                                <Icon name="Minus" size={16} />
                            </button>
                            <span className="font-mono text-2xl font-bold w-12 text-center text-zinc-900 dark:text-white">{mesoConfig.weeks}</span>
                            <button 
                                onClick={() => setMesoConfig(prev => ({ ...prev, weeks: prev.weeks + 1 }))}
                                className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all"
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
