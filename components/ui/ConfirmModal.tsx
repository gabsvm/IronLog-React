
import React from 'react';
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
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onCancel}>
            <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-zinc-200 dark:border-white/10 text-center" onClick={e => e.stopPropagation()}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse ${variant === 'danger' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-500'}`}>
                    <Icon name={variant === 'danger' ? "AlertTriangle" : "Info"} size={32} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{description}</p>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={onCancel}>{cancelText}</Button>
                    <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
                </div>
            </div>
        </div>
    );
};
