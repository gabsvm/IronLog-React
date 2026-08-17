import React, { useMemo, useRef, useState } from 'react';
import { StatsView as StatsViewImpl } from './StatsViewImpl';
import { useApp, useAppPreferences } from '../context/AppContext';
import { ActivityHeatmap } from '../components/stats/ActivityHeatmap';
import { StatsDashboardWidgets } from '../components/stats/StatsDashboardWidgets';
import { BodyProgressCard } from '../components/stats/BodyProgressCard';
import { Icon } from '../components/ui/Icon';
import { useStore } from '../lib/store';
import { TRANSLATIONS } from '../constants';
import './product-polish.css';

type StatsSection = 'overview' | 'progress' | 'volume';

export const StatsView: React.FC = () => {
    const { lang } = useAppPreferences();
    const { logs } = useApp();
    const activeMeso = useStore(state => state.activeMeso);
    const rootRef = useRef<HTMLDivElement>(null);
    const [section, setSection] = useState<StatsSection>('overview');
    const safeLogs = Array.isArray(logs) ? logs : [];
    const t = TRANSLATIONS[lang];

    const publicPlanLabel = useMemo(() => {
        if (!activeMeso?.mesoType) return null;
        const raw = String(activeMeso.mesoType);
        if (/^(tpl_|personal_)/i.test(raw)) return lang === 'es' ? 'PERSONALIZADO' : 'CUSTOM';
        const translated = (t.phases as any)?.[raw];
        if (typeof translated === 'string' && translated.trim()) return translated;
        return raw.replace(/[_-]+/g, ' ').trim().toUpperCase();
    }, [activeMeso?.mesoType, lang, t.phases]);

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
        { id: 'progress', es: 'Ejercicios', en: 'Exercises' },
        { id: 'volume', es: 'Volumen', en: 'Volume' },
    ];

    return (
        <div ref={rootRef} className="product-stats-shell">
            <div className="product-stats-segments" role="tablist" aria-label={lang === 'es' ? 'Secciones de progreso' : 'Progress sections'}>
                <div className="product-stats-segments-inner">
                    {items.map(item => (
                        <button key={item.id} type="button" role="tab" aria-selected={section === item.id} data-active={section === item.id} className="product-stats-segment" onClick={() => goTo(item.id)}>
                            {lang === 'es' ? item.es : item.en}
                        </button>
                    ))}
                </div>
            </div>

            <section className="space-y-4 px-4 pb-3 pt-2">
                <div className="flex items-end justify-between gap-3 px-1">
                    <div className="min-w-0">
                        <h2 className="text-[1.7rem] font-black tracking-[-0.05em] text-[rgb(var(--text-primary))]">{lang === 'es' ? 'Progreso' : 'Progress'}</h2>
                        <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.11em] text-[rgb(var(--text-muted))]">
                            {activeMeso ? `${lang === 'es' ? 'Plan actual' : 'Current plan'} · ${t.week} ${activeMeso.week}` : (lang === 'es' ? 'Historial global' : 'All-time history')}
                        </p>
                    </div>
                    {publicPlanLabel && <span className="max-w-[46%] shrink-0 truncate rounded-lg border border-primary-500/15 bg-primary-500/10 px-2.5 py-1 text-[9px] font-black text-primary-500">{publicPlanLabel}</span>}
                </div>

                <StatsDashboardWidgets logs={safeLogs} activeMesoId={activeMeso?.id ?? null} lang={lang} />
            </section>

            {safeLogs.length > 0 && (
                <div className="mx-4 mb-3 rounded-2xl border border-[rgb(var(--border-subtle)/0.7)] bg-[rgb(var(--surface-raised)/0.58)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <Icon name="Activity" size={14} className="text-primary-500" />
                            <div><div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Consistencia' : 'Consistency'}</div><div className="text-[10px] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Últimos 4 meses' : 'Last 4 months'}</div></div>
                        </div>
                    </div>
                    <ActivityHeatmap logs={safeLogs} />
                </div>
            )}

            <BodyProgressCard />

            <div className="product-stats-impl"><StatsViewImpl /></div>
        </div>
    );
};
