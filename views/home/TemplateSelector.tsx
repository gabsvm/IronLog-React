import React, { Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { GlobalTemplate } from '../../types';
import { getTranslated } from '../../utils';
import { useApp } from '../../context/AppContext';

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

type LibraryTab = 'programs' | 'routines' | 'mine';
type DayFilter = 'all' | '2-3' | '4' | '5+';
type FolderFilter = 'all' | 'unfiled' | string;

const getTemplateAuthor = (tpl: GlobalTemplate, lang: string): string => {
    if (tpl.scope === 'personal') return lang === 'es' ? 'Yo' : 'Me';
    const id = tpl.id;
    if (id.startsWith('nh_') || id === 'toji_fushiguro' || id === 'tokita') return 'Natural Hypertrophy';
    if (id === 'ji3') return 'Paul Carter';
    if (id === 'full_body') return 'Dr. Mike Israetel (RP)';
    if (id.startsWith('cal_')) return lang === 'es' ? 'Calistenia' : 'Calisthenics';
    return 'GainsLab';
};

const matchesDayFilter = (days: number, filter: DayFilter) => {
    if (filter === 'all') return true;
    if (filter === '2-3') return days >= 2 && days <= 3;
    if (filter === '4') return days === 4;
    return days >= 5;
};

const getFolder = (tpl: GlobalTemplate) => String((tpl as any).folder || '').trim();

export const TemplateSelector: React.FC<Props> = ({
    onClose,
    onSelectTemplate,
    onCreateCustom,
    templates,
    t,
    lang,
    onSelectProgram,
}) => {
    const { setPersonalTemplates } = useApp();
    const [showKongDetail, setShowKongDetail] = useState(false);
    const [tab, setTab] = useState<LibraryTab>('programs');
    const [search, setSearch] = useState('');
    const [dayFilter, setDayFilter] = useState<DayFilter>('all');
    const [authorFilter, setAuthorFilter] = useState('all');
    const [folderFilter, setFolderFilter] = useState<FolderFilter>('all');

    const globalTemplates = useMemo(() => templates.filter(tpl => tpl.scope !== 'personal'), [templates]);
    const personalTemplates = useMemo(() => templates.filter(tpl => tpl.scope === 'personal'), [templates]);
    const authors = useMemo(() => Array.from(new Set(globalTemplates.map(tpl => getTemplateAuthor(tpl, lang)))).sort(), [globalTemplates, lang]);
    const folders = useMemo(() => Array.from(new Set(personalTemplates.map(getFolder).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [personalTemplates]);

    const filteredTemplates = useMemo(() => {
        const source = tab === 'mine' ? personalTemplates : globalTemplates;
        const q = search.trim().toLowerCase();
        return source.filter(tpl => {
            const author = getTemplateAuthor(tpl, lang);
            const folder = getFolder(tpl);
            if (authorFilter !== 'all' && tab !== 'mine' && author !== authorFilter) return false;
            if (tab === 'mine' && folderFilter === 'unfiled' && folder) return false;
            if (tab === 'mine' && folderFilter !== 'all' && folderFilter !== 'unfiled' && folder !== folderFilter) return false;
            if (!matchesDayFilter(tpl.program.length, dayFilter)) return false;
            if (!q) return true;
            const title = String(getTranslated(tpl.title, lang as any) || '').toLowerCase();
            const description = String(getTranslated(tpl.description, lang as any) || '').toLowerCase();
            return title.includes(q) || description.includes(q) || author.toLowerCase().includes(q) || folder.toLowerCase().includes(q);
        });
    }, [authorFilter, dayFilter, folderFilter, globalTemplates, lang, personalTemplates, search, tab]);

    const tabs: Array<{ id: LibraryTab; label: string; count?: number }> = [
        { id: 'programs', label: lang === 'es' ? 'Programas' : 'Programs', count: 1 },
        { id: 'routines', label: lang === 'es' ? 'Rutinas' : 'Routines', count: globalTemplates.length },
        { id: 'mine', label: lang === 'es' ? 'Mías' : 'Mine', count: personalTemplates.length },
    ];

    const selectTab = (next: LibraryTab) => {
        setTab(next);
        setAuthorFilter('all');
        setDayFilter('all');
        setFolderFilter('all');
        setSearch('');
    };

    const assignFolder = (templateId: string, folder: string) => {
        const normalized = folder.trim();
        setPersonalTemplates(prev => prev.map(tpl => tpl.id === templateId ? ({ ...tpl, folder: normalized || undefined } as any) : tpl));
        if (folderFilter !== 'all' && folderFilter !== 'unfiled' && normalized !== folderFilter) setFolderFilter('all');
    };

    const handleFolderSelection = (templateId: string, value: string) => {
        if (value !== '__new__') {
            assignFolder(templateId, value);
            return;
        }
        const created = window.prompt(lang === 'es' ? 'Nombre de la nueva carpeta' : 'New folder name');
        if (created?.trim()) assignFolder(templateId, created);
    };

    const selector = (
        <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]" role="dialog" aria-modal="true" aria-label={t.startMeso}>
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
                <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-500">{lang === 'es' ? 'Biblioteca' : 'Library'}</p>
                        <h2 className="truncate text-xl font-black tracking-tight">{lang === 'es' ? 'Entrenamiento' : 'Training'}</h2>
                    </div>
                    <button type="button" onClick={onClose} aria-label={lang === 'es' ? 'Cerrar' : 'Close'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] active:scale-95">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="mx-auto grid w-full max-w-xl grid-cols-3 gap-1 rounded-xl bg-[rgb(var(--surface-raised))] p-1">
                    {tabs.map(item => (
                        <button key={item.id} type="button" onClick={() => selectTab(item.id)} className={`min-h-10 rounded-lg px-2 text-xs font-bold transition-colors ${tab === item.id ? 'bg-primary-500 text-black' : 'text-[rgb(var(--text-muted))]'}`}>
                            {item.label}{typeof item.count === 'number' ? ` · ${item.count}` : ''}
                        </button>
                    ))}
                </div>
                <div className="h-3" />
            </header>

            <div className="flex-1 overflow-y-auto scroll-container">
                <div className="mx-auto w-full max-w-xl space-y-4 p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
                    {tab === 'programs' ? (
                        <>
                            <div className="rounded-2xl border border-primary-500/24 bg-primary-500/[0.055] p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-500">{lang === 'es' ? 'Programa estructurado' : 'Structured program'}</div>
                                        <h3 className="mt-1 text-2xl font-black tracking-tight">KONG</h3>
                                        <p className="mt-1 text-sm font-bold text-[rgb(var(--text-secondary))]">Savage Size · Alexander Bromley</p>
                                    </div>
                                    <span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[9px] font-black text-primary-500">12W · 4D</span>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{lang === 'es' ? '12 semanas, 3 bloques y progresión prescrita. GainsLab mantiene la estructura oficial durante toda la ejecución.' : '12 weeks, 3 blocks and prescribed progression. GainsLab preserves the official structure throughout the run.'}</p>
                                <button type="button" onClick={() => setShowKongDetail(true)} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-sm font-black text-black active:scale-[0.99]">{lang === 'es' ? 'Ver programa' : 'View program'} <Icon name="ChevronRight" size={17} /></button>
                            </div>
                            <div className="rounded-2xl border border-dashed border-[rgb(var(--border-strong))] p-5 text-center text-sm text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Los próximos sistemas estructurados aparecerán aquí. Las rutinas sueltas viven en la pestaña Rutinas.' : 'Future structured systems will appear here. Standalone routines live under Routines.'}</div>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
                                <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'mine' ? (lang === 'es' ? 'Buscar mis rutinas…' : 'Search my routines…') : (lang === 'es' ? 'Buscar rutina o autor…' : 'Search routine or author…')} className="h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] pl-10 pr-4 text-sm font-semibold outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10" />
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 scroll-container">
                                {(['all', '2-3', '4', '5+'] as DayFilter[]).map(filter => (
                                    <button key={filter} type="button" onClick={() => setDayFilter(filter)} className={`min-h-9 shrink-0 rounded-lg border px-3 text-[11px] font-bold ${dayFilter === filter ? 'border-primary-500/30 bg-primary-500/10 text-primary-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>
                                        {filter === 'all' ? (lang === 'es' ? 'Todos los días' : 'All days') : filter === '2-3' ? '2–3 días' : filter === '4' ? '4 días' : '5+ días'}
                                    </button>
                                ))}
                            </div>

                            {tab === 'routines' && authors.length > 1 && (
                                <label className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.7)] px-3 py-2.5">
                                    <Icon name="User" size={15} className="text-[rgb(var(--text-muted))]" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Autor' : 'Author'}</span>
                                    <select value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold text-[rgb(var(--text-primary))] outline-none"><option value="all">{lang === 'es' ? 'Todos' : 'All'}</option>{authors.map(author => <option key={author} value={author}>{author}</option>)}</select>
                                </label>
                            )}

                            {tab === 'mine' && (
                                <>
                                    <button type="button" onClick={onCreateCustom} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-raised)/0.55)] p-4 text-left active:scale-[0.99]">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="Plus" size={19} /></span>
                                        <span className="min-w-0 flex-1"><span className="block text-sm font-black">{lang === 'es' ? 'Crear rutina' : 'Create routine'}</span><span className="mt-0.5 block text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Días, ejercicios y series desde cero.' : 'Build days, exercises and sets from scratch.'}</span></span>
                                        <Icon name="ChevronRight" size={17} className="text-[rgb(var(--text-muted))]" />
                                    </button>

                                    {personalTemplates.length > 0 && (
                                        <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-container">
                                            <button type="button" onClick={() => setFolderFilter('all')} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${folderFilter === 'all' ? 'bg-primary-500/10 text-primary-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{lang === 'es' ? 'Todas' : 'All'}</button>
                                            <button type="button" onClick={() => setFolderFilter('unfiled')} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${folderFilter === 'unfiled' ? 'bg-primary-500/10 text-primary-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{lang === 'es' ? 'Sin carpeta' : 'Unfiled'}</button>
                                            {folders.map(folder => <button key={folder} type="button" onClick={() => setFolderFilter(folder)} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${folderFilter === folder ? 'bg-primary-500/10 text-primary-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{folder}</button>)}
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="space-y-2">
                                {filteredTemplates.map(tpl => {
                                    const author = getTemplateAuthor(tpl, lang);
                                    const folder = getFolder(tpl);
                                    const content = (
                                        <>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1"><h4 className="truncate text-base font-black tracking-tight">{getTranslated(tpl.title, lang as any)}</h4><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-[rgb(var(--text-muted))]"><span>{tpl.program.length} {lang === 'es' ? 'días' : 'days'}</span>{tab !== 'mine' && <><span>·</span><span>{author}</span></>}{tab === 'mine' && folder && <><span>·</span><span>{folder}</span></>}</div></div>
                                                {tpl.isPro && <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-500">PRO</span>}
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">{getTranslated(tpl.description, lang as any)}</p>
                                        </>
                                    );

                                    if (tab !== 'mine') return <button key={tpl.id} type="button" onClick={() => onSelectTemplate(tpl)} className="w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.72)] p-4 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]">{content}</button>;

                                    return (
                                        <div key={tpl.id} className="overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.72)]">
                                            <button type="button" onClick={() => onSelectTemplate(tpl)} className="w-full p-4 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]">{content}</button>
                                            <div className="flex items-center gap-2 border-t border-[rgb(var(--border-subtle)/0.65)] bg-[rgb(var(--surface-base)/0.45)] px-3 py-2">
                                                <Icon name="Layers" size={13} className="text-[rgb(var(--text-muted))]" />
                                                <span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Carpeta' : 'Folder'}</span>
                                                <select value={folder} onChange={e => handleFolderSelection(tpl.id, e.target.value)} className="min-w-0 flex-1 bg-transparent text-right text-xs font-bold text-[rgb(var(--text-secondary))] outline-none">
                                                    <option value="">{lang === 'es' ? 'Sin carpeta' : 'Unfiled'}</option>
                                                    {folders.map(item => <option key={item} value={item}>{item}</option>)}
                                                    <option value="__new__">+ {lang === 'es' ? 'Nueva carpeta…' : 'New folder…'}</option>
                                                </select>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredTemplates.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-6 py-10 text-center"><Icon name="Search" size={22} className="mx-auto text-[rgb(var(--text-muted))]" /><p className="mt-3 text-sm font-black">{lang === 'es' ? 'Sin resultados' : 'No matches'}</p><p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Prueba otro nombre, carpeta, autor o cantidad de días.' : 'Try another name, folder, author or day count.'}</p></div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showKongDetail && (
                <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]" />}>
                    <ProgramDetailView lang={lang as 'en' | 'es'} onBack={() => setShowKongDetail(false)} onStart={() => { setShowKongDetail(false); onSelectProgram?.('kong_4day'); }} />
                </Suspense>
            )}
        </div>
    );

    if (typeof document === 'undefined') return selector;
    return createPortal(selector, document.body);
};
