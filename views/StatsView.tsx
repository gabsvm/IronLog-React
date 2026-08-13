import React, { useRef, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { Icon } from '../components/ui/Icon';
import './product-polish.css';

type StatsSection = 'overview' | 'progress' | 'volume';

/**
 * Segmented navigation over the existing Stats implementation.
 * Every existing calculation/chart stays intact; this layer makes the information
 * architecture explicit and houses consistency, which no longer competes on Home.
 */
export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs } = useApp();
    const rootRef = useRef<HTMLDivElement>(null);
    const [section, setSection] = useState<StatsSection>('overview');
    const safeLogs = Array.isArray(logs) ? logs : [];

    const goTo = (next: StatsSection) => {
        setSection(next);
        const root = rootRef.current;
        if (!root) return;
        const target = next === 'overview'
            ? root
            : root.querySelector<HTMLElement>(next === 'progress' ? '#tut-progress-chart' : '#tut-vol-bar');
        target?.scrollIntoView({ behavior: 'smooth', block: next === 'overview' ? 'start' : 'center' });
    };

    const items: Array<{ id: StatsSection; es: string; en: string }> = [
        { id: 'overview', es: 'Resumen', en: 'Overview' },
        { id: 'progress', es: 'Progreso', en: 'Progress' },
        { id: 'volume', es: 'Volumen', en: 'Volume' },
    ];

    return (
        <div ref={rootRef} className="product-stats-shell">
            <div className="product-stats-segments" role="tablist" aria-label={lang === 'es' ? 'Secciones de estadísticas' : 'Stats sections'}>
                <div className="product-stats-segments-inner">
                    {items.map(item => (
                        <button
                            key={item.id}
                            type="button"
                            role="tab"
                            aria-selected={section === item.id}
                            data-active={section === item.id}
                            className="product-stats-segment"
                            onClick={() => goTo(item.id)}
                        >
                            {lang === 'es' ? item.es : item.en}
                        </button>
                    ))}
                </div>
            </div>

            {safeLogs.length > 0 && (
                <div className="mx-4 mb-2 rounded-[1.35rem] border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.65)] p-4">
                    <div className="mb-3 flex items-center gap-2">
                        <Icon name="Activity" size={14} className="text-primary-500" />
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{lang === 'es' ? 'Consistencia' : 'Consistency'}</div>
                            <div className="text-[10px] text-zinc-500">{lang === 'es' ? 'Últimos 4 meses' : 'Last 4 months'}</div>
                        </div>
                    </div>
                    <ActivityHeatmap logs={safeLogs} />
                </div>
            )}

            <StatsViewImpl />
        </div>
    );
};
