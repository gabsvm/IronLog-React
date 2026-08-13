import React, { useRef, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useAppPreferences } from '../context/AppContext';
import './product-polish.css';

type StatsSection = 'overview' | 'progress' | 'volume';

/**
 * Segmented navigation over the existing Stats implementation.
 * We keep every chart/calculation intact and add a native-style information layer
 * that jumps between the three mental models users actually care about.
 */
export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const rootRef = useRef<HTMLDivElement>(null);
    const [section, setSection] = useState<StatsSection>('overview');

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
            <StatsViewImpl />
        </div>
    );
};
