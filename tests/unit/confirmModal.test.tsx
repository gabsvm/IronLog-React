import React, { StrictMode, useState } from 'react';
import { setTimeout as nextTask } from 'node:timers/promises';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Sheet } from '../../components/ui/Sheet';

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

    it('keeps Escape, forward/reverse Tab and outside focus in the confirm above a real Vaul sheet', async () => {
        const sheetDismiss = vi.fn();
        const confirmDismiss = vi.fn();
        function Stack() {
            const [sheet, setSheet] = useState(false);
            const [confirm, setConfirm] = useState(false);
            return <>
                <button onClick={() => setSheet(true)}>Open profile</button>
                <Sheet open={sheet} title="Profile" onOpenChange={open => { sheetDismiss(open); setSheet(open); }}>
                    <button onClick={() => setConfirm(true)}>Import backup</button>
                </Sheet>
                <ConfirmModal isOpen={confirm} title="Import error" description="Invalid JSON"
                    confirmText="Dismiss" cancelText="Cancel import"
                    onConfirm={() => setConfirm(false)}
                    onCancel={() => { confirmDismiss(); setConfirm(false); }} />
            </>;
        }
        render(<StrictMode><Stack /></StrictMode>);
        const trigger = screen.getByRole('button', { name: 'Open profile' });
        trigger.focus();
        fireEvent.click(trigger);
        const importButton = await screen.findByRole('button', { name: 'Import backup' });
        importButton.focus();
        fireEvent.click(importButton);
        const dialog = screen.getByRole('dialog', { name: 'Import error' });
        const cancel = within(dialog).getByRole('button', { name: 'Cancel import' });
        const dismiss = within(dialog).getByRole('button', { name: 'Dismiss' });
        expect(cancel).toHaveFocus();
        fireEvent.keyDown(cancel, { key: 'Tab' });
        expect(dismiss).toHaveFocus();
        fireEvent.keyDown(dismiss, { key: 'Tab' });
        expect(cancel).toHaveFocus();
        fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true });
        expect(dismiss).toHaveFocus();
        importButton.focus();
        expect(cancel).toHaveFocus();
        fireEvent.pointerDown(dialog);
        fireEvent.keyDown(cancel, { key: 'Escape' });
        expect(confirmDismiss).toHaveBeenCalledOnce();
        expect(sheetDismiss).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'Profile' })).toBeInTheDocument();
        expect(importButton).toHaveFocus();
        fireEvent.keyDown(importButton, { key: 'Escape' });
        expect(sheetDismiss).toHaveBeenCalledTimes(1);
        expect(sheetDismiss).toHaveBeenCalledWith(false);
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await waitFor(() => expect(trigger).toHaveFocus());
        await waitFor(() => {
            expect(document.body.style.pointerEvents).toBe('');
            expect(document.body.style.overflow).toBe('');
        });
    });

    it('does not dismiss the underlying sheet when a deferred outside tap closes its confirm', async () => {
        const sheetDismiss = vi.fn();
        const confirmDismiss = vi.fn();
        function Stack() {
            const [sheet, setSheet] = useState(false);
            const [confirm, setConfirm] = useState(false);
            return <>
                <button onClick={() => setSheet(true)}>Open profile</button>
                <Sheet open={sheet} title="Profile" onOpenChange={open => { sheetDismiss(open); setSheet(open); }}>
                    <button onClick={() => setConfirm(true)}>Import backup</button>
                </Sheet>
                <ConfirmModal isOpen={confirm} title="Import error" description="Invalid JSON"
                    confirmText="Dismiss" cancelText=""
                    onConfirm={() => setConfirm(false)}
                    onCancel={() => { confirmDismiss(); setConfirm(false); }} />
            </>;
        }
        render(<StrictMode><Stack /></StrictMode>);
        const trigger = screen.getByRole('button', { name: 'Open profile' });
        trigger.focus();
        fireEvent.click(trigger);
        const importButton = await screen.findByRole('button', { name: 'Import backup' });
        // Radix installs its native pointerdown listener on the next task.
        await act(async () => { await nextTask(); });
        importButton.focus();
        fireEvent.click(importButton);
        const confirm = screen.getByRole('dialog', { name: 'Import error' });
        // Preserve a native left-button pointerdown through document click:
        // the React backdrop handler unmounts ConfirmModal before Radix's
        // deferred outside-interaction handler runs on that same click.
        fireEvent(confirm, new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
        fireEvent.click(confirm);
        expect(confirmDismiss).toHaveBeenCalledOnce();
        expect(sheetDismiss).not.toHaveBeenCalled();
        expect(screen.queryByRole('dialog', { name: 'Import error' })).not.toBeInTheDocument();
        const profile = screen.getByRole('dialog', { name: 'Profile' });
        expect(importButton).toHaveFocus();
        fireEvent.click(within(profile).getByRole('button', { name: 'Close' }));
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await waitFor(() => expect(trigger).toHaveFocus());
        expect(document.body.style.pointerEvents).toBe('');
        expect(document.body.style.overflow).toBe('');
    });

    it('dismisses two confirms in order without resetting focus when callbacks change', () => {
        const firstCancel = vi.fn();
        const secondCancel = vi.fn();
        function Stack() {
            const [first, setFirst] = useState(true);
            const [second, setSecond] = useState(false);
            const [, refresh] = useState(0);
            return <>
                <ConfirmModal isOpen={first} title="First confirm" description="First"
                    confirmText="Open second" cancelText="Cancel first"
                    onConfirm={() => setSecond(true)}
                    onCancel={() => { firstCancel(); setFirst(false); }} />
                <ConfirmModal isOpen={second} title="Second confirm" description="Second"
                    confirmText="Refresh callbacks" cancelText="Cancel second"
                    onConfirm={() => refresh(value => value + 1)}
                    onCancel={() => { secondCancel(); setSecond(false); }} />
            </>;
        }
        const trigger = document.createElement('button');
        trigger.dataset.confirmTrigger = 'true';
        document.body.appendChild(trigger);
        trigger.focus();
        render(<StrictMode><Stack /></StrictMode>);
        const openSecond = screen.getByRole('button', { name: 'Open second' });
        openSecond.focus();
        fireEvent.click(openSecond);
        const refresh = screen.getByRole('button', { name: 'Refresh callbacks' });
        refresh.focus();
        fireEvent.click(refresh);
        expect(refresh).toHaveFocus();
        fireEvent.keyDown(refresh, { key: 'Escape' });
        expect(secondCancel).toHaveBeenCalledOnce();
        expect(firstCancel).not.toHaveBeenCalled();
        expect(openSecond).toHaveFocus();
        fireEvent.keyDown(openSecond, { key: 'Escape' });
        expect(firstCancel).toHaveBeenCalledOnce();
        expect(trigger).toHaveFocus();
        expect(document.body.style.overflow).toBe('');
    });

    it('preserves nested sheet ownership through dismissal and restores each trigger', async () => {
        function Stack() {
            const [outer, setOuter] = useState(false);
            const [inner, setInner] = useState(false);
            return <>
                <button onClick={() => setOuter(true)}>Open outer</button>
                <Sheet open={outer} title="Outer sheet" onOpenChange={setOuter}>
                    <button onClick={() => setInner(true)}>Open inner</button>
                </Sheet>
                <Sheet open={inner} title="Inner sheet" onOpenChange={setInner}>
                    <button>Inner control</button>
                </Sheet>
            </>;
        }
        render(<StrictMode><Stack /></StrictMode>);
        const trigger = screen.getByRole('button', { name: 'Open outer' });
        trigger.focus();
        fireEvent.click(trigger);
        const innerTrigger = await screen.findByRole('button', { name: 'Open inner' });
        innerTrigger.focus();
        fireEvent.click(innerTrigger);
        const inner = await screen.findByRole('dialog', { name: 'Inner sheet' });
        fireEvent.keyDown(inner, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Inner sheet' })).not.toBeInTheDocument());
        expect(screen.getByRole('dialog', { name: 'Outer sheet' })).toBeInTheDocument();
        await waitFor(() => expect(innerTrigger).toHaveFocus());
        fireEvent.keyDown(innerTrigger, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await waitFor(() => expect(trigger).toHaveFocus());
        expect(document.body.style.overflow).toBe('');
        expect(document.body.style.pointerEvents).toBe('');
    });

    it('keeps the final return target when a lower confirm disappears first', () => {
        function Stack() {
            const [first, setFirst] = useState(true);
            const [second, setSecond] = useState(false);
            return <>
                <ConfirmModal isOpen={first} title="Lower confirm" description="Lower"
                    confirmText="Open upper" onConfirm={() => setSecond(true)} onCancel={() => setFirst(false)} />
                <ConfirmModal isOpen={second} title="Upper confirm" description="Upper"
                    confirmText="Remove lower" onConfirm={() => setFirst(false)} onCancel={() => setSecond(false)} />
            </>;
        }
        const trigger = document.createElement('button');
        trigger.dataset.confirmTrigger = 'true';
        document.body.appendChild(trigger);
        trigger.focus();
        render(<StrictMode><Stack /></StrictMode>);
        const openUpper = screen.getByRole('button', { name: 'Open upper' });
        openUpper.focus();
        fireEvent.click(openUpper);
        const removeLower = screen.getByRole('button', { name: 'Remove lower' });
        removeLower.focus();
        fireEvent.click(removeLower);
        expect(removeLower).toHaveFocus();
        fireEvent.keyDown(removeLower, { key: 'Escape' });
        expect(trigger).toHaveFocus();
        expect(document.body.style.overflow).toBe('');
    });

    it('restores the original opener after StrictMode replays an initially open sheet', async () => {
        const trigger = document.createElement('button');
        trigger.dataset.confirmTrigger = 'true';
        document.body.appendChild(trigger);
        trigger.focus();
        function InitiallyOpenSheet() {
            const [open, setOpen] = useState(true);
            return <Sheet open={open} title="Initially open" onOpenChange={setOpen}>
                <button>Sheet action</button>
            </Sheet>;
        }
        render(<StrictMode><InitiallyOpenSheet /></StrictMode>);
        const sheet = await screen.findByRole('dialog', { name: 'Initially open' });
        fireEvent.keyDown(sheet, { key: 'Escape' });
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
        await waitFor(() => expect(trigger).toHaveFocus());
    });
});
