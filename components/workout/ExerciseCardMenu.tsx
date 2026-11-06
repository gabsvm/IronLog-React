import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { SessionExercise, CardioType } from '../../types';
import { TRANSLATIONS } from '../../constants';
import { pickLang } from '../../utils/i18n';

interface Props {
    ex: SessionExercise;
    isOpen: boolean;
    onClose: () => void;
    isCardio: boolean;
    cardioMode: CardioType;
    hasSuperset: boolean;
    isLinking: boolean;
    onOpenDetail?: (ex: SessionExercise) => void;
    onCardioModeChange: (m: CardioType) => void;
    onInjectWarmup: () => void;
    onOpenWarmup?: () => void;
    onFillFromPrevious?: () => void;
    onCopyToFollowing?: () => void;
    onSupersetAction: () => void;
    onReplace: (id: number | null) => void;
    onRequestDelete: () => void;
    t: any;
    lang: 'en' | 'es';
}

export const ExerciseCardMenu: React.FC<Props> = ({
    ex,
    isOpen,
    onClose,
    isCardio,
    cardioMode,
    hasSuperset,
    isLinking,
    onOpenDetail,
    onCardioModeChange,
    onInjectWarmup,
    onOpenWarmup,
    onFillFromPrevious,
    onCopyToFollowing,
    onSupersetAction,
    onReplace,
    onRequestDelete,
    t,
    lang,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const m = TRANSLATIONS[lang].cardMenu;

    React.useEffect(() => {
        if (!isOpen) setIsDeleting(false);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleDeleteConfirm = () => {
        onRequestDelete();
        setIsDeleting(false);
    };

    return (
        <div
            role="menu"
            aria-label={m.actions}
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-[8px] border border-border-subtle bg-surface-elevated shadow-2xl py-1 text-left z-dropdown animate-in fade-in zoom-in-95 duration-fast"
        >
            {!isDeleting ? (
                <>
                    {/* Section 1: Warmup & Sets */}
                    {!isCardio && (
                        <div>
                            <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                {pickLang(lang, { es: 'Preparación y series', en: 'Warmup & sets' })}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onInjectWarmup(); }}
                                role="menuitem"
                                className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                            >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-blue-500/30 bg-blue-500/20 text-[10px] font-extrabold text-blue-300">
                                    W
                                </span>
                                <span className="flex-1">{m.addWarmup}</span>
                            </button>

                            {onOpenWarmup && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenWarmup(); onClose(); }}
                                    role="menuitem"
                                    className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                                >
                                    <Icon name="Zap" size={16} className="shrink-0 text-blue-300" />
                                    <span className="flex-1">{t.warmupTitle || pickLang(lang, { es: 'Calculadora de calentamiento', en: 'Warmup calculator' })}</span>
                                </button>
                            )}

                            {onFillFromPrevious && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onFillFromPrevious(); }}
                                    role="menuitem"
                                    className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                                >
                                    <Icon name="RotateCcw" size={16} className="shrink-0 text-zinc-400" />
                                    <span className="flex-1">{m.fillPrevious}</span>
                                </button>
                            )}

                            {onCopyToFollowing && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCopyToFollowing(); }}
                                    role="menuitem"
                                    className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                                >
                                    <Icon name="Copy" size={16} className="shrink-0 text-zinc-400" />
                                    <span className="flex-1">{m.copyToFollowing}</span>
                                </button>
                            )}
                        </div>
                    )}

                    {!isCardio && <div className="my-1 border-t border-border-subtle" />}

                    {/* Section 2: Exercise */}
                    <div>
                        <div className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            {pickLang(lang, { es: 'Ejercicio', en: 'Exercise' })}
                        </div>

                        {onOpenDetail && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenDetail(ex); onClose(); }}
                                role="menuitem"
                                className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                            >
                                <Icon name="Info" size={16} className="shrink-0 text-zinc-400" />
                                <span className="flex-1">{String(t.exDetail)}</span>
                            </button>
                        )}

                        {!isCardio && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onSupersetAction(); onClose(); }}
                                role="menuitem"
                                className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                            >
                                <Icon
                                    name={hasSuperset ? 'Unlink' : isLinking ? 'Target' : 'Link'}
                                    size={16}
                                    className={hasSuperset ? 'shrink-0 text-violet-300' : isLinking ? 'shrink-0 text-amber-300' : 'shrink-0 text-zinc-400'}
                                />
                                <span className="flex-1">
                                    {hasSuperset ? m.unlink : isLinking ? m.linking : m.link}
                                </span>
                            </button>
                        )}

                        {isCardio && (
                            <>
                                <div className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    {pickLang(lang, { es: 'Modo de cardio', en: 'Cardio mode' })}
                                </div>
                                {(['steady', 'hiit', 'tabata'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={(e) => { e.stopPropagation(); onCardioModeChange(mode); }}
                                        role="menuitemradio"
                                        aria-checked={cardioMode === mode}
                                        className={`flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-white/5 active:bg-white/10 ${
                                            cardioMode === mode ? 'text-blue-300 font-semibold' : 'text-zinc-200'
                                        }`}
                                    >
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                                            {cardioMode === mode && <Icon name="Check" size={14} className="text-blue-300" />}
                                        </div>
                                        <span className="flex-1">{String(t.cardioModes?.[mode] || mode)}</span>
                                    </button>
                                ))}
                            </>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onReplace(ex.instanceId); onClose(); }}
                            role="menuitem"
                            className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10"
                        >
                            <Icon name="RefreshCw" size={16} className="shrink-0 text-zinc-400" />
                            <span className="flex-1">{String(t.replaceEx)}</span>
                        </button>
                    </div>

                    <div className="my-1 border-t border-border-subtle" />

                    {/* Destructive Footer */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                        role="menuitem"
                        className="flex min-h-10 w-full items-center gap-3 px-3.5 py-2 text-left text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/20"
                    >
                        <Icon name="Trash2" size={16} className="shrink-0 text-red-400" />
                        <span className="flex-1">{String(t.removeEx)}</span>
                    </button>
                </>
            ) : (
                <div className="space-y-2.5 bg-red-500/10 p-3 text-left">
                    <p className="px-1 text-xs font-semibold text-red-300">{String(t.confirmRemoveEx)}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }}
                            className="flex-1 min-h-9 rounded-[6px] bg-white/10 hover:bg-white/15 py-1.5 text-xs font-medium text-zinc-200 transition-colors"
                        >
                            {String(t.cancel)}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                            className="flex-1 min-h-9 rounded-[6px] bg-red-600 hover:bg-red-500 py-1.5 text-xs font-bold text-white transition-colors"
                        >
                            {String(t.delete)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
