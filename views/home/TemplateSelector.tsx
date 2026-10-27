import React, { Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { GlobalTemplate } from '../../types';
import { getTranslated } from '../../utils';
import { PersonalTemplatesSection } from './PersonalTemplatesSection';

const ProgramDetailView = React.lazy(() =>
    import('../../components/programs/ProgramDetailView').then((module) => ({ default: module.ProgramDetailView }))
);

interface Props {
    onClose: () => void;
    onSelectTemplate: (tpl: GlobalTemplate) => void;
    onCreateCustom: () => void;
    templates: GlobalTemplate[];
    t: any;
    lang: string;
    onSelectProgram?: (programId: string) => void;
}

const getTemplateAuthor = (tpl: GlobalTemplate, ts: any): string => {
    if (tpl.scope === 'personal') return ts.myTemplates;
    const id = tpl.id;
    if (id.startsWith('nh_') || id === 'toji_fushiguro' || id === 'tokita') return 'Natural Hypertrophy';
    if (id === 'ji3') return 'Paul Carter';
    if (id === 'full_body') return 'Dr. Mike Israetel (RP)';
    if (id.startsWith('cal_')) return ts.calisthenics;
    return ts.baseSpecials;
};

export const TemplateSelector: React.FC<Props> = ({
    onClose,
    onSelectTemplate,
    onCreateCustom,
    templates,
    t,
    lang,
    onSelectProgram,
}) => {
    const [showKongDetail, setShowKongDetail] = useState(false);
    const ts = t.templateSelector;
    const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({
        'Natural Hypertrophy': true,
    });
    const [query, setQuery] = useState('');
    const [authorFilter, setAuthorFilter] = useState<string | null>(null);
    const [daysFilter, setDaysFilter] = useState<number | null>(null);

    // Personal templates live in the folders section below; the catalog lists
    // built-in templates only so personal routines are never duplicated.
    const catalog = useMemo(() => templates.filter((tpl) => tpl.scope !== 'personal'), [templates]);
    // Filter options are derived from the available templates, never hardcoded.
    const availableAuthors = useMemo(() => {
        const authors: string[] = [];
        catalog.forEach((tpl) => {
            const author = getTemplateAuthor(tpl, ts);
            if (!authors.includes(author)) authors.push(author);
        });
        return authors.sort((a, b) => a.localeCompare(b));
    }, [catalog, ts]);
    const availableDayCounts = useMemo(() => {
        const counts: number[] = [];
        catalog.forEach((tpl) => {
            if (!counts.includes(tpl.program.length)) counts.push(tpl.program.length);
        });
        return counts.sort((a, b) => a - b);
    }, [catalog]);

    const visibleTemplates = useMemo(() => {
        const q = query.trim().toLowerCase();
        return catalog.filter((tpl) => {
            if (authorFilter && getTemplateAuthor(tpl, ts) !== authorFilter) return false;
            if (daysFilter !== null && tpl.program.length !== daysFilter) return false;
            if (!q) return true;
            const hay = `${getTranslated(tpl.title, lang as 'en' | 'es')} ${getTranslated(tpl.description, lang as 'en' | 'es')}`.toLowerCase();
            return hay.includes(q);
        });
    }, [catalog, ts, authorFilter, daysFilter, query, lang]);
    const grouped = useMemo(() => {
        const groups: Record<string, GlobalTemplate[]> = {};
        visibleTemplates.forEach((tpl) => {
            const author = getTemplateAuthor(tpl, ts);
            if (!groups[author]) groups[author] = [];
            groups[author].push(tpl);
        });
        return groups;
    }, [visibleTemplates, ts]);

    const selector = (
        <div
            className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))] pointer-events-auto"
            role="dialog"
            aria-modal="true"
            aria-label={t.startMeso}
        >
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
                <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-4">
                    <h2 className="text-2xl font-semibold">{t.startMeso}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={ts.close || t.close || 'Close'}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] active:scale-95"
                    >
                        <Icon name="X" size={21} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto scroll-container">
                <div className="mx-auto w-full max-w-xl space-y-5 p-4 pb-[calc(var(--safe-area-bottom)+2rem)]">
                    <section>
                        <button
                            type="button"
                            onClick={() => setShowKongDetail(true)}
                            className="gl-panel w-full !border-primary-500/30 p-5 text-left transition-transform active:scale-[0.99]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-2xl font-black">KONG</p>
                                    <p className="mt-1 text-sm font-bold text-primary-500">SAVAGE SIZE · Alexander Bromley</p>
                                </div>
                                <Icon name="ChevronRight" size={20} className="mt-1 shrink-0 text-primary-500" />
                            </div>
                            <p className="mt-4 text-xs font-medium text-[rgb(var(--text-secondary))]">
                                12 {ts.weeks} · 4 {ts.days} · 3 {ts.blocks}
                            </p>
                        </button>
                    </section>

                    <button
                        type="button"
                        onClick={onCreateCustom}
                        className="gl-panel flex min-h-[48px] w-full items-center gap-4 p-5 text-left"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--surface-base))] text-primary-500">
                            <Icon name="Edit" size={21} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold">{ts.designTitle}</h3>
                        </div>
                        <Icon name="ChevronRight" size={19} className="shrink-0 text-[rgb(var(--text-muted))]" />
                    </button>

                    <div className="relative">
                        <Icon name="Search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={ts.searchPh}
                            aria-label={ts.searchPh}
                            className="min-h-[48px] w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] py-3 pl-11 pr-4 text-base text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]"
                        />
                    </div>

                    <PersonalTemplatesSection query={query} lang={lang} t={t} onSelectTemplate={onSelectTemplate} />

                    {(availableAuthors.length > 1 || availableDayCounts.length > 1) && (
                        <div className="flex gap-1.5 overflow-x-auto scroll-container px-1 py-0.5" role="group" aria-label={ts.filterBy}>
                            <button
                                type="button"
                                aria-pressed={authorFilter === null && daysFilter === null}
                                onClick={() => { setAuthorFilter(null); setDaysFilter(null); }}
                                className={`min-h-[44px] shrink-0 rounded-xl border px-3.5 text-xs font-medium ${authorFilter === null && daysFilter === null ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]'}`}
                            >
                                {ts.filterAll}
                            </button>
                            {availableAuthors.length > 1 && availableAuthors.map((author) => (
                                <button
                                    key={author}
                                    type="button"
                                    aria-pressed={authorFilter === author}
                                    onClick={() => setAuthorFilter((prev) => (prev === author ? null : author))}
                                    className={`min-h-[44px] max-w-44 shrink-0 truncate rounded-xl border px-3.5 text-xs font-medium ${authorFilter === author ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]'}`}
                                >
                                    {author}
                                </button>
                            ))}
                            {availableDayCounts.length > 1 && availableDayCounts.map((days) => (
                                <button
                                    key={days}
                                    type="button"
                                    aria-pressed={daysFilter === days}
                                    onClick={() => setDaysFilter((prev) => (prev === days ? null : days))}
                                    className={`min-h-[44px] shrink-0 rounded-xl border px-3.5 text-xs font-medium ${daysFilter === days ? 'border-primary-500 bg-primary-500/10 text-[rgb(var(--text-primary))]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))]'}`}
                                >
                                    {days} {ts.daysLower}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        {Object.entries(grouped).map(([author, groupTemplates]) => {
                            const isExpanded = !!expandedAuthors[author];
                            return (
                                <section key={author} className="overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedAuthors((prev) => ({ ...prev, [author]: !prev[author] }))}
                                        aria-expanded={isExpanded}
                                        className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                                                <Icon name="User" size={17} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-semibold">{author}</h3>
                                                <p className="mt-0.5 text-xs text-[rgb(var(--text-secondary))]">
                                                    {groupTemplates.length} {groupTemplates.length === 1 ? ts.programOne : ts.programMany}
                                                </p>
                                            </div>
                                        </div>
                                        <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} size={18} className="shrink-0 text-[rgb(var(--text-muted))]" />
                                    </button>

                                    {isExpanded && (
                                        <div className="grid gap-3 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-base)/0.55)] p-3">
                                            {groupTemplates.map((tpl) => (
                                                <button
                                                    key={tpl.id}
                                                    type="button"
                                                    onClick={() => onSelectTemplate(tpl)}
                                                    className="relative w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-4 text-left transition-transform active:scale-[0.99]"
                                                >
                                                    <h4 className="pr-12 text-base font-semibold">{getTranslated(tpl.title, lang as 'en' | 'es')}</h4>
                                                    <p className="mt-1 pr-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                                        {getTranslated(tpl.description, lang as 'en' | 'es')}
                                                    </p>
                                                    <div className="mt-3 flex gap-2">
                                                        <span className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1 text-xs font-medium text-[rgb(var(--text-secondary))]">
                                                            {tpl.program.length} {ts.daysLower}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
                        {visibleTemplates.length === 0 && (
                            <p className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] p-6 text-center text-sm text-[rgb(var(--text-secondary))]">
                                {ts.noResults}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {showKongDetail && (
                <Suspense fallback={null}>
                    <ProgramDetailView
                        lang={lang as 'en' | 'es'}
                        onBack={() => setShowKongDetail(false)}
                        onStart={() => {
                            setShowKongDetail(false);
                            onSelectProgram?.('kong_4day');
                        }}
                    />
                </Suspense>
            )}
        </div>
    );

    if (typeof document === 'undefined') return selector;
    return createPortal(selector, document.body);
};
