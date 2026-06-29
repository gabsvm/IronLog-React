import React, { useState } from 'react';
import { Icon } from '../ui/Icon';
import { SessionExercise, CardioType } from '../../types';

interface Props {
    ex: SessionExercise;
    isOpen: boolean;
    onClose: () => void;
    isCardio: boolean;
    cardioMode: CardioType;
    unit: 'kg' | 'lb' | 'pl';
    hasSuperset: boolean;
    onOpenDetail?: (ex: SessionExercise) => void;
    onCardioModeChange: (m: CardioType) => void;
    onInjectWarmup: () => void;
    onToggleUnit: () => void;
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
    unit,
    onOpenDetail,
    onCardioModeChange,
    onInjectWarmup,
    onToggleUnit,
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
            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-100 dark:border-white/5 z-dropdown overflow-hidden animate-in fade-in zoom-in-95 duration-fast"
        >
            {!isDeleting ? (
                <>
                    {onOpenDetail && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenDetail(ex); onClose(); }}
                            role="menuitem"
                            className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                            <Icon name="Info" size={16} /> {String(t.exDetail)}
                        </button>
                    )}

                    {isCardio && (
                        <>
                            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
                            {(['steady', 'hiit', 'tabata'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={(e) => { e.stopPropagation(); onCardioModeChange(m); }}
                                    role="menuitemradio"
                                    aria-checked={cardioMode === m}
                                    className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2 ${cardioMode === m ? 'text-blue-600' : 'text-zinc-600 dark:text-zinc-300'}`}
                                >
                                    {cardioMode === m && <Icon name="Check" size={14} />} {String(t.cardioModes?.[m])}
                                </button>
                            ))}
                        </>
                    )}

                    {!isCardio && (
                        <>
                            <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />
                            <button
                                onClick={(e) => { e.stopPropagation(); onInjectWarmup(); }}
                                role="menuitem"
                                className="w-full text-left px-4 py-3 text-sm font-bold text-orange-600 dark:text-orange-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2"
                            >
                                <Icon name="Zap" size={16} /> {lang === 'es' ? 'Agregar warmup' : 'Add warmup sets'}
                            </button>
                        </>
                    )}

                    {!isCardio && !ex.isBodyweight && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleUnit(); onClose(); }}
                            role="menuitem"
                            className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                            <Icon name="Settings" size={16} /> {String(t.units?.toggle)}
                        </button>
                    )}

                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />

                    <button
                        onClick={(e) => { e.stopPropagation(); onReplace(ex.instanceId); }}
                        role="menuitem"
                        className="w-full text-left px-4 py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                        <Icon name="RefreshCw" size={16} /> {String(t.replaceEx)}
                    </button>

                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1" />

                    <button
                        onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }}
                        role="menuitem"
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                        <Icon name="Trash2" size={16} /> {String(t.removeEx)}
                    </button>
                </>
            ) : (
                <div className="p-2 space-y-2 bg-red-50 dark:bg-red-900/10">
                    <p className="text-xs text-red-600 text-center font-bold px-2">{String(t.confirmRemoveEx)}</p>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }}
                            className="flex-1 py-2 text-xs font-bold bg-white dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300"
                        >
                            {String(t.cancel)}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConfirm(); }}
                            className="flex-1 py-2 text-xs font-bold bg-red-600 text-white rounded-lg"
                        >
                            {String(t.delete)}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
