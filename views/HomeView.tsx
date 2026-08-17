import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { HomeView as HomeViewImpl } from './HomeViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { useStore } from '../lib/store';
import { KONG_4DAY_V1 } from '../programs/kong/kong4Day';
import { getProgramBlockForWeek, resolveProgramWeek } from '../programs/engine/ProgramResolver';
import { getKongDayDisplay } from '../programs/kong/kongDisplay';
import { ProgramProgressStrip } from '../components/programs/ProgramProgressStrip';
import './product-polish.css';
import './reorder-history-polish.css';
import './kong-final-polish.css';
import './today-benchmark.css';

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
    const rootRef = useRef<HTMLDivElement>(null);
    const [showSkippedFinalCompletion, setShowSkippedFinalCompletion] = useState(false);
    const isKong = activeMeso?.programSystem?.systemId === KONG_4DAY_V1.id;
    const substitutionSignature = useMemo(
        () => JSON.stringify(activeMeso?.programSystem?.substitutions || {}),
        [activeMeso?.programSystem?.substitutions],
    );

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
    }, [activeMeso?.week, isKong, setProgram, substitutionSignature]);

    useEffect(() => {
        if (!isKong || !activeMeso || activeSession) return;
        const safeLogs = Array.isArray(logs) ? logs : [];
        const currentWeekLogs = safeLogs.filter(log => log.mesoId === activeMeso.id && log.week === activeMeso.week);
        if (!currentWeekLogs.some(log => log.skipped)) return;

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

    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;

        const normalizeProductLabels = () => {
            const label = lang === 'es' ? 'PERSONALIZADO' : 'CUSTOM';
            root.querySelectorAll<HTMLElement>('span').forEach((node) => {
                const text = (node.textContent || '').trim();
                if (/^(tpl_|personal_)/i.test(text)) {
                    node.classList.add('product-internal-plan-id');
                    node.dataset.productLabel = label;
                }
                if (isKong && lang === 'es' && /^KONG\s*·\s*BLOCK\s+\d+$/i.test(text)) {
                    node.textContent = text.replace(/BLOCK/i, 'BLOQUE');
                }
            });

            if (isKong) {
                const settingsButton = root.querySelector<HTMLElement>('#tut-settings-btn');
                settingsButton?.closest('.flex.justify-between.items-start.pt-2')?.classList.add('kong-home-header');
            }
        };

        normalizeProductLabels();
        const observer = new MutationObserver(normalizeProductLabels);
        observer.observe(root, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, [isKong, lang]);

    return (
        <div ref={rootRef} className={`product-home-polish ${isKong ? 'kong-active' : ''} contents`}>
            {isKong && activeMeso && (
                <ProgramProgressStrip
                    week={activeMeso.week}
                    totalWeeks={KONG_4DAY_V1.durationWeeks}
                    lang={lang}
                    name={activeMeso.name || 'KONG · Savage Size'}
                />
            )}
            <HomeViewImpl {...props} />
            {showSkippedFinalCompletion && activeMeso && isKong && (
                <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}>
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
