import React, { Suspense, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { Icon } from '../ui/Icon';
import { getProgramBlockForWeek } from '../../programs/engine/ProgramResolver';
import { getProgramDefinition } from '../../programs/registry';
import { KONG_4DAY_V1 } from '../../programs/kong/kong4Day';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../../programs/performance/performanceUpperLower';
import { GUTS_BLACK_SWORDSMAN_V1 } from '../../programs/naturalHypertrophy/gutsBlackSwordsman';

const ProgramHub = React.lazy(() =>
    import('./ProgramHub').then(module => ({ default: module.ProgramHub })),
);
const PerformanceProgramHub = React.lazy(() =>
    import('./PerformanceProgramHub').then(module => ({ default: module.PerformanceProgramHub })),
);
const GutsProgramHub = React.lazy(() =>
    import('./GutsProgramHub').then(module => ({ default: module.GutsProgramHub })),
);

interface Props {
    week: number;
    totalWeeks?: number;
    lang: 'en' | 'es';
    name?: string;
}

export const ProgramProgressStrip: React.FC<Props> = ({ week, totalWeeks = 12, lang, name }) => {
    const { logs } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const [showHub, setShowHub] = useState(false);
    const definition = activeMeso?.programSystem
        ? getProgramDefinition(activeMeso.programSystem.systemId, activeMeso.programSystem.systemVersion)
        : null;
    const resolvedTotal = definition?.durationWeeks || totalWeeks;
    const safeWeek = Math.min(Math.max(1, week), resolvedTotal);
    const blockResolution = definition ? getProgramBlockForWeek(definition, safeWeek) : null;
    const unitLabel = definition?.cadence?.unit === 'cycle'
        ? (lang === 'es' ? 'Ciclo' : 'Cycle')
        : (lang === 'es' ? 'Semana' : 'Week');
    const phaseLabel = blockResolution
        ? blockResolution.block.name[lang]
        : `${lang === 'es' ? 'Bloque' : 'Block'} ${Math.max(1, Math.ceil(safeWeek / 4))}`;
    const displayName = name || definition?.title || 'Program';
    const isKong = definition?.id === KONG_4DAY_V1.id;
    const isPerformance = definition?.id === PERFORMANCE_UPPER_LOWER_V1.id;
    const isGuts = definition?.id === GUTS_BLACK_SWORDSMAN_V1.id;

    const segments = useMemo(() => Array.from({ length: resolvedTotal }, (_, index) => index + 1), [resolvedTotal]);

    return (
        <>
            <button
                type="button"
                onClick={() => activeMeso && definition && setShowHub(true)}
                className="mx-4 mb-2 block rounded-2xl border border-[rgb(var(--border-subtle)/0.72)] bg-[rgb(var(--surface-raised)/0.58)] px-3.5 py-3 text-left transition-colors active:bg-[rgb(var(--surface-elevated)/0.82)]"
                aria-label={lang === 'es' ? `Abrir guía, filosofía y programa ${displayName}` : `Open ${displayName} guide, philosophy and program`}
            >
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-black text-[rgb(var(--text-primary))]">{displayName}</div>
                        <div className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">{unitLabel} {safeWeek} / {resolvedTotal} · {phaseLabel}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2"><span className="text-xs font-black tabular-nums text-primary-500">{Math.round((safeWeek / resolvedTotal) * 100)}%</span><Icon name="ChevronRight" size={15} className="text-[rgb(var(--text-muted))]"/></div>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.max(1, resolvedTotal)}, minmax(0, 1fr))` }}>{segments.map(segment => {
                    const complete = segment < safeWeek; const current = segment === safeWeek;
                    return <span key={segment} className={`h-1.5 rounded-full transition-colors ${current ? 'bg-primary-500' : complete ? 'bg-primary-500/45' : 'bg-[rgb(var(--surface-elevated))]'}`} aria-current={current ? 'step' : undefined} title={`${unitLabel} ${segment}`}/>;
                })}</div>
                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-[rgb(var(--text-muted))]"><Icon name="BookOpen" size={12} className="text-primary-500"/><span>{lang === 'es' ? 'Guía, filosofía y programa' : 'Guide, philosophy and program'}</span></div>
            </button>

            {showHub && activeMeso && definition && (
                <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]"/>}>
                    {isPerformance ? <PerformanceProgramHub meso={activeMeso} logs={Array.isArray(logs) ? logs : []} lang={lang} onClose={() => setShowHub(false)}/>
                        : isGuts ? <GutsProgramHub meso={activeMeso} logs={Array.isArray(logs) ? logs : []} lang={lang} onClose={() => setShowHub(false)}/>
                        : isKong ? <ProgramHub meso={activeMeso} logs={Array.isArray(logs) ? logs : []} lang={lang} onClose={() => setShowHub(false)}/>
                        : null}
                </Suspense>
            )}
        </>
    );
};
