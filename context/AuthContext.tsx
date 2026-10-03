import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { SubscriptionTier, UserSubscription } from '../types';
import { getFirebaseAuthServices, getFirebaseFirestoreServices, isFirebaseConfigured } from '../lib/firebaseLoader';
import { scheduleWhenIdle } from '../lib/idle';
import { DEFAULT_FREE_SUBSCRIPTION, createLocalDemoSubscription, resolveAuthoritativeSubscription, canGrantDemo } from '../services/entitlementService';
import { AccountDeletionError, clearAccountDeletionLocalState, deleteCloudAccount } from '../services/accountDeletion';
import { resetLocalData } from '../services/localDataReset';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, name?: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
    error: string | null;
    clearError: () => void;
    subscription: UserSubscription;
    upgradeToPro: (tier?: SubscriptionTier) => Promise<void>;
    refreshSubscription: () => Promise<UserSubscription>;
    startDemo: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    deleteAccount: (password: string, opts?: { wipeLocalData?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_FREE_SUBSCRIPTION);

    useEffect(() => {
        if (!isFirebaseConfigured()) {
            console.log('Auth not initialized, skipping auth listener.');
            setLoading(false);
            return;
        }

        let unsubscribe = () => { };
        let cancelled = false;

        const cancelIdle = scheduleWhenIdle(async () => {
            const { auth, authApi } = await getFirebaseAuthServices();
            if (!auth) {
                if (!cancelled) setLoading(false);
                return;
            }

            unsubscribe = authApi.onAuthStateChanged(auth, async (currentUser) => {
                if (cancelled) return;

                setUser(currentUser);
                if (currentUser) {
                    setIsGuest(false);
                    try {
                        const { db, firestoreApi } = await getFirebaseFirestoreServices();
                        if (db) {
                            const subRef = firestoreApi.doc(db, 'users', currentUser.uid, 'data', 'subscription');
                            const subSnap = await firestoreApi.getDoc(subRef);
                            if (!cancelled) {
                                setSubscription(subSnap.exists() ? resolveAuthoritativeSubscription(subSnap.data()) : DEFAULT_FREE_SUBSCRIPTION);
                            }
                        }
                    } catch (e) {
                        console.error('Error fetching subscription', e);
                    }
                } else {
                    setSubscription(DEFAULT_FREE_SUBSCRIPTION);
                }
                if (!cancelled) setLoading(false);
            });
        }, 1200);

        return () => {
            cancelled = true;
            cancelIdle();
            unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string) => {
        setError(null);
        setLoading(true);
        const { auth, authApi } = await getFirebaseAuthServices();
        if (!auth) {
            setError('Authentication service unavailable.');
            setLoading(false);
            return;
        }

        try {
            await authApi.signInWithEmailAndPassword(auth, email, pass);
        } catch (err: any) {
            setLoading(false);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Email or password incorrect.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.message || 'An unknown login error occurred.');
            }
            throw err;
        }
    };

    const startDemo = async () => {
        setError(null);
        if (!canGrantDemo(import.meta.env.DEV)) {
            console.warn('startDemo is disabled in production environments.');
            setError('Demo mode is only available in development.');
            return;
        }
        setLoading(true);
        const [{ auth, authApi }, { db, firestoreApi }] = await Promise.all([
            getFirebaseAuthServices(),
            getFirebaseFirestoreServices(),
        ]);
        if (!auth || !db) {
            setError('Authentication service unavailable.');
            setLoading(false);
            return;
        }

        try {
            const demoEmail = `demo_${Date.now()}@gainslab.app`;
            const demoPass = Math.random().toString(36).substring(2, 10);
            await authApi.createUserWithEmailAndPassword(auth, demoEmail, demoPass);

            const demoSubscription = createLocalDemoSubscription(7);
            setSubscription(demoSubscription);
            setLoading(false);
        } catch (err: any) {
            setError(err.message || 'Could not create demo account.');
            setLoading(false);
            throw err;
        }
    };

    const register = async (email: string, pass: string, name?: string) => {
        setError(null);
        const [{ auth, authApi }] = await Promise.all([
            getFirebaseAuthServices(),
            getFirebaseFirestoreServices(),
        ]);
        if (!auth) {
            setError('Authentication service unavailable.');
            return;
        }
        try {
            const cred = await authApi.createUserWithEmailAndPassword(auth, email, pass);
            if (name) {
                await authApi.updateProfile(cred.user, { displayName: name });
            }
        } catch (err: any) {
            console.error('Register Error:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError(err.message || 'Registration failed');
            }
            throw err;
        }
    };

    const resetPassword = async (email: string) => {
        const { auth, authApi } = await getFirebaseAuthServices();
        if (!auth) return;
        await authApi.sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        const { auth, authApi } = await getFirebaseAuthServices();
        if (auth) {
            await authApi.signOut(auth);
        }
        setUser(null);
        setIsGuest(false);
        setSubscription(DEFAULT_FREE_SUBSCRIPTION);
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        setLoading(false);
        setSubscription(DEFAULT_FREE_SUBSCRIPTION);
    };

    const refreshSubscription = async (): Promise<UserSubscription> => {
        if (!user || !isFirebaseConfigured()) {
            setSubscription(DEFAULT_FREE_SUBSCRIPTION);
            return DEFAULT_FREE_SUBSCRIPTION;
        }

        try {
            const { db, firestoreApi } = await getFirebaseFirestoreServices();
            if (db) {
                const subRef = firestoreApi.doc(db, 'users', user.uid, 'data', 'subscription');
                const subSnap = await firestoreApi.getDoc(subRef);
                const authoritativeSub = subSnap.exists() ? resolveAuthoritativeSubscription(subSnap.data()) : DEFAULT_FREE_SUBSCRIPTION;
                setSubscription(authoritativeSub);
                return authoritativeSub;
            }
        } catch (e) {
            console.error('Error refreshing subscription from server', e);
        }

        return DEFAULT_FREE_SUBSCRIPTION;
    };

    const upgradeToPro = async (_tier?: SubscriptionTier) => {
        // Subscriptions are server-authoritative and provisioned via webhook/backend.
        // Direct client granting is forbidden; we refresh from the server instead.
        console.warn('upgradeToPro: Subscriptions are server-authoritative. Refreshing from server...');
        await refreshSubscription();
    };

    const deleteAccount = async (password: string, opts?: { wipeLocalData?: boolean }) => {
        const currentUser = user;
        if (!currentUser?.email) {
            throw new AccountDeletionError('no-user');
        }
        const [{ auth, authApi }, { db, firestoreApi }] = await Promise.all([
            getFirebaseAuthServices(),
            getFirebaseFirestoreServices(),
        ]);
        if (!auth || !db) {
            throw new AccountDeletionError('unavailable');
        }
        await deleteCloudAccount(currentUser.uid, currentUser.email, password, { auth, authApi, db, firestoreApi });
        await clearAccountDeletionLocalState(currentUser.uid);
        if (opts?.wipeLocalData) {
            await resetLocalData();
        }
        try {
            await authApi.signOut(auth);
        } catch {
            // The user no longer exists server-side; local sign-out is best-effort.
        }
        setUser(null);
        setIsGuest(false);
        setSubscription(DEFAULT_FREE_SUBSCRIPTION);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, isGuest, loading, login, register, logout, continueAsGuest, error, clearError, subscription, upgradeToPro, refreshSubscription, startDemo, resetPassword, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
