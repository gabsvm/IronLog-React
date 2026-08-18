import React, { Suspense, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { Icon } from '../ui/Icon';

const ProgramHub = React.lazy(() =>
    import('./ProgramHub').then((module) => ({ default: module.ProgramHub })),
);

interface Props {
    week: number;
    totalWeeks?: number;
    lang: 'en' | 'es';
    name?: string;
}

export const ProgramProgressStrip: React.FC<Props> = ({ week, totalWeeks = 12, lang, name = 'KONG' }) => {
    const { logs } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const [showHub, setShowHub] = useState(false);
    const safeWeek = Math.min(Math.max(1, week), totalWeeks);
    const block = Math.min(3, Math.ceil(safeWeek / 4));

    return (
        <>
            <button
                type="button"
                onClick={() => activeMeso && setShowHub(true)}
                className="mx-4 mb-2 block w-[calc(100%-2rem)] rounded-2xl border border-[rgb(var(--border-subtle)/0.72)] bg-[rgb(var(--surface-raised)/0.58)] px-3.5 py-3 text-left transition-colors active:bg-[rgb(var(--surface-elevated)/0.82)]"
                aria-label={lang === 'es' ? 'Abrir guía, filosofía y programa KONG' : 'Open KONG guide, philosophy and program'}
            >
                <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-black text-[rgb(var(--text-primary))]">{name}</div>
                        <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">
                            {lang === 'es' ? `Bloque ${block} · Semana ${safeWeek} de ${totalWeeks}` : `Block ${block} · Week ${safeWeek} of ${totalWeeks}`}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-black tabular-nums text-primary-500">{Math.round((safeWeek / totalWeeks) * 100)}%</span>
                        <Icon name="ChevronRight" size={15} className="text-[rgb(var(--text-muted))]" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                    {[0, 1, 2].map(blockIndex => (
                        <div key={blockIndex} className="grid grid-cols-4 gap-1">
                            {[1, 2, 3, 4].map(inner => {
                                const absoluteWeek = blockIndex * 4 + inner;
                                const complete = absoluteWeek < safeWeek;
                                const current = absoluteWeek === safeWeek;
                                return (
                                    <span
                                        key={absoluteWeek}
                                        className={`h-1.5 rounded-full transition-colors ${current ? 'bg-primary-500' : complete ? 'bg-primary-500/45' : 'bg-[rgb(var(--surface-elevated))]'}`}
                                        aria-current={current ? 'step' : undefined}
                                        title={`${lang === 'es' ? 'Semana' : 'Week'} ${absoluteWeek}`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-[rgb(var(--text-muted))]">
                    <Icon name="BookOpen" size={12} className="text-primary-500" />
                    <span>{lang === 'es' ? 'Guía, filosofía y programa' : 'Guide, philosophy and program'}</span>
                </div>
            </button>

            {showHub && activeMeso && (
                <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}>
                    <ProgramHub
                        meso={activeMeso}
                        logs={Array.isArray(logs) ? logs : []}
                        lang={lang}
                        onClose={() => setShowHub(false)}
                    />
                </Suspense>
            )}
        </>
    );
};
