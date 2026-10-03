import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { firebaseFakes, deletionSpies, resetSpy } = vi.hoisted(() => ({
    firebaseFakes: {
        user: { uid: 'uid-9', email: 'del@test.app' },
        signOut: vi.fn(async () => {}),
    },
    deletionSpies: {
        deleteCloudAccount: vi.fn(async () => {}),
        clearLocal: vi.fn(async () => {}),
    },
    resetSpy: { fn: vi.fn(async () => {}) },
}));

vi.mock('../../lib/firebaseLoader', () => ({
    isFirebaseConfigured: () => true,
    getFirebaseAuthServices: async () => ({
        auth: { currentUser: firebaseFakes.user },
        authApi: {
            onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
                cb(firebaseFakes.user);
                return () => {};
            },
            signOut: firebaseFakes.signOut,
        },
    }),
    getFirebaseFirestoreServices: async () => ({
        db: { fakeDb: true },
        firestoreApi: {
            doc: () => ({}),
            getDoc: async () => ({ exists: () => false }),
        },
    }),
}));

vi.mock('../../services/accountDeletion', async (importOriginal) => {
    const original = await importOriginal<typeof import('../../services/accountDeletion')>();
    return {
        ...original,
        deleteCloudAccount: deletionSpies.deleteCloudAccount,
        clearAccountDeletionLocalState: deletionSpies.clearLocal,
    };
});

vi.mock('../../services/localDataReset', () => ({
    resetLocalData: () => resetSpy.fn(),
}));

import { AuthProvider, useAuth } from '../../context/AuthContext';

const Probe: React.FC<{ wipe: boolean }> = ({ wipe }) => {
    const { user, loading, deleteAccount } = useAuth();
    return (
        <div>
            <div>loading:{String(loading)}</div>
            <div>user:{user ? user.email : 'none'}</div>
            <button type="button" onClick={() => void deleteAccount('pw', { wipeLocalData: wipe })}>
                wipe-{String(wipe)}
            </button>
        </div>
    );
};

describe('N3: AuthContext.deleteAccount orchestrates cloud wipe, local cleanup and sign-out', () => {
    it('wipes local device data only when the checkbox flag is set, then signs out of the UI', async () => {
        deletionSpies.deleteCloudAccount.mockClear();
        deletionSpies.clearLocal.mockClear();
        resetSpy.fn.mockClear();
        firebaseFakes.signOut.mockClear();

        render(
            <AuthProvider>
                <Probe wipe={true} />
            </AuthProvider>
        );

        await waitFor(() => expect(screen.getByText('user:del@test.app')).toBeDefined());
        fireEvent.click(screen.getByRole('button', { name: 'wipe-true' }));

        await waitFor(() => expect(deletionSpies.deleteCloudAccount).toHaveBeenCalled());
        expect(deletionSpies.deleteCloudAccount.mock.calls[0].slice(0, 3)).toEqual(['uid-9', 'del@test.app', 'pw']);
        expect(deletionSpies.clearLocal).toHaveBeenCalledWith('uid-9');
        expect(resetSpy.fn).toHaveBeenCalled();
        await waitFor(() => expect(screen.getByText('user:none')).toBeDefined());
    });

    it('keeps device training data when the flag is off', async () => {
        deletionSpies.deleteCloudAccount.mockClear();
        resetSpy.fn.mockClear();

        render(
            <AuthProvider>
                <Probe wipe={false} />
            </AuthProvider>
        );

        await waitFor(() => expect(screen.getByText('user:del@test.app')).toBeDefined());
        fireEvent.click(screen.getByRole('button', { name: 'wipe-false' }));

        await waitFor(() => expect(deletionSpies.deleteCloudAccount).toHaveBeenCalled());
        expect(resetSpy.fn).not.toHaveBeenCalled();
    });
});
