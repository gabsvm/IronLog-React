import { useCallback, useEffect } from 'react';
import { SessionBuilder } from '../services/SessionBuilder';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { resolveProgramDay } from '../programs/engine/ProgramResolver';
import { useWidgetLaunchAction } from './useWidgetLaunchAction';

interface ShortcutLaunchInput {
    isAppLoading: boolean;
    activeSession: any;
    activeMeso: any;
    logs: any;
    program: any;
    exercises: any;
    lang: 'es' | 'en';
    rpFeedback: any;
    config: any;
    setActiveSession: (session: any) => void;
    setView: (view: any) => void;
}

/**
 * Q18: shortcut launch flow, moved verbatim from App. The shared start flow
 * (resume → scheduled meso day → quick start) serves both the PWA
 * ?action=start shortcut and the Android widget (Q17).
 */
export const useShortcutLaunch = ({
    isAppLoading, activeSession, activeMeso, logs, program, exercises,
    lang, rpFeedback, config, setActiveSession, setView,
}: ShortcutLaunchInput) => {
    // Shared start flow for the PWA shortcut and the Android widget (Q17).
    const runStartAction = useCallback(() => {
        // 1. Resume active workout if one exists
        if (activeSession) {
            setView('workout');
            return;
        }

        // 2. Start scheduled session from active meso if available
        if (activeMeso) {
            const logsForWeek = (Array.isArray(logs) ? logs : []).filter(
                (l: any) => l.mesoId === activeMeso.id && l.week === activeMeso.week
            );
            const completedDays = new Set(logsForWeek.map((l: any) => l.dayIdx));
            const totalDays = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id
                ? 4
                : (Array.isArray(program) ? program.length : 0);

            let targetIdx = 0;
            for (let i = 0; i < totalDays; i++) {
                if (!completedDays.has(i)) {
                    targetIdx = i;
                    break;
                }
            }

            const safeProgram = Array.isArray(program) ? program : [];
            const dayDef = activeMeso.programSystem?.systemId === KONG_4DAY_V1.id
                ? resolveProgramDay(KONG_4DAY_V1, activeMeso.week, targetIdx, activeMeso.programSystem.substitutions)
                : safeProgram[targetIdx];

            if (dayDef) {
                const newSession = SessionBuilder.buildFromProgramDay(
                    targetIdx,
                    dayDef,
                    activeMeso,
                    Array.isArray(exercises) ? exercises : [],
                    Array.isArray(logs) ? logs : [],
                    lang,
                    rpFeedback,
                    config
                );
                if (newSession) {
                    setActiveSession(newSession);
                    setView('workout');
                    return;
                }
            }
        }

        // 3. Fallback: Quick Start session
        const quickSession = {
            id: Date.now(),
            name: lang === 'es' ? 'Sesión Rápida' : 'Quick Start Session',
            dayIdx: -1,
            mesoId: -1,
            week: -1,
            exercises: [],
            startTime: Date.now(),
            isDeload: false,
        };
        setActiveSession(quickSession);
        setView('workout');
    }, [activeSession, activeMeso, logs, program, exercises, lang, rpFeedback, config, setActiveSession, setView]);

    // Handle PWA shortcut actions (e.g. /?action=start&source=shortcut)
    useEffect(() => {
        if (isAppLoading) return;
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action === 'start') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            runStartAction();
        } else if (action === 'nutrition' || action === 'history') {
            // S3: manifest shortcuts "Registrar comida" / "Historial".
            window.history.replaceState({}, document.title, window.location.pathname);
            setView(action);
        }
    }, [isAppLoading, runStartAction, setView]);

    // Q17: widget taps run the same start flow (cold mount + warm resume).
    useWidgetLaunchAction(!isAppLoading, runStartAction);
};
