// T2: ProgramEditView state, effects and handlers + RP 1:1 Meso Builder, Drafts, Muscle Priorities & Auto-Recommend.
import { formatMessage } from '../../utils/i18n';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TRANSLATIONS } from '../../constants';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import type { MesoType, MuscleGroup, MusclePriorityLevel, ProgramDay, WeightUnit } from '../../types';
import { getTranslated } from '../../utils';
import { triggerHaptic } from '../../utils/audio';
import { useStore } from '../../lib/store';
import { recommendExercisesForMuscle } from '../../utils/equipment';
import {
    applyMusclePrioritiesToProgram,
    detectSplitConflicts,
    reorderDaysToResolveConflicts,
} from '../../utils/rpSplitBuilder';
import {
    clearMesocycleDraft,
    consumeMesoEditorIntent,
    loadMesocycleDraft,
    saveMesocycleDraft,
    type MesoEditorIntent,
} from '../../utils/mesoDraft';

export interface ProgramEditViewProps {
    onBack: () => void;
}

export interface UnresolvedSlot {
    dayName: string;
    slotIdx: number;
    muscle: string;
}

/** Structural equality for a meso plan (arrays of exercise ids per day). */
export const isSamePlan = (a: ReadonlyArray<ReadonlyArray<string | null>>, b: ReadonlyArray<ReadonlyArray<string | null>> | undefined): boolean =>
    !!b && a.length === b.length && a.every((day, i) => day.length === (b[i]?.length ?? -1) && day.every((id, j) => id === b[i][j]));

