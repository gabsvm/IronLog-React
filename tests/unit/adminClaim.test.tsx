// Q7: AuthContext.isAdmin from the ID-token claim (or verified owner email),
// with a forced token refresh on login.
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ADMIN_EMAIL, isAdminIdentity } from '../../constants/admin';

const { authBox } = vi.hoisted(() => ({
    authBox: {
        currentUser: null as null | {
            uid: string;
            email: string | null;
            emailVerified: boolean;
            getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }>;
            getIdToken: (force?: boolean) => Promise<string>;
        },
        signIn: vi.fn(async () => {}),
    },
}));

vi.mock('../../lib/firebaseLoader', () => ({
    isFirebaseConfigured: () => true,
    getFirebaseAuthServices: async () => ({
        auth: authBox,
        authApi: {
            onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
                if (authBox.currentUser) cb(authBox.currentUser);
                return () => {};
            },
            signInWithEmailAndPassword: () => authBox.signIn(),
            signOut: vi.fn(async () => {
                authBox.currentUser = null;
            }),
        },
    }),
    getFirebaseFirestoreServices: async () => ({ db: null, firestoreApi: {} }),
}));

import { AuthProvider, useAuth } from '../../context/AuthContext';

const makeUser = (opts: { email: string | null; emailVerified: boolean; adminClaim?: unknown }) => ({
    uid: `uid-${opts.email ?? 'none'}`,
    email: opts.email,
    emailVerified: opts.emailVerified,
    getIdTokenResult: vi.fn(async () => ({
        claims: opts.adminClaim === undefined ? {} : { admin: opts.adminClaim },
    })),
    getIdToken: vi.fn(async (_force?: boolean) => 'token'),
});

const Probe: React.FC = () => {
    const { isAdmin, login } = useAuth();
    return (
        <div>
            <div>admin:{String(isAdmin)}</div>
            <button type="button" onClick={() => void login('e@x.co', 'pw')}>
                do-login
            </button>
        </div>
    );
};

describe('Q7: isAdminIdentity rule', () => {
    it('matches the firestore.rules transition definition', () => {
        expect(isAdminIdentity({ adminClaim: true, email: 'any@x.co', emailVerified: false })).toBe(true);
        expect(isAdminIdentity({ adminClaim: undefined, email: ADMIN_EMAIL, emailVerified: true })).toBe(true);
        expect(isAdminIdentity({ adminClaim: undefined, email: ADMIN_EMAIL, emailVerified: false })).toBe(false);
        expect(isAdminIdentity({ adminClaim: false, email: 'user@x.co', emailVerified: true })).toBe(false);
        expect(isAdminIdentity({ adminClaim: undefined, email: null, emailVerified: false })).toBe(false);
    });
});

describe('Q7: AuthContext exposes isAdmin from the ID token', () => {
    beforeEach(() => {
        authBox.currentUser = null;
        authBox.signIn.mockClear();
    });

    it('is true with the admin custom claim', async () => {
        authBox.currentUser = makeUser({ email: 'boss@corp.co', emailVerified: true, adminClaim: true });
        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );
        expect(await screen.findByText('admin:true')).toBeDefined();
    });

    it('is true for the verified owner email without the claim', async () => {
        authBox.currentUser = makeUser({ email: ADMIN_EMAIL, emailVerified: true });
        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );
        expect(await screen.findByText('admin:true')).toBeDefined();
    });

    it('is false for the owner email without verification', async () => {
        authBox.currentUser = makeUser({ email: ADMIN_EMAIL, emailVerified: false });
        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );
        expect(await screen.findByText('admin:false')).toBeDefined();
    });

    it('is false for a common user', async () => {
        authBox.currentUser = makeUser({ email: 'user@x.co', emailVerified: true });
        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );
        expect(await screen.findByText('admin:false')).toBeDefined();
    });

    it('forces a token refresh on login', async () => {
        const user = makeUser({ email: 'user@x.co', emailVerified: true });
        authBox.currentUser = user;
        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );
        expect(await screen.findByText('admin:false')).toBeDefined();
        fireEvent.click(screen.getByText('do-login'));
        await waitFor(() => expect(user.getIdToken).toHaveBeenCalledWith(true));
    });
});
