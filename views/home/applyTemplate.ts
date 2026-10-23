// Hoy and Rutina share the same plan-change boundary, including live-session consent.
import { useRef, useState } from 'react';
import { getTranslated } from '../../utils';
import { triggerHaptic } from '../../utils/audio';
import { useTimerActions } from '../../context/TimerContext';
import { useStore } from '../../lib/store';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { startProgramRun } from '../../programs/engine/ProgramRunHelpers';
import type { GlobalTemplate, Lang, MesoCycle, ProgramDay, UserProfile } from '../../types';

interface TemplateActionDeps {
    setProgram: (program: ProgramDay[]) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    setShowTemplateSelector: (open: boolean) => void;
    onEditProgram: () => void;
    userProfile?: UserProfile | null;
    lang: Lang;
}

export interface TemplateActions {
    handleSelectTemplate: (template: GlobalTemplate) => void;
    handleSelectProgram: (programId: string) => void;
    handleCreateCustom: () => void;
    templateChangeConfirmation: { isOpen: boolean; onConfirm: () => void; onCancel: () => void };
}

export const useTemplateActions = ({ setProgram, setActiveMeso, setShowTemplateSelector, onEditProgram, userProfile, lang }: TemplateActionDeps): TemplateActions => {
    const { setRestTimer } = useTimerActions();
    const pendingChange = useRef<(() => void) | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const requestChange = (apply: () => void) => {
        // Read at the action boundary, not from a possibly stale render.
        if (useStore.getState().activeSession) {
            pendingChange.current = apply;
            setIsOpen(true);
        } else {
            apply();
        }
    };
    const cancelChange = () => {
        pendingChange.current = null;
        setIsOpen(false);
    };
    const confirmChange = () => {
        const apply = pendingChange.current;
        if (!apply) return;
        pendingChange.current = null;
        setIsOpen(false);
        // Match workout discard semantics before replacing the plan. Cancel never
        // touches the session, its progress, or the native-backed rest timer.
        setRestTimer(prev => ({ ...prev, active: false, timeLeft: 0, endAt: 0 }));
        useStore.getState().setActiveSession(null);
        apply();
    };

    const handleSelectTemplate = (tpl: GlobalTemplate) => {
        requestChange(() => {
            setProgram(tpl.program);
            const plan = tpl.program.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
            setActiveMeso({ id: Date.now(), name: getTranslated(tpl.title, lang), mesoType: tpl.id, week: 1, targetWeeks: 5, isDeload: false, plan, duration: 5 });
            setShowTemplateSelector(false);
            triggerHaptic('success');
        });
    };
    const handleSelectProgram = (programId: string) => {
        if (programId !== KONG_4DAY_V1.id) return;
        requestChange(() => {
            const firstWeek = resolveProgramWeek(KONG_4DAY_V1, 1);
            setProgram(firstWeek);
            const plan = firstWeek.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
            setActiveMeso({ id: Date.now(), name: 'KONG · Savage Size', mesoType: KONG_4DAY_V1.id, week: 1, targetWeeks: KONG_4DAY_V1.durationWeeks, isDeload: false, plan, duration: KONG_4DAY_V1.durationWeeks, programSystem: startProgramRun(KONG_4DAY_V1, userProfile?.bodyWeight) });
            setShowTemplateSelector(false);
            triggerHaptic('success');
        });
    };
    const handleCreateCustom = () => requestChange(() => {
        setProgram([]);
        setActiveMeso(null);
        setShowTemplateSelector(false);
        onEditProgram();
    });

    return { handleSelectTemplate, handleSelectProgram, handleCreateCustom, templateChangeConfirmation: { isOpen, onConfirm: confirmChange, onCancel: cancelChange } };
};
