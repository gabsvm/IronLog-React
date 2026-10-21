import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

afterEach(() => {
    cleanup();
    document.querySelector('[data-confirm-trigger]')?.remove();
});

describe('ConfirmModal keyboard interaction', () => {
    it('focuses an action, traps Tab, closes on Escape, and restores prior focus', () => {
        const trigger = document.createElement('button');
        trigger.dataset.confirmTrigger = 'true';
        document.body.appendChild(trigger);
        trigger.focus();
        const onCancel = vi.fn();
        const onConfirm = vi.fn();
        const props = {
            isOpen: true,
            title: 'Delete item?',
            description: 'This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onCancel,
            onConfirm,
        };
        const { rerender } = render(<ConfirmModal {...props} />);
        const cancel = screen.getByRole('button', { name: 'Cancel' });
        const confirm = screen.getByRole('button', { name: 'Delete' });

        expect(cancel).toHaveFocus();
        confirm.focus();
        fireEvent.keyDown(document, { key: 'Tab' });
        expect(cancel).toHaveFocus();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledOnce();

        rerender(<ConfirmModal {...props} isOpen={false} />);
        expect(trigger).toHaveFocus();
        trigger.remove();
    });
});
