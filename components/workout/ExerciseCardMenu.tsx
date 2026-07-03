import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { SessionExercise, CardioType } from '../../types';

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
    onSupersetAction,
    onReplace,
    onRequestDelete,
    t,
    lang,
}) => {
    const [isDeleting, setIsDeleting] = useState(false);

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
            aria-label={lang === 'es' ? 'Acciones del ejercicio' : 'Exercise actions'}
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#17171B]/95 shadow-2xl shadow-black/50 backdrop-blur-xl z-dropdown animate-in fade-in zoom-in-95 duration-fast"
        >
            {!isDeleting ? (
                <>
                    {onOpenDetail && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenDetail(ex); onClose(); }}
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-zinc-100 transition-colors hover:bg-white/5"
                        >
                            <Icon name="Info" size={16} className="text-zinc-400" /> {String(t.exDetail)}
                        </button>
                    )}

                    {!isCardio && (
                        <>
                            <div className="my-1 h-px bg-white/5" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onSupersetAction(); onClose(); }}
                                role="menuitem"
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-zinc-100 transition-colors hover:bg-white/5"
                            >
                                <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${hasSuperset ? 'border-violet-500/30 bg-violet-500/15 text-violet-300' : isLinking ? 'border-amber-500/30 bg-amber-500/15 text-amber-300' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                                    <Icon name={hasSuperset ? 'Unlink' : isLinking ? 'Target' : 'Link'} size={15} />
                                </span>
                                <span className="flex-1">
                                    {hasSuperset
                                        ? (lang === 'es' ? 'Quitar superserie' : 'Remove superset')
                                        : isLinking
                                            ? (lang === 'es' ? 'Seleccionando pareja...' : 'Selecting partner...')
                                            : (lang === 'es' ? 'Crear superserie' : 'Create superset')}
                                </span>
                            </button>
                        </>
                    )}

                    {isCardio && (
                        <>
                            <div className="my-1 h-px bg-white/5" />
                            {(['steady', 'hiit', 'tabata'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={(e) => { e.stopPropagation(); onCardioModeChange(m); }}
                                    role="menuitemradio"
                                    aria-checked={cardioMode === m}
                                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold transition-colors hover:bg-white/5 ${cardioMode === m ? 'text-blue-300' : 'text-zinc-300'}`}
                                >
                                    {cardioMode === m && <Icon name="Check" size={14} />} {String(t.cardioModes?.[m])}
                                </button>
                            ))}
                        </>
                    )}

                    {!isCardio && (
                        <>
                            <div className="my-1 h-px bg-white/5" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onInjectWarmup(); }}
                                role="menuitem"
                                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-amber-300 transition-colors hover:bg-white/5"
                            >
                                <Icon name="Zap" size={16} /> {lang === 'es' ? 'Agregar warmup' : 'Add warmup sets'}
                            </button>
                        </>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onReplace(ex.instanceId); }}
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-blue-300 transition-colors hover:bg-white/5"
                    >
                        <Icon name="RefreshCw" size={16} /> {String(t.replaceEx)}
                    </button>

                    <div className="my-1 h-px bg-white/5" />

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                        role="menuitem"
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-300 transition-colors hover:bg-red-500/10"
                    >
                        <Icon name="Trash2" size={16} /> {String(t.removeEx)}
                    </button>
                </>
            ) : (
                <div className="space-y-2 bg-red-500/10 p-3">
                    <p className="px-2 text-center text-xs font-bold text-red-200">{String(t.confirmRemoveEx)}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }}
                            className="flex-1 rounded-xl bg-white/5 py-2 text-xs font-bold text-zinc-200"
                        >
                            {String(t.cancel)}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                            className="flex-1 rounded-xl bg-red-500 py-2 text-xs font-bold text-white"
                        >
                            {String(t.delete)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
