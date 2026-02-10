
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TRANSLATIONS, MUSCLE_GROUPS } from '../constants';
import { Icon } from '../components/ui/Icon';
import { Button } from '../components/ui/Button';
import { MuscleGroup, MesoType } from '../types';
import { ExerciseSelector } from '../components/ui/ExerciseSelector';
import { getTranslated } from '../utils';
import { ConfirmModal } from '../components/ui/ConfirmModal'; // New Import

interface ProgramEditViewProps {
    onBack: () => void;
}

export const ProgramEditView: React.FC<ProgramEditViewProps> = ({ onBack }) => {
    const { program, setProgram, lang, setActiveMeso, exercises } = useApp();
    const t = TRANSLATIONS[lang];
    
    const [pickingForSlot, setPickingForSlot] = useState<{dayId: string, slotIdx: number} | null>(null);
    const [showStartModal, setShowStartModal] = useState(false);
    const [dayToDelete, setDayToDelete] = useState<string | null>(null);
    
    // New Meso Config State
    const [mesoConfig, setMesoConfig] = useState<{
        name: string,
        type: MesoType,
        weeks: number
    }>({
        name: lang === 'en' ? "Custom Cycle" : "Ciclo Personalizado",
        type: 'hyp_1',
        weeks: 4
    });

    const handleUpdateDayName = (id: string, name: string) => {
        setProgram(prev => prev.map(d => d.id === id ? { ...d, dayName: { en: name, es: name } } : d));
    };

    const handleAddDay = () => {
        const newDay = {
            id: `d_${Date.now()}`,
            dayName: { en: "New Day", es: "Nuevo Día" },
            slots: []
        };
        setProgram(prev => [...prev, newDay]);
    };

    const handleDeleteDay = () => {
        if(dayToDelete) {
            setProgram(prev => prev.filter(d => d.id !== dayToDelete));
            setDayToDelete(null);
        }
    };

    const handleAddSlot = (dayId: string) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const currentSlots = d.slots || [];
            return { ...d, slots: [...currentSlots, { muscle: 'CHEST', setTarget: 3 }] };
        }));
    };

    const handleRemoveSlot = (dayId: string, idx: number) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            newSlots.splice(idx, 1);
            return { ...d, slots: newSlots };
        }));
    };

    const handleUpdateSlot = (dayId: string, idx: number, field: string, val: any) => {
        setProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            if (!newSlots[idx]) return d; // Safety check
            newSlots[idx] = { ...newSlots[idx], [field]: val };
            return { ...d, slots: newSlots };
        }));
    };

    // Exercise Picker handling
    const handleSelectExercise = (exId: string) => {
        if (!pickingForSlot) return;
        handleUpdateSlot(pickingForSlot.dayId, pickingForSlot.slotIdx, 'exerciseId', exId);
        setPickingForSlot(null);
    };

    // --- Start Mesocycle Logic ---
    const handleStartMeso = () => {
        // Create plan from current program state
        const plan = program.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        
        setActiveMeso({
            id: Date.now(),
            name: mesoConfig.name,
            mesoType: mesoConfig.type,
            week: 1,
            targetWeeks: mesoConfig.weeks,
            plan: plan,
            isDeload: false
        });
        
        // Return to home (which will now show the active meso)
        onBack();
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-zinc-950 relative">
             {/* Header */}
             <div className="glass px-4 h-14 shrink-0 flex items-center justify-between z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                    <Icon name="ChevronLeft" size={20} />
                    <span className="font-bold text-sm">{t.back}</span>
                </button>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowStartModal(true)}
                        className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-zinc-500/20 active:scale-95 transition-all"
                    >
                        <Icon name="Play" size={12} fill="currentColor" /> {t.startNow}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scroll-container space-y-6 pb-24">
                {program.map((day, i) => (
                    <div key={day.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                        <div className="bg-zinc-50 dark:bg-white/5 p-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
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
                                                {/* Muscle Select */}
                                                <select 
                                                    className="bg-zinc-100 dark:bg-zinc-800 text-xs font-bold rounded-lg px-2 py-1.5 border-none outline-none text-zinc-700 dark:text-zinc-300 max-w-[100px]"
                                                    value={slot.muscle}
                                                    onChange={(e) => handleUpdateSlot(day.id, idx, 'muscle', e.target.value)}
                                                >
                                                    {Object.values(MUSCLE_GROUPS).map(m => (
                                                        <option key={m} value={m}>{TRANSLATIONS[lang].muscle[m]}</option>
                                                    ))}
                                                </select>

                                                {/* Sets Input */}
                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1">
                                                    <span className="text-[9px] font-bold text-zinc-400">SETS</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-6 bg-transparent text-xs font-bold text-center outline-none text-zinc-900 dark:text-white"
                                                        value={slot.setTarget || ''}
                                                        onChange={e => handleUpdateSlot(day.id, idx, 'setTarget', Number(e.target.value))}
                                                    />
                                                </div>

                                                {/* Reps Input */}
                                                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 flex-1">
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

                                            {/* Specific Exercise (Optional Override) */}
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

            {/* Exercise Selector Modal */}
            {pickingForSlot && (
                <ExerciseSelector 
                    onClose={() => setPickingForSlot(null)}
                    onSelect={handleSelectExercise}
                />
            )}

            {/* Start Mesocycle Config Modal */}
            {showStartModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowStartModal(false)}>
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-zinc-100 dark:border-white/5 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t.setupCycle}</h3>
                                <p className="text-xs text-zinc-500 mt-1">{t.saveAsMeso}</p>
                            </div>
                            <button onClick={() => setShowStartModal(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><Icon name="X" size={20} /></button>
                        </div>

                        <div className="space-y-6">
                            {/* Rename */}
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.mesoName}</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-red-500"
                                    value={mesoConfig.name}
                                    onChange={(e) => setMesoConfig({ ...mesoConfig, name: e.target.value })}
                                />
                            </div>
                            
                            {/* Type */}
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.mesoType}</label>
                                <select 
                                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-red-500"
                                    value={mesoConfig.type}
                                    onChange={(e) => setMesoConfig({ ...mesoConfig, type: e.target.value as MesoType })}
                                >
                                    {Object.entries(t.phases).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider block mb-2">{t.targetWeeks}</label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setMesoConfig(prev => ({ ...prev, weeks: Math.max(1, prev.weeks - 1) }))}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                                    >
                                        <Icon name="Minus" size={16} />
                                    </button>
                                    <span className="font-mono text-2xl font-bold w-12 text-center text-zinc-900 dark:text-white">{mesoConfig.weeks}</span>
                                    <button 
                                        onClick={() => setMesoConfig(prev => ({ ...prev, weeks: prev.weeks + 1 }))}
                                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
                                    >
                                        <Icon name="Plus" size={16} />
                                    </button>
                                    <span className="text-sm font-bold text-zinc-500">{t.weeks}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <Button fullWidth onClick={handleStartMeso} size="lg" className="shadow-red-500/20">
                                {t.startNow}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={!!dayToDelete}
                title={t.delete}
                description={t.deleteConfirm}
                onConfirm={handleDeleteDay}
                onCancel={() => setDayToDelete(null)}
                variant="danger"
            />
        </div>
    );
};
