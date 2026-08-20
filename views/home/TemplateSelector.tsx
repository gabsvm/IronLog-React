import React, { Suspense, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { GlobalTemplate } from '../../types';
import { getTranslated } from '../../utils';
import { useApp } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { PERFORMANCE_UPPER_LOWER_V1 } from '../../programs/performance/performanceUpperLower';
import { GUTS_BLACK_SWORDSMAN_V1 } from '../../programs/naturalHypertrophy/gutsBlackSwordsman';
import { GUTS_EXERCISES } from '../../data/gutsExercises';
import { resolveProgramWeek } from '../../programs/engine/ProgramResolver';
import { startProgramRun } from '../../programs/engine/ProgramRunHelpers';

const ProgramDetailView = React.lazy(() =>
    import('../../components/programs/ProgramDetailView').then(module => ({ default: module.ProgramDetailView }))
);
const PerformanceProgramDetailView = React.lazy(() =>
    import('../../components/programs/PerformanceProgramDetailView').then(module => ({ default: module.PerformanceProgramDetailView }))
);
const GutsProgramDetailView = React.lazy(() =>
    import('../../components/programs/GutsProgramDetailView').then(module => ({ default: module.GutsProgramDetailView }))
);
const NhProgrammingSchoolView = React.lazy(() =>
    import('../../components/programs/NhProgrammingSchoolView').then(module => ({ default: module.NhProgrammingSchoolView }))
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
    const { setPersonalTemplates, setProgram, setExercises, userProfile } = useApp();
    const setActiveMeso = useStore(state => state.setActiveMeso);
    const [showKongDetail, setShowKongDetail] = useState(false);
    const [showPerformanceDetail, setShowPerformanceDetail] = useState(false);
    const [showGutsDetail, setShowGutsDetail] = useState(false);
    const [showProgrammingSchool, setShowProgrammingSchool] = useState(false);
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
        { id: 'programs', label: lang === 'es' ? 'Programas' : 'Programs', count: 3 },
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

    const handleSchoolSave = (template: GlobalTemplate, openEditor: boolean) => {
        setPersonalTemplates(prev => {
            const withoutDuplicate = prev.filter(item => item.id !== template.id);
            return [template, ...withoutDuplicate];
        });
        if (openEditor) {
            // HomeViewImpl's custom path clears the current program before opening
            // the editor. Calling setProgram afterwards deliberately makes the
            // teaching draft the final batched value while reusing that navigation.
            onCreateCustom();
            setProgram(template.program);
            return;
        }
        setShowProgrammingSchool(false);
        selectTab('mine');
    };

    const startStructuredProgram = (definition: typeof PERFORMANCE_UPPER_LOWER_V1 | typeof GUTS_BLACK_SWORDSMAN_V1, displayName: string) => {
        const firstWeek = resolveProgramWeek(definition, 1);
        setProgram(firstWeek);
        const plan = firstWeek.map(day => (day.slots || []).map(slot => slot.exerciseId || null));
        setActiveMeso({
            id: Date.now(),
            name: displayName,
            mesoType: definition.id,
            week: 1,
            targetWeeks: definition.durationWeeks,
            isDeload: false,
            plan,
            duration: definition.durationWeeks,
            programSystem: startProgramRun(definition, userProfile?.bodyWeight),
        });
        onClose();
    };

    const startPerformance = () => {
        setShowPerformanceDetail(false);
        startStructuredProgram(PERFORMANCE_UPPER_LOWER_V1, 'GainsLab PERFORMANCE');
    };

    const startGuts = () => {
        setExercises(prev => {
            const base = Array.isArray(prev) ? prev : [];
            const byId = new Map(base.map(exercise => [exercise.id, exercise]));
            GUTS_EXERCISES.forEach(exercise => { if (!byId.has(exercise.id)) byId.set(exercise.id, exercise); });
            return Array.from(byId.values());
        });
        setShowGutsDetail(false);
        startStructuredProgram(GUTS_BLACK_SWORDSMAN_V1, 'GUTS · Black Swordsman');
    };

    const ProgramCard = ({ eyebrow, title, subtitle, badge, description, tags = [], primary = false, onClick }: {
        eyebrow: string; title: string; subtitle: string; badge: string; description: string; tags?: string[]; primary?: boolean; onClick: () => void;
    }) => (
        <div className={`rounded-2xl border p-4 ${primary ? 'border-primary-500/30 bg-gradient-to-br from-primary-500/[0.10] to-[rgb(var(--surface-raised))]' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.72)]'}`}>
            <div className="flex items-start justify-between gap-4">
                <div><div className={`text-[9px] font-bold uppercase tracking-[0.14em] ${primary ? 'text-primary-500' : 'text-[rgb(var(--text-muted))]'}`}>{eyebrow}</div><h3 className="mt-1 text-2xl font-black tracking-tight">{title}</h3><p className="mt-1 text-sm font-bold text-[rgb(var(--text-secondary))]">{subtitle}</p></div>
                <span className="rounded-lg bg-primary-500/10 px-2 py-1 text-[9px] font-black text-primary-500">{badge}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{description}</p>
            {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-bold text-[rgb(var(--text-muted))]">{tags.map(tag => <span key={tag} className="rounded-lg bg-[rgb(var(--surface-base))] px-2 py-1">{tag}</span>)}</div>}
            <button type="button" onClick={onClick} className={`mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black active:scale-[0.99] ${primary ? 'bg-primary-500 text-black' : 'border border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-base))]'}`}>{lang === 'es' ? `Ver ${title}` : `View ${title}`} <Icon name="ChevronRight" size={17}/></button>
        </div>
    );

    const selector = (
        <div className="fixed inset-0 z-modal flex flex-col bg-[rgb(var(--surface-app))] text-[rgb(var(--text-primary))]" role="dialog" aria-modal="true" aria-label={t.startMeso}>
            <header className="shrink-0 border-b border-[rgb(var(--border-subtle)/0.75)] bg-[rgb(var(--surface-app)/0.98)] px-4 pt-safe">
                <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between gap-4">
                    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary-500">{lang === 'es' ? 'Biblioteca' : 'Library'}</p><h2 className="truncate text-xl font-black tracking-tight">{lang === 'es' ? 'Entrenamiento' : 'Training'}</h2></div>
                    <button type="button" onClick={onClose} aria-label={lang === 'es' ? 'Cerrar' : 'Close'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-secondary))] active:scale-95"><Icon name="X" size={20}/></button>
                </div>
                <div className="mx-auto grid w-full max-w-xl grid-cols-3 gap-1 rounded-xl bg-[rgb(var(--surface-raised))] p-1">{tabs.map(item => <button key={item.id} type="button" onClick={() => selectTab(item.id)} className={`min-h-10 rounded-lg px-2 text-xs font-bold transition-colors ${tab === item.id ? 'bg-primary-500 text-black' : 'text-[rgb(var(--text-muted))]'}`}>{item.label}{typeof item.count === 'number' ? ` · ${item.count}` : ''}</button>)}</div>
                <div className="h-3"/>
            </header>

            <div className="flex-1 overflow-y-auto scroll-container">
                <div className="mx-auto w-full max-w-xl space-y-4 p-4 pb-[calc(env(safe-area-inset-bottom)+2rem)]">
                    {tab === 'programs' ? (
                        <>
                            <button type="button" onClick={() => setShowProgrammingSchool(true)} className="w-full rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.10] to-[rgb(var(--surface-raised))] p-5 text-left active:scale-[0.99]">
                                <div className="flex items-start gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400"><Icon name="Brain" size={22}/></span>
                                    <span className="min-w-0 flex-1"><span className="block text-[9px] font-black uppercase tracking-[0.14em] text-violet-400">Natural Hypertrophy · {lang === 'es' ? 'Aprender a programar' : 'Learn programming'}</span><span className="mt-1 block text-xl font-black">Programming School</span><span className="mt-2 block text-xs leading-5 text-[rgb(var(--text-secondary))]">{lang === 'es' ? 'Entender → analizar → modificar → crear → aprender de tu logbook. No te entrega una caja negra: te enseña a tomar decisiones.' : 'Understand → analyze → modify → build → learn from your logbook. Not a black-box generator: it teaches you to make decisions.'}</span></span>
                                    <Icon name="ChevronRight" size={18} className="mt-1 shrink-0 text-[rgb(var(--text-muted))]"/>
                                </div>
                            </button>
                            <ProgramCard primary eyebrow={`GainsLab · ${lang === 'es' ? 'Hipertrofia sostenible' : 'Sustainable hypertrophy'}`} title="PERFORMANCE" subtitle="Upper / Lower · GainsLab" badge="8C · 4D" description={lang === 'es' ? 'Doble progresión, RPE 7–8.5 y ciclo rodante con Recovery Gate. Fatiga controlada como principio de diseño.' : 'Double progression, RPE 7–8.5 and a rolling cycle with Recovery Gate. Controlled fatigue by design.'} tags={['Recovery Gate', '1–3 RIR', lang === 'es' ? 'Volumen moderado' : 'Moderate volume']} onClick={() => setShowPerformanceDetail(true)}/>
                            <ProgramCard eyebrow="Natural Hypertrophy · Black Swordsman" title="GUTS" subtitle="4-day Gentleman Split · Natural Hypertrophy" badge="12W · 4D" description={lang === 'es' ? 'Torso dominante, brazos y espalda; compuestos pesados, superseries y rangos evolutivos. Implementado con la filosofía del 85% de Natural Hypertrophy.' : 'Upper-body dominant physique work: heavy compounds, supersets and evolving rep ranges, implemented with Natural Hypertrophy’s 85% philosophy.'} tags={['Evolving reps', '85% rule', 'Supersets']} onClick={() => setShowGutsDetail(true)}/>
                            <ProgramCard eyebrow={lang === 'es' ? 'Alta capacidad de trabajo' : 'High work capacity'} title="KONG" subtitle="Savage Size · Alexander Bromley" badge="12W · 4D" description={lang === 'es' ? '12 semanas, 3 bloques y progresión prescrita. GainsLab mantiene la estructura oficial durante toda la ejecución.' : '12 weeks, 3 blocks and prescribed progression. GainsLab preserves the official structure throughout the run.'} onClick={() => setShowKongDetail(true)}/>
                        </>
                    ) : (
                        <>
                            <div className="relative"><Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]"/><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'mine' ? (lang === 'es' ? 'Buscar mis rutinas…' : 'Search my routines…') : (lang === 'es' ? 'Buscar rutina o autor…' : 'Search routine or author…')} className="h-12 w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] pl-10 pr-4 text-sm font-semibold outline-none placeholder:text-[rgb(var(--text-muted))] focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/10"/></div>
                            <div className="flex gap-2 overflow-x-auto pb-1 scroll-container">{(['all','2-3','4','5+'] as DayFilter[]).map(filter => <button key={filter} type="button" onClick={() => setDayFilter(filter)} className={`min-h-9 shrink-0 rounded-lg border px-3 text-[11px] font-bold ${dayFilter === filter ? 'border-primary-500/30 bg-primary-500/10 text-primary-500' : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{filter === 'all' ? (lang === 'es' ? 'Todos los días' : 'All days') : filter === '2-3' ? '2–3 días' : filter === '4' ? '4 días' : '5+ días'}</button>)}</div>
                            {tab === 'routines' && authors.length > 1 && <label className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.7)] px-3 py-2.5"><Icon name="User" size={15} className="text-[rgb(var(--text-muted))]"/><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Autor' : 'Author'}</span><select value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold text-[rgb(var(--text-primary))] outline-none"><option value="all">{lang === 'es' ? 'Todos' : 'All'}</option>{authors.map(author => <option key={author} value={author}>{author}</option>)}</select></label>}
                            {tab === 'mine' && <><button type="button" onClick={onCreateCustom} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[rgb(var(--border-strong))] bg-[rgb(var(--surface-raised)/0.55)] p-4 text-left active:scale-[0.99]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500"><Icon name="Plus" size={19}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-black">{lang === 'es' ? 'Crear rutina' : 'Create routine'}</span><span className="mt-0.5 block text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Días, ejercicios y series desde cero.' : 'Build days, exercises and sets from scratch.'}</span></span><Icon name="ChevronRight" size={17} className="text-[rgb(var(--text-muted))]"/></button>{personalTemplates.length > 0 && <div className="flex gap-1.5 overflow-x-auto pb-1 scroll-container"><button type="button" onClick={() => setFolderFilter('all')} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${folderFilter === 'all' ? 'bg-primary-500/10 text-primary-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{lang === 'es' ? 'Todas' : 'All'}</button><button type="button" onClick={() => setFolderFilter('unfiled')} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${folderFilter === 'unfiled' ? 'bg-primary-500/10 text-primary-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{lang === 'es' ? 'Sin carpeta' : 'Unfiled'}</button>{folders.map(folder => <button key={folder} type="button" onClick={() => setFolderFilter(folder)} className={`min-h-9 shrink-0 rounded-lg px-3 text-[11px] font-bold ${folderFilter === folder ? 'bg-primary-500/10 text-primary-500' : 'bg-[rgb(var(--surface-raised))] text-[rgb(var(--text-muted))]'}`}>{folder}</button>)}</div>}</>}
                            <div className="space-y-2">{filteredTemplates.map(tpl => {
                                const author = getTemplateAuthor(tpl, lang); const folder = getFolder(tpl);
                                const cardContent = <><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><h4 className="truncate text-base font-black tracking-tight">{getTranslated(tpl.title, lang as any)}</h4><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-[rgb(var(--text-muted))]"><span>{tpl.program.length} {lang === 'es' ? 'días' : 'days'}</span>{tab !== 'mine' && <><span>·</span><span>{author}</span></>}{tab === 'mine' && folder && <><span>·</span><span>{folder}</span></>}</div></div>{tpl.isPro && <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[9px] font-black text-amber-500">PRO</span>}</div><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[rgb(var(--text-secondary))]">{getTranslated(tpl.description, lang as any)}</p></>;
                                if (tab !== 'mine') return <button key={tpl.id} type="button" onClick={() => onSelectTemplate(tpl)} className="w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.72)] p-4 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]">{cardContent}</button>;
                                return <div key={tpl.id} className="overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised)/0.72)]"><button type="button" onClick={() => onSelectTemplate(tpl)} className="w-full p-4 text-left transition-colors active:bg-[rgb(var(--surface-elevated))]">{cardContent}</button><div className="flex items-center gap-2 border-t border-[rgb(var(--border-subtle)/0.65)] bg-[rgb(var(--surface-base)/0.45)] px-3 py-2"><Icon name="Layers" size={13} className="text-[rgb(var(--text-muted))]"/><span className="text-[10px] font-bold text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Carpeta' : 'Folder'}</span><select value={folder} onChange={e => handleFolderSelection(tpl.id, e.target.value)} className="min-w-0 flex-1 bg-transparent text-right text-xs font-bold text-[rgb(var(--text-secondary))] outline-none"><option value="">{lang === 'es' ? 'Sin carpeta' : 'Unfiled'}</option>{folders.map(item => <option key={item} value={item}>{item}</option>)}<option value="__new__">+ {lang === 'es' ? 'Nueva carpeta…' : 'New folder…'}</option></select></div></div>;
                            })}</div>
                            {filteredTemplates.length === 0 && <div className="rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] px-6 py-10 text-center"><Icon name="Search" size={22} className="mx-auto text-[rgb(var(--text-muted))]"/><p className="mt-3 text-sm font-black">{lang === 'es' ? 'Sin resultados' : 'No matches'}</p><p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{lang === 'es' ? 'Prueba otro nombre, carpeta, autor o cantidad de días.' : 'Try another name, folder, author or day count.'}</p></div>}
                        </>
                    )}
                </div>
            </div>

            {showProgrammingSchool && <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]"/>}><NhProgrammingSchoolView lang={lang as 'en'|'es'} templates={templates} onBack={() => setShowProgrammingSchool(false)} onSaveTemplate={handleSchoolSave}/></Suspense>}
            {showPerformanceDetail && <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]"/>}><PerformanceProgramDetailView lang={lang as 'en'|'es'} onBack={() => setShowPerformanceDetail(false)} onStart={startPerformance}/></Suspense>}
            {showGutsDetail && <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]"/>}><GutsProgramDetailView lang={lang as 'en'|'es'} onBack={() => setShowGutsDetail(false)} onStart={startGuts}/></Suspense>}
            {showKongDetail && <Suspense fallback={<div className="fixed inset-0 z-modal bg-[rgb(var(--surface-app))]"/>}><ProgramDetailView lang={lang as 'en'|'es'} onBack={() => setShowKongDetail(false)} onStart={() => { setShowKongDetail(false); onSelectProgram?.('kong_4day'); }}/></Suspense>}
        </div>
    );

    if (typeof document === 'undefined') return selector;
    return createPortal(selector, document.body);
};
