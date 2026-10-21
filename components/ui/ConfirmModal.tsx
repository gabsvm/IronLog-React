
import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface ConfirmModalProps {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    isOpen: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
    title, 
    description, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    variant = 'primary',
    onConfirm, 
    onCancel,
    isOpen 
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const dialog = dialogRef.current;
        const controls = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? []);
        controls()[0]?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
            } else if (event.key === 'Tab') {
                const items = controls();
                if (!items.length) {
                    event.preventDefault();
                    dialog?.focus();
                    return;
                }
                const first = items[0]!;
                const last = items[items.length - 1]!;
                if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            previousFocus?.focus();
        };
    }, [isOpen, onCancel]);
    if (!isOpen) return null;

    // pointer-events-auto on the backdrop is REQUIRED, not decoration: Radix's
    // dismissable layer (under Vaul sheets) sets body{pointer-events:none} while
    // a sheet is open and only its own layer re-enables events — without this,
    // the dialog paints on top but taps fall through to whatever is beneath it.
    return (
        <div
            className="modal-backdrop fixed inset-0 z-confirm backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-base pointer-events-auto"
            onClick={onCancel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
        >
            <div ref={dialogRef} className="modal-surface gl-confirm-surface w-full max-w-sm border p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${variant === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-primary-500/10 text-primary-500'}`}>
                    <Icon name={variant === 'danger' ? "AlertTriangle" : "Info"} size={32} />
                </div>
                <h3 id="confirm-modal-title" className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                <p id="confirm-modal-desc" className="mb-6 text-sm leading-relaxed text-[rgb(var(--text-secondary))]">{description}</p>
                {cancelText ? (
                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
                        <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
                    </div>
                )}
            </div>
        </div>
    );
};
