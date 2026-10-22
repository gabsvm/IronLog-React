import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthModal } from '../../components/auth/AuthModal';
import { PaywallModal } from '../../components/pro/PaywallModal';

afterEach(() => {
    cleanup();
});

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: vi.fn(),
        register: vi.fn(),
        error: null,
        clearError: vi.fn(),
        continueAsGuest: vi.fn(),
        startDemo: vi.fn(),
        resetPassword: vi.fn(),
        user: null,
    }),
}));

// Mock AppContext
vi.mock('../../context/AppContext', () => ({
    useAppPreferences: () => ({ lang: 'es' }),
    useApp: () => ({ lang: 'es' }),
}));

describe('AuthModal and PaywallModal accessibility and overlay layer contract', () => {
    it('AuthModal traps Tab and Shift+Tab within the dialog and closes on Escape', async () => {
        const onClose = vi.fn();
        const backgroundBtn = document.createElement('button');
        backgroundBtn.textContent = 'Opciones del plan';
        document.body.appendChild(backgroundBtn);
        backgroundBtn.focus();

        const { unmount } = render(<AuthModal onClose={onClose} />);

        const emailInput = screen.getByLabelText(/Correo|Email/i);
        expect(emailInput).toHaveFocus();

        // Tab cycles inside the dialog and never reaches the background trigger.
        fireEvent.keyDown(document, { key: 'Tab' });
        expect(document.activeElement).not.toBe(backgroundBtn);
        expect(screen.getByRole('dialog', { name: /Iniciar|Sign/i }).contains(document.activeElement)).toBe(true);
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        expect(document.activeElement).not.toBe(backgroundBtn);
        expect(screen.getByRole('dialog', { name: /Iniciar|Sign/i }).contains(document.activeElement)).toBe(true);

        // Press Escape closes when inputs are empty and restores the trigger.
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
        unmount();
        expect(backgroundBtn).toHaveFocus();

        backgroundBtn.remove();
    });

    it('PaywallModal closes on Escape and traps focus within dialog', async () => {
        const onClose = vi.fn();
        const trigger = document.createElement('button');
        trigger.textContent = 'Export CSV';
        document.body.appendChild(trigger);
        trigger.focus();

        const { unmount } = render(<PaywallModal onClose={onClose} feature="history" />);

        const dialog = screen.getByRole('dialog', { name: /GainsLab Pro/i });
        expect(dialog).toBeInTheDocument();

        // Tab stays inside the paywall dialog.
        fireEvent.keyDown(document, { key: 'Tab' });
        expect(dialog.contains(document.activeElement)).toBe(true);

        // Escape closes PaywallModal and restores the trigger.
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
        unmount();
        expect(trigger).toHaveFocus();

        trigger.remove();
    });
});
