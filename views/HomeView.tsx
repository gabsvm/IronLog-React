import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { HomeView as HomeViewImpl } from './HomeViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { useStore } from '../lib/store';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramWeek } from '../programs/engine/ProgramResolver';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';

const ProgramCompletionView = React.lazy(() =>
    import('../components/programs/ProgramCompletionView').then((module) => ({ default: module.ProgramCompletionView })),
);

interface HomeViewProps {
    startSession: (dayIdx: number) => void;
    onEditProgram: () => void;
    onSkipSession?: (dayIdx: number) => void;
    onStartFreeSession?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = (props) => {
    const { lang } = useAppPreferences();
    const { setProgram, logs } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const activeSession = useStore(state => state.activeSession);
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const [showSkippedFinalCompletion, setShowSkippedFinalCompletion] = useState(false);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const substitutionSignature = useMemo(
        () => JSON.stringify(activeMeso?.programSystem?.substitutions || {}),
        [activeMeso?.programSystem?.substitutions],
    );

    // KONG is a dynamic 12-week system. Keep the legacy `program` projection in
    // sync with the current global week so Home, skip labels, estimates and any
    // legacy consumers never remain stuck on Block 1 after the resolver advances.
    useEffect(() => {
        if (!isKong || !activeMeso) return;
        const { block } = getProgramBlockForWeek(KONG_4DAY_V1, activeMeso.week);
        const resolved = resolveProgramWeek(
            KONG_4DAY_V1,
            activeMeso.week,
            activeMeso.programSystem?.substitutions || {},
        ).map((day, dayIndex) => ({
            ...day,
            dayName: getKongDayDisplay(block.number, dayIndex),
        }));

        setProgram(prev => JSON.stringify(prev) === JSON.stringify(resolved) ? prev : resolved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMeso?.week, isKong, setProgram, substitutionSignature]);

    // Legacy week completion only auto-advances after four non-skipped workouts.
    // In KONG, a deliberate Skip resolves that scheduled slot but should reduce
    // adherence rather than trap the user on a week with no remaining day.
    useEffect(() => {
        if (!isKong || !activeMeso || activeSession) return;
        const safeLogs = Array.isArray(logs) ? logs : [];
        const currentWeekLogs = safeLogs.filter(log => log.mesoId === activeMeso.id && log.week === activeMeso.week);
        if (!currentWeekLogs.some(log => log.skipped)) return;

        // If all four days were eventually trained, App's normal completion path
        // owns the transition. The wrapper only compensates for a genuinely
        // skipped scheduled slot, preventing duplicate completion modals.
        const completedDays = new Set(
            currentWeekLogs
                .filter(log => !log.skipped)
                .map(log => log.dayIdx)
                .filter(dayIdx => dayIdx >= 0 && dayIdx < KONG_4DAY_V1.daysPerWeek),
        );
        if (completedDays.size >= KONG_4DAY_V1.daysPerWeek) return;

        const resolvedDays = new Set(
            currentWeekLogs
                .map(log => log.dayIdx)
                .filter(dayIdx => dayIdx >= 0 && dayIdx < KONG_4DAY_V1.daysPerWeek),
        );
        if (resolvedDays.size < KONG_4DAY_V1.daysPerWeek) return;

        if (activeMeso.week >= KONG_4DAY_V1.durationWeeks) {
            setShowSkippedFinalCompletion(true);
            return;
        }

        const mesoId = activeMeso.id;
        const completedWeek = activeMeso.week;
        setActiveMeso(prev => (
            prev && prev.id === mesoId && prev.week === completedWeek
                ? { ...prev, week: prev.week + 1, isDeload: false }
                : prev
        ));
    }, [activeMeso, activeSession, isKong, logs, setActiveMeso]);

    return (
        <div className={`product-home-polish ${isKong ? 'kong-active' : ''} contents`}>
            <HomeViewImpl {...props} />
            {showSkippedFinalCompletion && activeMeso && isKong && (
                <Suspense fallback={null}>
                    <ProgramCompletionView
                        meso={activeMeso}
                        logs={Array.isArray(logs) ? logs : []}
                        lang={lang}
                        onFinish={() => {
                            setShowSkippedFinalCompletion(false);
                            setActiveMeso(null);
                        }}
                        onKeep={() => {
                            setShowSkippedFinalCompletion(false);
                            setActiveMeso(null);
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};
