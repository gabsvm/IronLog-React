import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../ui/Icon';
import { pickLang } from '../../../utils/i18n';
import type { SetType, WorkoutSet } from '../../../types';

export interface SetRowActionMenuProps {
    isOpen: boolean;
    onClose: () => void;
    set: WorkoutSet;
    exInstanceId: number;
    lang: 'en' | 'es';
    onUpdate: (exId: number, setId: number, field: string, value: any) => void;
    onChangeType: (exId: number, setId: number, type: SetType) => void;
    onAddSetBelow?: () => void;
    onDeleteSet?: () => void;
    anchorRef?: React.RefObject<HTMLElement | null>;
}

export const SetRowActionMenu: React.FC<SetRowActionMenuProps> = ({
    isOpen,
    onClose,
    set,
    exInstanceId,
    lang,
    onUpdate,
    onChangeType,
    onAddSetBelow,
    onDeleteSet,
    anchorRef,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    const [pos, setPos] = useState<{
        top?: number;
        bottom?: number;
        left: number;
        maxHeight: number;
    } | null>(() => {
        if (!anchorRef?.current || typeof window === 'undefined') return null;
        const rect = anchorRef.current.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const vw = window.innerWidth || 360;
        const spaceBelow = vh - rect.bottom;
        const spaceAbove = rect.top;
        const openUpwards = spaceBelow < 360 && spaceAbove > spaceBelow;
        const menuWidth = 256;
        const margin = 8;
        const left = Math.max(margin, Math.min(rect.left, vw - menuWidth - margin));
        if (openUpwards) {
            return {
                bottom: vh - rect.top + 6,
                left,
                maxHeight: Math.max(180, spaceAbove - 20),
            };
        }
        return {
            top: rect.bottom + 6,
            left,
            maxHeight: Math.max(180, spaceBelow - 20),
        };
    });

    const updatePosition = useCallback(() => {
        const el = anchorRef?.current;
        if (!el || typeof window === 'undefined') return;

        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 800;
        const vw = window.innerWidth || 360;

        // If trigger button scrolled far out of view, dismiss
        if (rect.bottom < -50 || rect.top > vh + 50) {
            onClose();
            return;
        }

        const menuHeightEstimate = 360;
        const spaceBelow = vh - rect.bottom;
        const spaceAbove = rect.top;
        const openUpwards = spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow;

        const menuWidth = 256;
        const margin = 8;
        const left = Math.max(margin, Math.min(rect.left, vw - menuWidth - margin));

        if (openUpwards) {
            setPos({
                bottom: vh - rect.top + 6,
                left,
                maxHeight: Math.max(180, spaceAbove - 20),
            });
        } else {
            setPos({
                top: rect.bottom + 6,
                left,
                maxHeight: Math.max(180, spaceBelow - 20),
            });
        }
    }, [anchorRef, onClose]);

    useLayoutEffect(() => {
        if (!isOpen) {
            setPos(null);
            return;
        }
        updatePosition();

        const handleScroll = () => {
            updatePosition();
        };
        const handleResize = () => {
            updatePosition();
        };

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const setType = set.type || 'regular';

    const handleSelectType = (type: SetType) => {
        onUpdate(exInstanceId, set.id, 'type', type);
        onClose();
    };

    const handleSkip = () => {
        onUpdate(exInstanceId, set.id, 'weight', 0);
        onUpdate(exInstanceId, set.id, 'reps', 0);
        onUpdate(exInstanceId, set.id, 'completed', true);
        onClose();
    };

    const handleAdd = () => {
        if (onAddSetBelow) {
            onAddSetBelow();
        }
        onClose();
    };

    const handleDelete = () => {
        if (onDeleteSet) {
            onDeleteSet();
        }
        onClose();
    };

    const handleOpenFullTypes = () => {
        onChangeType(exInstanceId, set.id, setType);
        onClose();
    };

    const menuContent = (
        <>
            {/* Backdrop to dismiss on tap/click outside */}
            <div
                className="fixed inset-0 z-[9998] bg-black/10"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            />
            <div
                ref={menuRef}
                onClick={(e) => e.stopPropagation()}
                style={
                    pos
                        ? {
                              position: 'fixed',
                              top: pos.top !== undefined ? `${pos.top}px` : undefined,
                              bottom: pos.bottom !== undefined ? `${pos.bottom}px` : undefined,
                              left: `${pos.left}px`,
                              maxHeight: `${pos.maxHeight}px`,
                          }
                        : undefined
                }
                className={`fixed z-[9999] w-64 rounded-[8px] border border-border-subtle bg-surface-elevated shadow-2xl overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-100 ${
                    !pos ? 'left-4 top-20' : ''
                }`}
            >
                {/* Section 1: Set actions */}
                <div className="px-3.5 pt-2.5 pb-1 text-[11px] font-semibold text-zinc-400">
                    {pickLang(lang, { es: 'Serie', en: 'Set' })}
                </div>
                <div className="flex flex-col py-0.5">
                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-3 px-3.5 py-2 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10 text-left"
                    >
                        <Icon name="Plus" size={16} className="shrink-0 text-zinc-400" />
                        <span>{pickLang(lang, { es: 'Añadir serie debajo', en: 'Add set below' })}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="flex items-center gap-3 px-3.5 py-2 text-[13px] font-medium text-zinc-200 transition-colors hover:bg-white/5 active:bg-white/10 text-left"
                    >
                        <Icon name="FastForward" size={16} className="shrink-0 text-zinc-400" />
                        <span>{pickLang(lang, { es: 'Saltar serie', en: 'Skip set' })}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex items-center gap-3 px-3.5 py-2 text-[13px] font-medium text-red-400 transition-colors hover:bg-red-500/10 active:bg-red-500/20 text-left"
                    >
                        <Icon name="Trash2" size={16} className="shrink-0 text-red-400" />
                        <span>{pickLang(lang, { es: 'Eliminar serie', en: 'Delete set' })}</span>
                    </button>
                </div>

                <div className="my-1 border-t border-border-subtle" />

                {/* Section 2: Set Type */}
                <div className="px-3.5 pt-1.5 pb-1 text-[11px] font-semibold text-zinc-400">
                    {pickLang(lang, { es: 'Tipo de serie', en: 'Set Type' })}
                </div>
                <div className="flex flex-col py-0.5">
                    {/* Regular */}
                    <button
                        type="button"
                        onClick={() => handleSelectType('regular')}
                        className="flex items-start gap-3 px-3.5 py-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                    >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center pt-0.5">
                            {setType === 'regular' ? (
                                <Icon name="Check" size={16} className="text-white" />
                            ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-semibold text-white">Regular</div>
                            <div className="text-[11px] text-zinc-400">
                                {pickLang(lang, { es: 'Normal, descendente, ascendente', en: 'Straight, down, ascending' })}
                            </div>
                        </div>
                    </button>

                    {/* Myorep */}
                    <button
                        type="button"
                        onClick={() => handleSelectType('myorep')}
                        className="flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-purple-500/30 bg-purple-500/20 text-[10px] font-extrabold text-purple-300">
                                M
                            </span>
                            <span className="text-[13px] font-medium text-zinc-200">Myorep</span>
                        </div>
                        <Icon name="Info" size={14} className="text-zinc-500" />
                    </button>

                    {/* Cluster / Myorep Match */}
                    <button
                        type="button"
                        onClick={() => handleSelectType('cluster')}
                        className="flex items-center justify-between gap-3 px-3.5 py-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-emerald-500/30 bg-emerald-500/20 text-[9px] font-extrabold text-emerald-300">
                                MM
                            </span>
                            <span className="text-[13px] font-medium text-zinc-200">
                                {pickLang(lang, { es: 'Myorep Match / Cluster', en: 'Myorep Match' })}
                            </span>
                        </div>
                        <Icon name="Info" size={14} className="text-zinc-500" />
                    </button>

                    {/* Drop Set */}
                    <button
                        type="button"
                        onClick={() => handleSelectType('drop')}
                        className="flex items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                    >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-amber-500/30 bg-amber-500/20 text-[10px] font-extrabold text-amber-300">
                            D
                        </span>
                        <span className="text-[13px] font-medium text-zinc-200">Drop Set</span>
                    </button>

                    {/* Warmup */}
                    <button
                        type="button"
                        onClick={() => handleSelectType('warmup')}
                        className="flex items-center gap-3 px-3.5 py-2 text-left transition-colors hover:bg-white/5 active:bg-white/10"
                    >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border border-blue-500/30 bg-blue-500/20 text-[10px] font-extrabold text-blue-300">
                            W
                        </span>
                        <span className="text-[13px] font-medium text-zinc-200">
                            {pickLang(lang, { es: 'Calentamiento', en: 'Warmup' })}
                        </span>
                    </button>

                    {/* All protocols button */}
                    <button
                        type="button"
                        onClick={handleOpenFullTypes}
                        className="mt-1 flex items-center justify-center border-t border-border-subtle/80 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-400 transition-colors hover:bg-white/5"
                    >
                        {pickLang(lang, { es: 'Todos los protocolos...', en: 'All protocols...' })}
                    </button>
                </div>
            </div>
        </>
    );

    if (typeof document !== 'undefined') {
        return createPortal(menuContent, document.body);
    }
    return menuContent;
};
