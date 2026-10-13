import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { SessionExercise, CardioType } from '../../types';
import { TRANSLATIONS } from '../../constants';

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
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-[1.35rem] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-raised))] shadow-2xl backdrop-blur-xl z-dropdown animate-in fade-in zoom-in-95 duration-fast"
        >
            {!isDeleting ? (
                <>
                    {onOpenDetail && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenDetail(ex); onClose(); }}
                            role="menuitem"
                            className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--surface-elevated))]"
                        >
                            <Icon name="Info" size={16} className="text-muted" /> {String(t.exDetail)}
                        </button>
                    )}

                    {!isCardio && (
                        <>
                            <div className="my-1 h-px bg-[rgb(var(--surface-elevated)/0.66)]" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onSupersetAction(); onClose(); }}
                                role="menuitem"
                                className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--surface-elevated))]"
                            >
                                <Icon name={hasSuperset ? 'Unlink' : isLinking ? 'Target' : 'Link'} size={16} className={hasSuperset ? 'text-violet-300' : isLinking ? 'text-amber-300' : 'text-muted'} />
                                <span className="flex-1">
                                    {hasSuperset ? m.unlink : isLinking ? m.linking : m.link}
                                </span>
                            </button>
                        </>
                    )}

                    {isCardio && (
                        <>
                            <div className="my-1 h-px bg-[rgb(var(--surface-elevated)/0.66)]" />
                            {(['steady', 'hiit', 'tabata'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={(e) => { e.stopPropagation(); onCardioModeChange(m); }}
                                    role="menuitemradio"
                                    aria-checked={cardioMode === m}
                                    className={`flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-[rgb(var(--surface-elevated))] ${cardioMode === m ? 'text-blue-700 dark:text-blue-300' : 'text-[rgb(var(--text-secondary))]'}`}
                                >
                                    {cardioMode === m && <Icon name="Check" size={14} />} {String(t.cardioModes?.[m])}
                                </button>
                            ))}
                        </>
                    )}

                    {!isCardio && (
                        <>
                            <div className="my-1 h-px bg-[rgb(var(--surface-elevated)/0.66)]" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onInjectWarmup(); }}
                                role="menuitem"
                                className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-amber-700 dark:text-amber-300 transition-colors hover:bg-[rgb(var(--surface-elevated))]"
                            >
                                <Icon name="Zap" size={16} /> {m.addWarmup}
                            </button>
                            {onFillFromPrevious && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onFillFromPrevious(); }}
                                    role="menuitem"
                                    className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--surface-elevated))]"
                                >
                                    <Icon name="RotateCcw" size={16} className="text-muted" /> {m.fillPrevious}
                                </button>
                            )}
                            {onCopyToFollowing && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCopyToFollowing(); }}
                                    role="menuitem"
                                    className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-[rgb(var(--text-primary))] transition-colors hover:bg-[rgb(var(--surface-elevated))]"
                                >
                                    <Icon name="Copy" size={16} className="text-muted" /> {m.copyToFollowing}
                                </button>
                            )}
                        </>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onReplace(ex.instanceId); }}
                        role="menuitem"
                        className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-blue-700 dark:text-blue-300 transition-colors hover:bg-[rgb(var(--surface-elevated))]"
                    >
                        <Icon name="RefreshCw" size={16} /> {String(t.replaceEx)}
                    </button>

                    <div className="my-1 h-px bg-[rgb(var(--surface-elevated)/0.66)]" />

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                        role="menuitem"
                        className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-700 dark:text-red-300 transition-colors hover:bg-red-500/10"
                    >
                        <Icon name="Trash2" size={16} /> {String(t.removeEx)}
                    </button>
                </>
            ) : (
                <div className="space-y-2 bg-red-500/10 p-3">
                    <p className="px-2 text-center text-xs font-bold text-red-600 dark:text-red-300">{String(t.confirmRemoveEx)}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }}
                            className="flex-1 min-h-11 rounded-full bg-[rgb(var(--surface-elevated))] py-2 text-xs font-bold text-[rgb(var(--text-secondary))]"
                        >
                            {String(t.cancel)}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                            className="flex-1 min-h-11 rounded-full bg-red-500 py-2 text-xs font-bold text-white"
                        >
                            {String(t.delete)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
