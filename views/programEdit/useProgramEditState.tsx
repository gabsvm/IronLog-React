// T2: ProgramEditView state, effects and handlers, moved verbatim from
// views/ProgramEditView.tsx (the view is now an orchestrator).
import { formatMessage } from '../../utils/i18n';
import { useState, useCallback, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { MesoType } from '../../types';
import { getTranslated } from '../../utils';
import { triggerHaptic } from '../../utils/audio';
import { useStore } from '../../lib/store';

export interface ProgramEditViewProps {
    onBack: () => void;
}

export interface UnresolvedSlot {
    dayName: string;
    slotIdx: number;
    muscle: string;
}

export const useProgramEditState = ({ onBack }: ProgramEditViewProps) => {
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

    return {
        onBack,
        program,
        setProgram,
        lang,
        exercises,
        activeMeso,
        setActiveMeso,
        t,
        isStructuredKong,
        isEditingActiveRoutine,
        pickingForSlot,
        setPickingForSlot,
        showStartModal,
        setShowStartModal,
        unresolvedSlots,
        setUnresolvedSlots,
        dayToDelete,
        setDayToDelete,
        saveStatus,
        setSaveStatus,
        mesoConfig,
        setMesoConfig,
        hasKnownPhase,
        handleUpdateDayName,
        handleAddDay,
        handleDeleteDay,
        handleAddSlot,
        handleRemoveSlot,
        handleUpdateSlot,
        handleSelectExercise,
        handleValidateAndOpenStartModal,
        handleStartMeso,
    };
};

export type ProgramEditState = ReturnType<typeof useProgramEditState>;
