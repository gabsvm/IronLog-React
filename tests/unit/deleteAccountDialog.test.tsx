import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AccountDeletionError } from '../../services/accountDeletion';

const { deleteAccountMock } = vi.hoisted(() => ({
    deleteAccountMock: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ deleteAccount: deleteAccountMock }),
}));

vi.mock('../../context/AppContext', () => ({
    useAppPreferences: () => ({ lang: 'es', setLang: vi.fn() }),
}));

import { DeleteAccountDialog } from '../../components/profile/DeleteAccountDialog';

describe('N3: DeleteAccountDialog enables deletion only with password + typed confirmation', () => {
    beforeEach(() => {
        deleteAccountMock.mockReset();
        deleteAccountMock.mockResolvedValue(undefined);
    });

    const renderDialog = (isPro = false) =>
        render(<DeleteAccountDialog open={true} onClose={vi.fn()} onDeleted={vi.fn()} isPro={isPro} />);

    it('renders as an alertdialog and keeps delete disabled until password and ELIMINAR are present', () => {
        renderDialog();

        const dialog = screen.getByRole('alertdialog');
        expect(dialog).toBeDefined();
        const deleteButton = screen.getByRole('button', { name: /eliminar mi cuenta/i });
        expect((deleteButton as HTMLButtonElement).disabled).toBe(true);

        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } });
        expect((deleteButton as HTMLButtonElement).disabled).toBe(true);

        fireEvent.change(screen.getByLabelText(/escribí eliminar/i), { target: { value: 'ELIMINA' } });
        expect((deleteButton as HTMLButtonElement).disabled).toBe(true);

        fireEvent.change(screen.getByLabelText(/escribí eliminar/i), { target: { value: 'ELIMINAR' } });
        expect((deleteButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('calls deleteAccount with the password and the wipe-local choice, then reports deletion', async () => {
        const onDeleted = vi.fn();
        render(<DeleteAccountDialog open={true} onClose={vi.fn()} onDeleted={onDeleted} isPro={false} />);

        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } });
        fireEvent.change(screen.getByLabelText(/escribí eliminar/i), { target: { value: 'ELIMINAR' } });
        fireEvent.click(screen.getByLabelText(/también borrar los datos de este dispositivo/i));
        fireEvent.click(screen.getByRole('button', { name: /eliminar mi cuenta/i }));

        await waitFor(() => expect(deleteAccountMock).toHaveBeenCalledWith('secret', { wipeLocalData: true }));
        await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    });

    it('passes wipeLocalData false when the checkbox is off', async () => {
        renderDialog();

        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } });
        fireEvent.change(screen.getByLabelText(/escribí eliminar/i), { target: { value: 'ELIMINAR' } });
        fireEvent.click(screen.getByRole('button', { name: /eliminar mi cuenta/i }));

        await waitFor(() => expect(deleteAccountMock).toHaveBeenCalledWith('secret', { wipeLocalData: false }));
    });

    it('shows the translated error and stays open when deletion fails', async () => {
        deleteAccountMock.mockRejectedValueOnce(new AccountDeletionError('wrong-password'));
        const onDeleted = vi.fn();
        render(<DeleteAccountDialog open={true} onClose={vi.fn()} onDeleted={onDeleted} isPro={false} />);

        fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'wrong' } });
        fireEvent.change(screen.getByLabelText(/escribí eliminar/i), { target: { value: 'ELIMINAR' } });
        fireEvent.click(screen.getByRole('button', { name: /eliminar mi cuenta/i }));

        expect(await screen.findByText(/contraseña incorrecta/i)).toBeDefined();
        expect(screen.getByRole('alertdialog')).toBeDefined();
        expect(onDeleted).not.toHaveBeenCalled();
    });

    it('emphasizes the Pro loss warning for Pro members only', () => {
        const { unmount } = renderDialog(true);
        expect(screen.getByText(/suscripción pro.*se perderá/i)).toBeDefined();
        unmount();

        renderDialog(false);
        expect(screen.queryByText(/suscripción pro.*se perderá/i)).toBeNull();
    });

    it('renders nothing when closed', () => {
        render(<DeleteAccountDialog open={false} onClose={vi.fn()} onDeleted={vi.fn()} isPro={false} />);
        expect(screen.queryByRole('alertdialog')).toBeNull();
    });
});
