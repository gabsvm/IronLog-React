// S6: idle load of the bundled library/templates and empty-state defaults, moved verbatim from context/AppContext.tsx.
import { useEffect } from 'react';
import { ExerciseDef, ProgramDay, GlobalTemplate } from '../../types';
import { scheduleWhenIdle } from '../../lib/idle';
import type { Dispatch, SetStateAction } from 'react';

export interface UseDefaultsBootstrapDeps {
    program: ProgramDay[];
    setProgram: (value: ProgramDay[] | ((val: ProgramDay[]) => ProgramDay[])) => void;
    programLoading: boolean;
    exercises: ExerciseDef[];
    setExercises: (value: ExerciseDef[] | ((val: ExerciseDef[]) => ExerciseDef[])) => void;
    exLoading: boolean;
    setGlobalTemplates: Dispatch<SetStateAction<GlobalTemplate[]>>;
    defaultLibrary: ExerciseDef[];
    setDefaultLibrary: Dispatch<SetStateAction<ExerciseDef[]>>;
    defaultTemplate: ProgramDay[];
    setDefaultTemplate: Dispatch<SetStateAction<ProgramDay[]>>;
    setBaseTemplates: Dispatch<SetStateAction<GlobalTemplate[]>>;
    setDefaultsLoading: Dispatch<SetStateAction<boolean>>;
}

/** S6: idle load of the bundled library/templates and empty-state defaults (moved verbatim from AppProvider; same hook order). */
export const useDefaultsBootstrap = ({
    program,
    setProgram,
    programLoading,
    exercises,
    setExercises,
    exLoading,
    setGlobalTemplates,
    defaultLibrary,
    setDefaultLibrary,
    defaultTemplate,
    setDefaultTemplate,
    setBaseTemplates,
    setDefaultsLoading,
}: UseDefaultsBootstrapDeps) => {
    useEffect(() => {
        let cancelled = false;
        const cancelIdle = scheduleWhenIdle(async () => {
            try {
                const [{ DEFAULT_LIBRARY }, { DEFAULT_TEMPLATE, INITIAL_TEMPLATES }] = await Promise.all([
                    import('../../data/defaultLibrary'),
                    import('../../data/defaultTemplates'),
                ]);

                if (cancelled) return;

                setDefaultLibrary(DEFAULT_LIBRARY);
                setDefaultTemplate(DEFAULT_TEMPLATE);
                setBaseTemplates(INITIAL_TEMPLATES);
                setGlobalTemplates((prev) => (prev.length > 0 ? prev : INITIAL_TEMPLATES));
            } finally {
                if (!cancelled) setDefaultsLoading(false);
            }
        }, 200);

        return () => {
            cancelled = true;
            cancelIdle();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- S6: dependency list moved verbatim from AppProvider; the omitted names are useState setters/refs (stable) or the per-render withDirtyTrackingSuppressed, exactly as before.
    }, []);

    useEffect(() => {
        if (programLoading || !defaultTemplate || program.length > 0) return;
        setProgram(defaultTemplate);
    }, [programLoading, defaultTemplate, program, setProgram]);

    useEffect(() => {
        if (exLoading || !defaultLibrary || exercises.length > 0) return;
        setExercises(defaultLibrary);
    }, [exLoading, defaultLibrary, exercises, setExercises]);
};
