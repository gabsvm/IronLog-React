
import React, { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Icon } from './Icon';
import { useModalLayer, consumeModalHistory } from './useModalLayer';

interface ConfirmModalProps {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
    manageHistory?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    title, 
    description, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    variant = 'primary',
    onConfirm, 
    onCancel, 
    isOpen,
    manageHistory = true,
}) => {
    const { contentRef, isTopLayer } = useModalLayer(isOpen, onCancel, { manualFocus: true, manageHistory });
    const titleId = useId();
    const descriptionId = useId();
    const confirmedRef = useRef(false);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (confirmedRef.current) return;
        confirmedRef.current = true;
        consumeModalHistory(() => {
            onConfirm();
        });
    };

    // pointer-events-auto on the backdrop is REQUIRED, not decoration: Radix's
    // dismissable layer (under Vaul sheets) sets body{pointer-events:none} while
    // a sheet is open and only its own layer re-enables events — without this,
    // the dialog paints on top but taps fall through to whatever is beneath it.
    return createPortal(
        <div
            className="modal-backdrop fixed inset-0 z-confirm backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-base pointer-events-auto"
            onClick={event => {
                if (event.target === event.currentTarget && isTopLayer()) onCancel();
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
        >
            <div ref={contentRef} tabIndex={-1} className="modal-surface gl-confirm-surface w-full max-w-sm border p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-primary-500/10 text-primary-500'}`}>
                    <Icon name={variant === 'danger' ? "AlertTriangle" : "Info"} size={32} />
                </div>
                <h3 id={titleId} className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                <p id={descriptionId} className="mb-6 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{description}</p>
                {cancelText ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
                        <Button variant={variant} onClick={handleConfirm}>{confirmText}</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <Button variant={variant} onClick={handleConfirm}>{confirmText}</Button>
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};