export const useProgramEditState = ({ onBack }: ProgramEditViewProps) => {
    const { program, setProgram, lang, exercises, config, setConfig } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const t = TRANSLATIONS[lang];

    const [editorIntent] = useState<MesoEditorIntent | null>(() => consumeMesoEditorIntent());
    const [initialDraft] = useState(() => (editorIntent ? loadMesocycleDraft() : null));

    const isCreatingWithDraft = editorIntent !== null;
    const isStructuredKong = !isCreatingWithDraft && activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const isEditingActiveRoutine = !!activeMeso && !isCreatingWithDraft;

    // Isolated draft program buffer when creating a new cycle while another meso may be active
    const [draftProgram, setDraftProgramState] = useState<ProgramDay[]>(() => {
        if (initialDraft?.program) return initialDraft.program;
        return Array.isArray(program) ? program : [];
    });

    const workingProgram: ProgramDay[] = isCreatingWithDraft ? draftProgram : program;
    const setWorkingProgram = useCallback((updater: ProgramDay[] | ((prev: ProgramDay[]) => ProgramDay[])) => {
        if (isCreatingWithDraft) {
            setDraftProgramState(prev => typeof updater === 'function' ? updater(prev) : updater);
        } else {
            setProgram(updater);
        }
    }, [isCreatingWithDraft, setProgram]);

    const [showPrioritiesStep, setShowPrioritiesStep] = useState<boolean>(editorIntent === 'builder');
    const [reduceSynergists, setReduceSynergists] = useState<boolean>(true);
    const [musclePriorities, setMusclePriorities] = useState<Partial<Record<MuscleGroup, MusclePriorityLevel>>>(() => {
        if (initialDraft?.musclePriorities) return initialDraft.musclePriorities;
        if (!isCreatingWithDraft && activeMeso?.musclePriorities) return activeMeso.musclePriorities;
        return {};
    });

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
        name: initialDraft?.name || activeMeso?.name || (TRANSLATIONS[lang].copy.programEdit.customCycle),
        type: initialDraft?.mesoType || activeMeso?.mesoType || 'hyp_1',
        weeks: initialDraft?.weeks || activeMeso?.targetWeeks || activeMeso?.duration || 5,
    }));
    const hasKnownPhase = Object.prototype.hasOwnProperty.call(t.phases, mesoConfig.type);

    const latestSaveRef = useRef({
        isEditingActiveRoutine,
        program,
        activeMeso,
        workingProgram,
        mesoConfig,
        musclePriorities,
        isCreatingWithDraft,
    });
    latestSaveRef.current = {
        isEditingActiveRoutine,
        program,
        activeMeso,
        workingProgram,
        mesoConfig,
        musclePriorities,
        isCreatingWithDraft,
    };

    const flushSave = useCallback(() => {
        const snap = latestSaveRef.current;
        if (snap.isEditingActiveRoutine && snap.activeMeso) {
            const updatedPlan = (snap.program || []).map((day: ProgramDay) => (day.slots || []).map(s => s.exerciseId || null));
            if (!isSamePlan(updatedPlan, snap.activeMeso.plan)) {
                setActiveMeso(prev => prev ? { ...prev, plan: updatedPlan } : prev);
            }
            setSaveStatus('saved');
            return;
        }
        const hasContent = (snap.workingProgram || []).length > 0 && (snap.workingProgram || []).some(d => (d.slots || []).length > 0);
        if (!hasContent && !snap.isCreatingWithDraft) return;
        saveMesocycleDraft({
            name: snap.mesoConfig.name,
            mesoType: snap.mesoConfig.type,
            weeks: snap.mesoConfig.weeks,
            program: snap.workingProgram,
            musclePriorities: snap.musclePriorities,
            updatedAt: Date.now(),
        });
    }, [setActiveMeso]);

    // Sync active meso plan & priorities if editing active routine
    useEffect(() => {
        if (!isEditingActiveRoutine || !activeMeso) return;
        const updatedPlan = program.map((day: ProgramDay) => (day.slots || []).map(s => s.exerciseId || null));
        if (isSamePlan(updatedPlan, activeMeso.plan)) {
            setSaveStatus('saved');
            return;
        }
        setSaveStatus('saving');
        const timer = setTimeout(() => {
            setActiveMeso(prev => prev ? { ...prev, plan: updatedPlan } : prev);
            setSaveStatus('saved');
        }, 300);
        return () => clearTimeout(timer);
    }, [isEditingActiveRoutine, program, activeMeso, setActiveMeso]);

    // Auto-save draft when creating a new mesocycle ("Resume plan in progress")
    useEffect(() => {
        if (isEditingActiveRoutine || !workingProgram) return;
        const hasContent = workingProgram.length > 0 && workingProgram.some(d => (d.slots || []).length > 0);
        if (!hasContent && !isCreatingWithDraft) return;
        const timer = setTimeout(() => {
            saveMesocycleDraft({
                name: mesoConfig.name,
                mesoType: mesoConfig.type,
                weeks: mesoConfig.weeks,
                program: workingProgram,
                musclePriorities,
                updatedAt: Date.now(),
            });
        }, 350);
        return () => clearTimeout(timer);
    }, [isEditingActiveRoutine, isCreatingWithDraft, workingProgram, mesoConfig, musclePriorities]);

    const handleToggleRestDay = useCallback((id: string, dayIdx: number, enableRest: boolean) => {
        setWorkingProgram(prev => prev.map(d => d.id === id ? {
            ...d,
            dayName: enableRest
                ? { en: 'Rest Day', es: 'Descanso' }
                : { en: `Day ${dayIdx + 1}`, es: `Día ${dayIdx + 1}` },
            slots: enableRest ? [] : d.slots,
        } : d));
    }, [setWorkingProgram]);

    const handleSetMusclePriority = useCallback((muscle: MuscleGroup, level: MusclePriorityLevel) => {
        setMusclePriorities(prev => ({ ...prev, [muscle]: level }));
        if (!isEditingActiveRoutine) {
            // Adjust default set targets smoothly for unassigned/builder slots matching this muscle
            const suggestedSets = level === 'emphasize' ? 4 : level === 'grow' ? 3 : 2;
            setWorkingProgram(prev => prev.map(d => ({
                ...d,
                slots: (d.slots || []).map(s => s.muscle === muscle ? { ...s, setTarget: suggestedSets } : s),
            })));
        }
    }, [isEditingActiveRoutine, setWorkingProgram]);

    const priorityCounts = useMemo(() => {
        const musclesInPlan = new Set<MuscleGroup>();
        for (const day of workingProgram || []) {
            for (const slot of day.slots || []) {
                if (slot.muscle && slot.muscle !== 'CARDIO') musclesInPlan.add(slot.muscle);
            }
        }
        let emphasize = 0;
        let grow = 0;
        let maintain = 0;
        for (const m of musclesInPlan) {
            const lvl = musclePriorities[m] || 'grow';
            if (lvl === 'emphasize') emphasize++;
            else if (lvl === 'maintain') maintain++;
            else grow++;
        }
        return { emphasize, grow, maintain, muscles: Array.from(musclesInPlan) };
    }, [workingProgram, musclePriorities]);

    const splitConflicts = useMemo(
        () => detectSplitConflicts(workingProgram),
        [workingProgram]
    );

    const handleApplyPrioritiesToSplit = useCallback(() => {
        const res = applyMusclePrioritiesToProgram(workingProgram, musclePriorities, { reduceSynergists });
        setWorkingProgram(res.program);
        setMusclePriorities(res.updatedPriorities);
        triggerHaptic('success');
    }, [workingProgram, musclePriorities, reduceSynergists, setWorkingProgram]);

    const handleAutoFixConflicts = useCallback(() => {
        setWorkingProgram(prev => reorderDaysToResolveConflicts(prev));
        triggerHaptic('success');
    }, [setWorkingProgram]);

    const handleUpdateDayName = useCallback((id: string, name: string) => {
        setWorkingProgram(prev => prev.map(d => d.id === id ? { ...d, dayName: { en: name, es: name } } : d));
    }, [setWorkingProgram]);

    const handleAddDay = useCallback(() => {
        const newDay: ProgramDay = {
            id: `d_${Date.now()}`,
            dayName: { en: 'New Day', es: 'Nuevo Día' },
            slots: []
        };
        setWorkingProgram(prev => [...prev, newDay]);
        triggerHaptic('success');
    }, [setWorkingProgram]);

    const handleDeleteDay = useCallback(() => {
        if (dayToDelete) {
            setWorkingProgram(prev => prev.filter(d => d.id !== dayToDelete));
            setDayToDelete(null);
            triggerHaptic('medium');
        }
    }, [dayToDelete, setWorkingProgram]);

    const handleAddSlot = useCallback((dayId: string) => {
        setWorkingProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const currentSlots = d.slots || [];
            return { ...d, slots: [...currentSlots, { muscle: 'CHEST', setTarget: 3 }] };
        }));
        triggerHaptic('light');
    }, [setWorkingProgram]);

    const handleRemoveSlot = useCallback((dayId: string, idx: number) => {
        setWorkingProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            newSlots.splice(idx, 1);
            return { ...d, slots: newSlots };
        }));
        triggerHaptic('light');
    }, [setWorkingProgram]);

    const handleMoveSlot = useCallback((dayId: string, fromIdx: number, delta: -1 | 1) => {
        setWorkingProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const slots = [...(d.slots || [])];
            const toIdx = fromIdx + delta;
            if (toIdx < 0 || toIdx >= slots.length) return d;
            const [item] = slots.splice(fromIdx, 1);
            slots.splice(toIdx, 0, item);
            return { ...d, slots };
        }));
        triggerHaptic('light');
    }, [setWorkingProgram]);

    const handleUpdateSlot = useCallback((dayId: string, idx: number, field: string, val: any) => {
        setWorkingProgram(prev => prev.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...(d.slots || [])];
            if (!newSlots[idx]) return d;
            newSlots[idx] = { ...newSlots[idx], [field]: val };
            return { ...d, slots: newSlots };
        }));
    }, [setWorkingProgram]);

    const handleAutoRecommendDay = useCallback((dayId: string) => {
        const prefEquip = config?.useExerciseTypeFilters ? config?.preferredEquipment : undefined;
        setWorkingProgram(prev => prev.map(day => {
            if (day.id !== dayId) return day;
            const slots = [...(day.slots || [])];
            const hasEmpty = slots.some(s => !s.exerciseId);
            const usedIds: string[] = hasEmpty
                ? slots.map(s => s.exerciseId).filter((id): id is string => Boolean(id))
                : [];

            const nextSlots = slots.map(slot => {
                if (hasEmpty && slot.exerciseId) return slot;
                const recs = recommendExercisesForMuscle(exercises || [], slot.muscle, prefEquip, usedIds, lang);
                if (recs.length > 0) {
                    usedIds.push(recs[0].id);
                    return { ...slot, exerciseId: recs[0].id };
                }
                return slot;
            });
            return { ...day, slots: nextSlots };
        }));
        triggerHaptic('success');
    }, [config?.preferredEquipment, config?.useExerciseTypeFilters, exercises, lang, setWorkingProgram]);

    const handleSelectExercise = useCallback((exId: string) => {
        if (!pickingForSlot) return;
        handleUpdateSlot(pickingForSlot.dayId, pickingForSlot.slotIdx, 'exerciseId', exId);
        setPickingForSlot(null);
    }, [pickingForSlot, handleUpdateSlot]);

    const handleValidateAndOpenStartModal = () => {
        const unresolved: UnresolvedSlot[] = [];
        workingProgram.forEach((day, dIdx) => {
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
        if (isCreatingWithDraft) {
            setProgram(workingProgram);
        }
        const plan = workingProgram.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        const emphasizedMuscles = Object.entries(musclePriorities)
            .filter(([, p]) => p === 'emphasize')
            .map(([m]) => m as MuscleGroup);

        setActiveMeso({
            id: Date.now(),
            name: mesoConfig.name,
            mesoType: mesoConfig.type,
            week: 1,
            targetWeeks: mesoConfig.weeks,
            plan,
            isDeload: false,
            duration: mesoConfig.weeks,
            ...(Object.keys(musclePriorities).length > 0 ? { musclePriorities } : {}),
            ...(emphasizedMuscles.length > 0
                ? {
                    specializationBlock: {
                        targetMuscles: emphasizedMuscles,
                        currentMeso: 1,
                        totalMesos: 3,
                        phase: 'accumulate' as const,
                    },
                }
                : {}),
        });
        clearMesocycleDraft();
        triggerHaptic('success');
        onBack();
    };

    const weightUnit: WeightUnit = config?.weightUnit === 'lb' ? 'lb' : 'kg';
    const handleWeightUnitChange = useCallback((u: WeightUnit) => {
        setConfig?.({ weightUnit: u });
    }, [setConfig]);

    return {
        onBack,
        program: workingProgram,
        setProgram: setWorkingProgram,
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
        showPrioritiesStep,
        setShowPrioritiesStep,
        musclePriorities,
        handleSetMusclePriority,
        priorityCounts,
        reduceSynergists,
        setReduceSynergists,
        splitConflicts,
        handleApplyPrioritiesToSplit,
        handleAutoFixConflicts,
        handleUpdateDayName,
        handleToggleRestDay,
        flushSave,
        handleAddDay,
        handleDeleteDay,
        handleAddSlot,
        handleRemoveSlot,
        handleMoveSlot,
        handleUpdateSlot,
        handleAutoRecommendDay,
        handleSelectExercise,
        handleValidateAndOpenStartModal,
        handleStartMeso,
        weightUnit,
        handleWeightUnitChange,
    };
};

export type ProgramEditState = ReturnType<typeof useProgramEditState>;
