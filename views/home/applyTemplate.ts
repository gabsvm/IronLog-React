// Shared template/library actions for Hoy + Rutina.
// Extracted verbatim from views/home/useHomeViewState.ts so both surfaces
// apply the same behavior (Pro gate, auto-start meso, KONG run, custom flow).
import { getTranslated } from '../../utils';
import { triggerHaptic } from '../../utils/audio';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { startProgramRun } from '../../programs/engine/ProgramRunHelpers';
import type { GlobalTemplate, Lang, MesoCycle, ProgramDay, UserProfile } from '../../types';

export interface TemplateActionDeps {
    setProgram: (program: ProgramDay[]) => void;
    setActiveMeso: (val: MesoCycle | null | ((prev: MesoCycle | null) => MesoCycle | null)) => void;
    setShowTemplateSelector: (open: boolean) => void;
    onEditProgram: () => void;
    checkPro: (feature: string) => boolean;
    userProfile?: UserProfile | null;
    lang: Lang;
}

export const createTemplateActions = ({
    setProgram,
    setActiveMeso,
    setShowTemplateSelector,
    onEditProgram,
    checkPro,
    userProfile,
    lang,
}: TemplateActionDeps): TemplateActions => {
    const handleSelectTemplate = (tpl: GlobalTemplate) => {
        if (tpl.isPro && !checkPro('Pro Template')) return;

        setProgram(tpl.program);

        // Auto-start Meso
        const plan = tpl.program.map((day) => (day.slots || []).map((slot) => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: getTranslated(tpl.title, lang),
            mesoType: tpl.id, // Using ID as type for tracking
            week: 1,
            targetWeeks: 5,
            isDeload: false,
            plan,
            duration: 5,
        });

        setShowTemplateSelector(false);
        triggerHaptic('success');
    };

    const handleSelectProgram = (programId: string) => {
        if (programId !== KONG_4DAY_V1.id) return;
        const firstWeek = resolveProgramWeek(KONG_4DAY_V1, 1);
        setProgram(firstWeek);
        const plan = firstWeek.map((day) => (day.slots || []).map((slot) => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: 'KONG · Savage Size',
            mesoType: KONG_4DAY_V1.id,
            week: 1,
            targetWeeks: KONG_4DAY_V1.durationWeeks,
            isDeload: false,
            plan,
            duration: KONG_4DAY_V1.durationWeeks,
            programSystem: startProgramRun(KONG_4DAY_V1, userProfile?.bodyWeight),
        });
        setShowTemplateSelector(false);
        triggerHaptic('success');
    };

    const handleCreateCustom = () => {
        // Clear program and go to editor
        setProgram([]); // Start empty
        setShowTemplateSelector(false);
        onEditProgram(); // Navigate to Editor
    };

    return { handleSelectTemplate, handleSelectProgram, handleCreateCustom };
};

export interface TemplateActions {
    handleSelectTemplate: (tpl: GlobalTemplate) => void;
    handleSelectProgram: (programId: string) => void;
    handleCreateCustom: () => void;
}
