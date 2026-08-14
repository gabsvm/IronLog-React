import React, { useState, useMemo, Suspense } from 'react';
import { Icon } from '../../components/ui/Icon';
import { GlobalTemplate } from '../../types';
import { getTranslated } from '../../utils';
const ProgramDetailView = React.lazy(() => import('../../components/programs/ProgramDetailView').then((module) => ({ default: module.ProgramDetailView })));

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
    if (tpl.scope === 'personal') {
        return lang === 'es' ? 'Mis plantillas' : 'My templates';
    }
    const id = tpl.id;
    if (id.startsWith('nh_') || id === 'toji_fushiguro' || id === 'tokita') {
        return 'Natural Hypertrophy';
    }
    if (id === 'ji3') {
        return 'Paul Carter';
    }
    if (id === 'full_body') {
        return 'Dr. Mike Israetel (RP)';
    }
    if (id.startsWith('cal_')) {
        return lang === 'es' ? 'Calistenia / Peso Corporal' : 'Calisthenics / Bodyweight';
    }
    return lang === 'es' ? 'Básicos & Especiales de la App' : 'Base & App Specials';
};

/**
 * Full-screen template picker shown when starting a new mesocycle.
 * Offers "design from scratch" + the list of global templates cataloged by author.
 */
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
    // Keep NH expanded by default as requested to highlight the new features
    const [expandedAuthors, setExpandedAuthors] = useState<Record<string, boolean>>({
        'Natural Hypertrophy': true,
    });

    const grouped = useMemo(() => {
        const groups: Record<string, GlobalTemplate[]> = {};
        templates.forEach(tpl => {
            const author = getTemplateAuthor(tpl, lang);
            if (!groups[author]) groups[author] = [];
            groups[author].push(tpl);
        });
        return groups;
    }, [templates, lang]);

    return (
        <div
            className="fixed inset-0 z-modal bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-base"
            role="dialog"
            aria-modal="true"
            aria-label={t.startMeso}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-xl font-black text-white">{t.startMeso}</h2>
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
                >
                    <Icon name="X" size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-container">
                <div className="rounded-2xl border border-primary-500/30 bg-primary-500/10 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">PROGRAMAS</p>
                    <button onClick={() => setShowKongDetail(true)} className="mt-2 w-full rounded-xl border border-primary-500/30 bg-zinc-900/80 p-4 text-left">
                        <p className="text-xl font-black text-white">KONG</p>
                        <p className="text-xs font-bold text-primary-300">SAVAGE SIZE · Alexander Bromley</p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">12 SEMANAS · 4 DÍAS · 3 BLOQUES</p>
                        <span className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-primary-500 px-3 text-xs font-black text-black">VER PROGRAMA</span>
                    </button>
                </div>
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">PLANTILLAS</p>
                {/* Option 1: Scratch */}
                <button
                    onClick={onCreateCustom}
                    className="w-full p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500 transition-all group text-left flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                        <Icon name="Edit" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">
                            {lang === 'en' ? 'Design from Scratch' : 'Crear desde Cero'}
                        </h3>
                        <p className="text-xs text-zinc-500">
                            {lang === 'en' ? 'Empty canvas. You choose the exercises.' : 'Lienzo vacío. Tú eliges los ejercicios.'}
                        </p>
                    </div>
                </button>

                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-zinc-800 flex-1" />
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
                        {lang === 'en' ? 'OR CHOOSE BY AUTHOR' : 'O ELIGE POR AUTOR'}
                    </span>
                    <div className="h-px bg-zinc-800 flex-1" />
                </div>

                {/* Templates Grouped List */}
                <div className="space-y-4">
                    {Object.entries(grouped).map(([author, groupTemplates]) => {
                        const isExpanded = !!expandedAuthors[author];
                        return (
                            <div key={author} className="border border-zinc-200/5 dark:border-white/5 rounded-2xl bg-zinc-900/10 overflow-hidden">
                                {/* Accordion Trigger */}
                                <button
                                    onClick={() => setExpandedAuthors(prev => ({ ...prev, [author]: !prev[author] }))}
                                    className="w-full px-5 py-4 flex items-center justify-between bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                            <Icon name="User" size={16} className="text-primary-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-sm">{author}</h3>
                                            <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
                                                {groupTemplates.length} {groupTemplates.length === 1 ? (lang === 'en' ? 'Program' : 'Programa') : (lang === 'en' ? 'Programs' : 'Programas')}
                                            </p>
                                        </div>
                                    </div>
                                    <Icon 
                                        name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                                        size={18} 
                                        className="text-zinc-500" 
                                    />
                                </button>

                                {/* Accordion Content */}
                                {isExpanded && (
                                    <div className="p-3 grid gap-3 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 duration-fast">
                                        {groupTemplates.map((tpl) => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => onSelectTemplate(tpl)}
                                                className="w-full bg-zinc-900/80 border border-zinc-800/80 p-4 rounded-xl text-left hover:border-primary-600/50 hover:bg-zinc-900 transition-all duration-fast relative overflow-hidden group"
                                            >
                                                {tpl.isPro && (
                                                    <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-500 text-[9px] font-black px-2 py-0.5 rounded border border-yellow-500/30 uppercase tracking-wider">
                                                        PRO
                                                    </div>
                                                )}

                                                <h4 className="font-bold text-white text-base pr-8">
                                                    {getTranslated(tpl.title, lang as any)}
                                                </h4>
                                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                                    {getTranslated(tpl.description, lang as any)}
                                                </p>

                                                <div className="mt-3 flex gap-2">
                                                    <span className="text-[10px] font-bold bg-zinc-800 text-zinc-500 px-2 py-1 rounded">
                                                        {tpl.program.length} {lang === 'en' ? 'Days' : 'Días'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
            {showKongDetail && <Suspense fallback={null}><ProgramDetailView lang={lang as 'en' | 'es'} onBack={() => setShowKongDetail(false)} onStart={() => { setShowKongDetail(false); onSelectProgram?.('kong_4day'); }} /></Suspense>}
        </div>
    );
};
