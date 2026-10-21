import React, { Suspense } from 'react';
import type { DiarySection } from '../components/layout/navigation';
import { TRANSLATIONS } from '../constants';
import { useAppPreferences } from '../context/AppContext';
import { Icon } from '../components/ui/Icon';
const HistoryView = React.lazy(() => import('./HistoryView').then((m) => ({ default: m.HistoryView })));
const NutriView = React.lazy(() => import('./NutriView').then((m) => ({ default: m.NutriView })));

interface DiaryViewProps {
    section: DiarySection;
    onSectionChange: (section: DiarySection) => void;
}

/**
 * Fase 2 shell: two-root container. Sessions reuses HistoryView (virtualized,
 * needs the h-full chain + a non-scrolling parent) and Nutrition reuses
 * NutriView (normal page flow). No data logic is duplicated here.
 */
export const DiaryView: React.FC<DiaryViewProps> = ({ section, onSectionChange }) => {
    const { lang } = useAppPreferences();
    const t = TRANSLATIONS[lang];
    const tabs: Array<{ id: DiarySection; label: string; icon: string }> = [
        { id: 'sessions', label: t.navDiarySessions, icon: 'Dumbbell' },
        { id: 'nutrition', label: t.navDiaryNutrition, icon: 'Utensils' },
    ];
    return (
        <div className="flex h-full min-h-full flex-col">
            <div className="px-4 pt-3">
                <div
                    role="tablist"
                    aria-label={t.navDiary}
                    className="seg-reference grid-cols-2"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            role="tab"
                            aria-selected={section === tab.id}
                            type="button"
                            onClick={() => onSectionChange(tab.id)}
                            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] text-xs font-bold transition-colors ${section === tab.id ? 'bg-primary-500 text-zinc-950' : 'text-muted hover:text-[rgb(var(--text-primary))]'}`}
                        >
                            <Icon name={tab.icon as any} size={15} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
                <Suspense fallback={null}>
                    {section === 'sessions' ? <HistoryView /> : <NutriView />}
                </Suspense>
            </div>
        </div>
    );
};

