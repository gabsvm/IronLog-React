import { useCallback, useEffect, useRef } from 'react';
import { ExerciseDef, ProgramDay, GlobalTemplate } from '../../types';
import type { Dispatch, SetStateAction } from 'react';

export interface UseDefaultsBootstrapDeps {
    program: ProgramDay[];
    setProgram: (value: ProgramDay[] | ((val: ProgramDay[]) => ProgramDay[])) => void;
    programLoading: boolean;
    exercises: ExerciseDef[];
    setExercises: (value: ExerciseDef[] | ((val: ExerciseDef[]) => ExerciseDef[])) => void;
    exLoading: boolean;
    setGlobalTemplates: Dispatch<SetStateAction<GlobalTemplate[]>>;
    defaultLibrary: ExerciseDef[] | null;
    setDefaultLibrary: Dispatch<SetStateAction<ExerciseDef[] | null>>;
    defaultTemplate: ProgramDay[] | null;
    setDefaultTemplate: Dispatch<SetStateAction<ProgramDay[] | null>>;
    baseTemplates: GlobalTemplate[] | null;
    setBaseTemplates: Dispatch<SetStateAction<GlobalTemplate[] | null>>;
    setDefaultsLoading: Dispatch<SetStateAction<boolean>>;
}

/** S6: seeds missing default program/library on first boot and lazy-loads full template catalog on demand. */
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
    baseTemplates,
    setBaseTemplates,
    setDefaultsLoading,
}: UseDefaultsBootstrapDeps) => {
    const seededProgramRef = useRef(false);
    const seededExercisesRef = useRef(false);
    const baseTemplatesRef = useRef(baseTemplates);
    baseTemplatesRef.current = baseTemplates;
    const templatesLoadPromiseRef = useRef<Promise<void> | null>(null);

    useEffect(() => {
        if (programLoading || exLoading) return;

        const needProgram = program.length === 0 && !defaultTemplate && !seededProgramRef.current;
        const needExercises = exercises.length === 0 && !defaultLibrary && !seededExercisesRef.current;

        if (!needProgram && !needExercises) {
            setDefaultsLoading(false);
            return;
        }

        let cancelled = false;
        const loadMissingDefaults = async () => {
            try {
                const [libMod, progMod] = await Promise.all([
                    needExercises ? import('../../data/defaultLibrary') : Promise.resolve(null),
                    needProgram ? import('../../data/defaultProgram') : Promise.resolve(null),
                ]);

                if (cancelled) return;

                if (libMod?.DEFAULT_LIBRARY) {
                    seededExercisesRef.current = true;
                    setDefaultLibrary(libMod.DEFAULT_LIBRARY);
                }
                if (progMod?.DEFAULT_TEMPLATE) {
                    seededProgramRef.current = true;
                    setDefaultTemplate(progMod.DEFAULT_TEMPLATE);
                }
            } finally {
                if (!cancelled) setDefaultsLoading(false);
            }
        };

        void loadMissingDefaults();

        return () => {
            cancelled = true;
        };
    }, [
        programLoading,
        exLoading,
        program.length,
        exercises.length,
        defaultLibrary,
        defaultTemplate,
        setDefaultLibrary,
        setDefaultTemplate,
        setDefaultsLoading,
    ]);

    const ensureGlobalTemplatesLoaded = useCallback(async () => {
        if (baseTemplatesRef.current) return;
        if (templatesLoadPromiseRef.current) {
            return templatesLoadPromiseRef.current;
        }

        const promise = import('../../data/defaultTemplates')
            .then(({ INITIAL_TEMPLATES }) => {
                setBaseTemplates(INITIAL_TEMPLATES);
                setGlobalTemplates((prev) => (prev.length > 0 ? prev : INITIAL_TEMPLATES));
            })
            .catch((err) => {
                templatesLoadPromiseRef.current = null;
                throw err;
            });

        templatesLoadPromiseRef.current = promise;
        return promise;
    }, [setBaseTemplates, setGlobalTemplates]);

    useEffect(() => {
        if (programLoading || !defaultTemplate || program.length > 0) return;
        setProgram(defaultTemplate);
    }, [programLoading, defaultTemplate, program, setProgram]);

    useEffect(() => {
        if (exLoading || !defaultLibrary || exercises.length > 0) return;
        setExercises(defaultLibrary);
    }, [exLoading, defaultLibrary, exercises, setExercises]);

    return { ensureGlobalTemplatesLoaded };
};
