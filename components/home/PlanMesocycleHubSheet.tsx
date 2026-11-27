import React, { useState, useEffect } from 'react';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { pickLang } from '../../utils/i18n';
import {
    clearMesocycleDraft,
    loadMesocycleDraft,
    setMesoEditorIntent,
} from '../../utils/mesoDraft';
import type { Lang, MesocycleDraft } from '../../types';

interface PlanMesocycleHubSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lang: Lang;
    onResumeDraft: (draft: MesocycleDraft) => void;
    onStartTemplate: () => void;
    onStartMesoBuilder: () => void;
    onStartScratch: () => void;
}

export const PlanMesocycleHubSheet: React.FC<PlanMesocycleHubSheetProps> = ({
    open,
    onOpenChange,
    lang,
    onResumeDraft,
    onStartTemplate,
    onStartMesoBuilder,
    onStartScratch,
}) => {
    const [draft, setDraft] = useState<MesocycleDraft | null>(null);

    useEffect(() => {
        if (open) {
            setDraft(loadMesocycleDraft());
        }
    }, [open]);

    const handleDiscardDraft = (e: React.MouseEvent) => {
        e.stopPropagation();
        clearMesocycleDraft();
        setDraft(null);
    };

    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            title={pickLang(lang, { es: 'Planificar un mesociclo', en: 'Plan a mesocycle' })}
            description={pickLang(lang, {
                es: 'Elige cómo armar tu próximo bloque de entrenamiento',
                en: 'Choose how to set up your next training block',
            })}
            accent="primary"
        >
            <div className="p-4 space-y-2.5" data-testid="plan-meso-hub-sheet">
                {draft && (
                    <div className="flex items-stretch gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setMesoEditorIntent('resume');
                                onOpenChange(false);
                                onResumeDraft(draft);
                            }}
                            className="flex-1 flex items-center gap-3.5 rounded-[10px] border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/15 p-3.5 text-left transition-colors active:scale-[0.99]"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-emerald-500/20 text-emerald-400">
                                <Icon name="Play" size={19} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-white truncate">
                                    {pickLang(lang, { es: 'Reanudar plan en progreso', en: 'Resume plan in progress' })}
                                </span>
                                <span className="block text-xs text-emerald-300/90 truncate mt-0.5">
                                    {draft.name} · {draft.program.length}{' '}
                                    {pickLang(lang, {
                                        es: draft.program.length === 1 ? 'día' : 'días',
                                        en: draft.program.length === 1 ? 'day' : 'days',
                                    })}
                                </span>
                            </div>
                            <Icon name="ChevronRight" size={16} className="text-emerald-400 shrink-0" />
                        </button>
                        <button
                            type="button"
                            onClick={handleDiscardDraft}
                            aria-label={pickLang(lang, { es: 'Descartar borrador', en: 'Discard draft' })}
                            className="flex w-11 items-center justify-center rounded-[10px] border border-border-subtle bg-surface-raised text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <Icon name="Trash2" size={16} />
                        </button>
                    </div>
                )}

                <button
                    type="button"
                    data-testid="hub-start-template-btn"
                    onClick={() => {
                        onOpenChange(false);
                        onStartTemplate();
                    }}
                    className="flex w-full items-center gap-3.5 rounded-[10px] border border-border-subtle bg-surface-raised hover:border-primary-500/40 hover:bg-surface-elevated p-3.5 text-left transition-colors active:scale-[0.99]"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-primary-500/15 text-primary-400">
                        <Icon name="Grid3x3" size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">
                            {pickLang(lang, { es: 'Empezar con plantilla', en: 'Start with a template' })}
                        </span>
                        <span className="block text-xs text-zinc-400 mt-0.5">
                            {pickLang(lang, {
                                es: 'RP Periodization, Natural Hypertrophy, KONG y tus plantillas',
                                en: 'RP Periodization, Natural Hypertrophy, KONG & your templates',
                            })}
                        </span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-zinc-500 shrink-0" />
                </button>

                <button
                    type="button"
                    data-testid="hub-meso-builder-btn"
                    onClick={() => {
                        setMesoEditorIntent('builder');
                        onOpenChange(false);
                        onStartMesoBuilder();
                    }}
                    className="flex w-full items-center gap-3.5 rounded-[10px] border border-border-subtle bg-surface-raised hover:border-violet-500/40 hover:bg-surface-elevated p-3.5 text-left transition-colors active:scale-[0.99]"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-violet-500/15 text-violet-400">
                        <Icon name="Zap" size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">
                            {pickLang(lang, { es: 'Meso Builder guiado', en: 'Meso Builder' })}
                        </span>
                        <span className="block text-xs text-zinc-400 mt-0.5">
                            {pickLang(lang, {
                                es: 'Prioridades musculares (Enfatizar / Crecer / Mantener) + ⚡ Auto-Recomendación',
                                en: 'Muscle priorities (Emphasize / Grow / Maintain) + ⚡ Auto-Recommend',
                            })}
                        </span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-zinc-500 shrink-0" />
                </button>

                <button
                    type="button"
                    data-testid="hub-start-scratch-btn"
                    onClick={() => {
                        setMesoEditorIntent('scratch');
                        onOpenChange(false);
                        onStartScratch();
                    }}
                    className="flex w-full items-center gap-3.5 rounded-[10px] border border-border-subtle bg-surface-raised hover:border-zinc-500 hover:bg-surface-elevated p-3.5 text-left transition-colors active:scale-[0.99]"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-surface-base border border-border-subtle text-zinc-300">
                        <Icon name="Plus" size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-white">
                            {pickLang(lang, { es: 'Empezar desde cero', en: 'Start from scratch' })}
                        </span>
                        <span className="block text-xs text-zinc-400 mt-0.5">
                            {pickLang(lang, {
                                es: 'Crea tus días, grupos musculares y ejercicios libremente',
                                en: 'Build custom training days, muscles and exercises freely',
                            })}
                        </span>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-zinc-500 shrink-0" />
                </button>
            </div>
        </Sheet>
    );
};
