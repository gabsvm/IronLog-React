import React, { Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { GlobalTemplate } from '../../types';
import { getTranslated } from '../../utils';

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

const getTemplateAuthor = (tpl: GlobalTemplate, lang: string): string => {
    if (tpl.scope === 'personal') return lang === 'es' ? 'Mis plantillas' : 'My templates';
    const id = tpl.id;
    if (id.startsWith('nh_') || id === 'toji_fushiguro' || id === 'tokita') return 'Natural Hypertrophy';
    if (id === 'ji3') return 'Paul Carter';
    if (id === 'full_body') return 'Dr. Mike Israetel (RP)';
    if (id.startsWith('cal_')) return lang === 'es' ? 'Calistenia / Peso Corporal' : 'Calisthenics / Bodyweight';
    return lang === 'es' ? 'Básicos & Especiales de la App' : 'Base & App Specials';
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
    const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({
        'Natural Hypertrophy': true,
    });

    const grouped = useMemo(() => {
        const groups: Record<string, GlobalTemplate[]> = {};
        templates.forEach((tpl) => {
            const author = getTemplateAuthor(tpl, lang);
            if (!groups[author]) groups[author] = [];
            groups[author].push(tpl);
        });
        return groups;
    }, [templates, lang]);

    const selector = (
        <div
            className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]"
            role="dialog"
            aria-modal="true"
            aria-label={t.startMeso}
        >
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
                <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">
                            {lang === 'es' ? 'PLAN DE ENTRENAMIENTO' : 'TRAINING PLAN'}
                        </p>
                        <h2 className="mt-0.5 text-2xl font-black">{t.startMeso}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] active:scale-95"
                    >
                        <Icon name="X" size={21} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto scroll-container">
                <div className="mx-auto w-full max-w-xl space-y-5 p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
                    <section className="rounded-3xl border border-primary-500/30 bg-primary-500/10 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500">
                                {lang === 'es' ? 'PROGRAMAS' : 'PROGRAMS'}
                            </p>
                            <span className="rounded-full bg-primary-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-primary-500">
                                {lang === 'es' ? 'SISTEMA COMPLETO' : 'FULL SYSTEM'}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowKongDetail(true)}
                            className="w-full rounded-2xl border border-primary-500/30 bg-[rgb(var(--surface-raised))] p-5 text-left transition-transform active:scale-[0.99]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-2xl font-black">KONG</p>
                                    <p className="mt-1 text-sm font-bold text-primary-500">SAVAGE SIZE · Alexander Bromley</p>
                                </div>
                                <Icon name="ChevronRight" size={20} className="mt-1 shrink-0 text-primary-500" />
                            </div>
                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-[rgb(var(--text-muted))]">
                                12 {lang === 'es' ? 'SEMANAS' : 'WEEKS'} · 4 {lang === 'es' ? 'DÍAS' : 'DAYS'} · 3 {lang === 'es' ? 'BLOQUES' : 'BLOCKS'}
                            </p>
                            <span className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary-500 px-4 text-xs font-black text-black">
                                {lang === 'es' ? 'VER PROGRAMA' : 'VIEW PROGRAM'}
                            </span>
                        </button>
                    </section>

                    <div className="flex items-center gap-4 px-1">
                        <div className="h-px flex-1 bg-[rgb(var(--border-subtle))]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">
                            {lang === 'es' ? 'PLANTILLAS' : 'TEMPLATES'}
                        </span>
                        <div className="h-px flex-1 bg-[rgb(var(--border-subtle))]" />
                    </div>

                    <button
                        type="button"
                        onClick={onCreateCustom}
                        className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-raised))] p-5 text-left transition-transform active:scale-[0.99]"
                    >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--surface-base))] text-primary-500">
                            <Icon name="Edit" size={21} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-black">{lang === 'en' ? 'Design from Scratch' : 'Crear desde Cero'}</h3>
                            <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                                {lang === 'en' ? 'Empty canvas. You choose the exercises.' : 'Lienzo vacío. Tú eliges los ejercicios.'}
                            </p>
                        </div>
                        <Icon name="ChevronRight" size={19} className="shrink-0 text-[rgb(var(--text-muted))]" />
                    </button>

                    <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-[rgb(var(--text-muted))]">
                        {lang === 'en' ? 'CHOOSE BY AUTHOR' : 'ELIGE POR AUTOR'}
                    </p>

                    <div className="space-y-3">
                        {Object.entries(grouped).map(([author, groupTemplates]) => {
                            const isExpanded = !!expandedAuthors[author];
                            return (
                                <section key={author} className="overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))]">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedAuthors((prev) => ({ ...prev, [author]: !prev[author] }))}
                                        className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                                                <Icon name="User" size={17} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate text-sm font-black">{author}</h3>
                                                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
                                                    {groupTemplates.length} {groupTemplates.length === 1 ? (lang === 'en' ? 'Program' : 'Programa') : (lang === 'en' ? 'Programs' : 'Programas')}
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
                                                    {tpl.isPro && (
                                                        <div className="absolute right-3 top-3 rounded border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-yellow-500">
                                                            PRO
                                                        </div>
                                                    )}
                                                    <h4 className="pr-12 text-base font-black">{getTranslated(tpl.title, lang as any)}</h4>
                                                    <p className="mt-1 pr-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">
                                                        {getTranslated(tpl.description, lang as any)}
                                                    </p>
                                                    <div className="mt-3 flex gap-2">
                                                        <span className="rounded bg-[rgb(var(--surface-base))] px-2 py-1 text-[10px] font-bold text-[rgb(var(--text-muted))]">
                                                            {tpl.program.length} {lang === 'en' ? 'Days' : 'Días'}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            );
                        })}
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
