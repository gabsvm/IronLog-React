import React from 'react';

interface Props {
    week: number;
    totalWeeks?: number;
    lang: 'en' | 'es';
    name?: string;
}

export const ProgramProgressStrip: React.FC<Props> = ({ week, totalWeeks = 12, lang, name = 'KONG' }) => {
    const safeWeek = Math.min(Math.max(1, week), totalWeeks);
    const block = Math.min(3, Math.ceil(safeWeek / 4));

    return (
        <section className="mx-4 mb-2 rounded-2xl border border-[rgb(var(--border-subtle)/0.72)] bg-[rgb(var(--surface-raised)/0.58)] px-3.5 py-3" aria-label={lang === 'es' ? 'Progreso del programa' : 'Program progress'}>
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <div className="truncate text-xs font-black text-[rgb(var(--text-primary))]">{name}</div>
                    <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[rgb(var(--text-muted))]">
                        {lang === 'es' ? `Bloque ${block} · Semana ${safeWeek} de ${totalWeeks}` : `Block ${block} · Week ${safeWeek} of ${totalWeeks}`}
                    </div>
                </div>
                <span className="shrink-0 text-xs font-black tabular-nums text-primary-500">{Math.round((safeWeek / totalWeeks) * 100)}%</span>
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
        </section>
    );
};
