
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    User 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserSubscription } from '../types';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
    error: string | null;
    clearError: () => void;
    subscription: UserSubscription;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SUB: UserSubscription = { isPro: false, tier: 'free', expiryDate: null };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUB);

    useEffect(() => {
        if (!auth) {
            console.log("Auth not initialized, skipping auth listener.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                setIsGuest(false);
                if (db) {
                    try {
                        const subRef = doc(db, "users", currentUser.uid, "data", "subscription");
                        const subSnap = await getDoc(subRef);
                        if (subSnap.exists()) {
                            setSubscription(subSnap.data() as UserSubscription);
                        } else {
                            setSubscription(DEFAULT_SUB);
                        }
                    } catch (e) {
                        console.error("Error fetching subscription", e);
                    }
                }
            } else {
                setSubscription(DEFAULT_SUB);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        setError(null);
        if (!auth) {
            setError("Authentication service unavailable (Config missing).");
            return;
        }
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Too many attempts. Try again later.");
            } else {
                setError(err.message || "Login failed");
            }
            throw err;
        }
    };

    const register = async (email: string, pass: string) => {
        setError(null);
        if (!auth) {
            setError("Authentication service unavailable (Config missing).");
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } catch (err: any) {
            console.error("Register Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message || "Registration failed");
            }
            throw err;
        }
    };

    const logout = async () => {
        if (auth) {
            await signOut(auth);
        }
        setUser(null);
        setIsGuest(false);
        setSubscription(DEFAULT_SUB);
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        setLoading(false);
        setSubscription(DEFAULT_SUB);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, isGuest, loading, login, register, logout, continueAsGuest, error, clearError, subscription }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
