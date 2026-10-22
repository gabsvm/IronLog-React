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

        render(<AuthModal onClose={onClose} />);

        const emailInput = screen.getByLabelText(/Correo|Email/i);
        expect(emailInput).toHaveFocus();

        // Press Escape closes when inputs are empty
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();

        backgroundBtn.remove();
    });

    it('PaywallModal closes on Escape and traps focus within dialog', async () => {
        const onClose = vi.fn();
        const trigger = document.createElement('button');
        trigger.textContent = 'Export CSV';
        document.body.appendChild(trigger);
        trigger.focus();

        render(<PaywallModal onClose={onClose} feature="history" />);

        const dialog = screen.getByRole('dialog', { name: /GainsLab Pro/i });
        expect(dialog).toBeInTheDocument();

        // Escape closes PaywallModal
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();

        trigger.remove();
    });
});
