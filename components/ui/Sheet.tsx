import React from 'react';
import { Drawer } from 'vaul';
import { Icon } from './Icon';

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;          // Accessible description (visually hidden by default)
    children: React.ReactNode;
    footer?: React.ReactNode;
    /**
     * 'sheet' (default): bottom drawer, drag-to-dismiss, snaps to 95% on mobile.
     * 'full': edge-to-edge fullscreen pane (no max-height). Headers stay sticky.
     */
    variant?: 'sheet' | 'full';
    /** Override accent color of the drag handle/header. Defaults to neutral. */
    accent?: 'primary' | 'amber' | 'violet' | 'emerald' | 'zinc';
    /** Hide the default close (X) button in the header. */
    hideCloseButton?: boolean;
    /** Adds a back button to the header. Pass the handler. */
    onBack?: () => void;
    /** Optional ID for the content container (focus targets, scroll anchors). */
    contentId?: string;
}

const ACCENT_HANDLE: Record<string, string> = {
    primary: 'bg-primary-500/50',
    // Legacy callers may still pass a semantic accent, but sheet chrome
    // follows the selected app accent instead of hard-coding a second color.
    amber: 'bg-primary-500/50',
    violet: 'bg-primary-500/50',
    emerald: 'bg-primary-500/50',
    zinc: 'bg-zinc-400/50 dark:bg-white/20',
};

/**
 * Unified Sheet primitive built on `vaul`.
 *
 * Replaces the patchwork of `<div className="fixed inset-0 z-..."` modals
 * scattered across the codebase. Provides:
 *  - Drag-to-dismiss gesture on mobile (the drag handle is the affordance).
 *  - Focus trap, ESC-to-close, and click-outside-to-close — all built in.
 *  - `role="dialog"` + `aria-modal="true"` set by vaul automatically.
 *  - Reduced-motion respect (CSS in index.css collapses transitions).
 *  - Consistent z-index via the `z-sheet` token.
 *
 * Use this for any new bottom-sheet / modal. Migrate legacy modals over time.
 */
export const Sheet: React.FC<SheetProps> = ({
    open,
    onOpenChange,
    title,
    description,
    children,
    footer,
    variant = 'sheet',
    accent = 'zinc',
    hideCloseButton = false,
    onBack,
    contentId,
}) => {
    const isFull = variant === 'full';

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
            <Drawer.Portal>
                <Drawer.Overlay className="modal-backdrop fixed inset-0 z-sheet backdrop-blur-sm" />
                <Drawer.Content
                    aria-describedby={description ? 'sheet-desc' : undefined}
                    className={`
                        fixed bottom-0 left-0 right-0 z-sheet flex flex-col
                        modal-surface outline-none
                        border-t
                        ${isFull
                            ? 'top-0 h-full rounded-none'
                            : 'max-h-[92vh] rounded-t-[1.75rem] shadow-2xl'}
                    `}
                >
                    {/* Drag handle (always present — it's the dismiss affordance) */}
                    {!isFull && (
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className={`w-10 h-1.5 rounded-full ${ACCENT_HANDLE[accent]}`} />
                        </div>
                    )}

                    {/* Drawer.Title must always exist for Radix/vaul a11y (WCAG 4.1.2).
                        When no visible title is needed it's rendered sr-only. */}
                    {!title && (
                        <Drawer.Title className="sr-only">Panel</Drawer.Title>
                    )}

                    {/* Header */}
                    {(title || onBack || !hideCloseButton) && (
                        <div className={`flex items-center gap-3 px-5 ${isFull ? 'h-16 pt-safe border-b border-zinc-200 dark:border-white/5' : 'py-3'} shrink-0`}>
                            {onBack && (
                                <button
                                    onClick={onBack}
                                    aria-label="Back"
                                    className="-ml-2 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors duration-fast ease-natural"
                                >
                                    <Icon name="ArrowLeft" size={20} />
                                </button>
                            )}
                            {title && (
                                <Drawer.Title className="flex-1 font-black text-lg text-zinc-900 dark:text-white tracking-tight truncate">
                                    {title}
                                </Drawer.Title>
                            )}
                            {!hideCloseButton && (
                                <button
                                    onClick={() => onOpenChange(false)}
                                    aria-label="Close"
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-200/60 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors duration-fast ease-natural"
                                >
                                    <Icon name="X" size={18} />
                                </button>
                            )}
                        </div>
                    )}
                    {description && (
                        <Drawer.Description id="sheet-desc" className="sr-only">{description}</Drawer.Description>
                    )}

                    {/* Scrollable body */}
                    <div id={contentId} className="flex-1 overflow-y-auto scroll-container">
                        {children}
                    </div>

                    {/* Sticky footer */}
                    {footer && (
                        <div className="modal-footer shrink-0 px-5 py-4 border-t pb-safe">
                            {footer}
                        </div>
                    )}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
};
