
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SubscriptionTier, UserSubscription } from '../types';

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
    // PRO Features
    subscription: UserSubscription;
    upgradeToPro: (tier: SubscriptionTier) => Promise<void>;
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
                // Fetch Subscription Status from Firestore
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
        setLoading(true);
        if (!auth || !db) {
            setError("Authentication service unavailable.");
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential') {
                console.log("Invalid credentials. Attempting to create a 7-day demo account.");
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                    const newUser = userCredential.user;

                    const expiryDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in ms
                    const demoSubscription: UserSubscription = {
                        isPro: true,
                        tier: 'demo',
                        expiryDate: expiryDate,
                    };

                    const subRef = doc(db, "users", newUser.uid, "data", "subscription");
                    await setDoc(subRef, demoSubscription);

                    // Optimistic update for immediate feedback in UI
                    setSubscription(demoSubscription);
                    console.log(`✅ Created 7-day demo for ${email}`);
                    // onAuthStateChanged will handle setting the user and loading state
                } catch (creationError: any) {
                    setLoading(false); // Stop loading on creation error
                    if (creationError.code === 'auth/email-already-in-use') {
                        setError("Incorrect password.");
                    } else if (creationError.code === 'auth/weak-password') {
                        setError("Password must be at least 6 characters for a demo account.");
                    } else {
                        setError(creationError.message || "Could not create demo account.");
                    }
                    throw creationError; // Re-throw to signal login failure to UI
                }
            } else if (err.code === 'auth/too-many-requests') {
                setError("Too many attempts. Please try again later.");
                setLoading(false);
                throw err;
            } else {
                setError(err.message || "An unknown login error occurred.");
                setLoading(false);
                throw err;
            }
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

    const upgradeToPro = async (tier: SubscriptionTier) => {
        if (!user || !db) return;
        
        const newSub: UserSubscription = {
            isPro: true,
            tier: tier,
            expiryDate: tier === 'lifetime' ? null : Date.now() + (tier === 'monthly' ? 2592000000 : 31536000000)
        };

        // Optimistic UI Update
        setSubscription(newSub);

        // Persist to DB
        try {
            const subRef = doc(db, "users", user.uid, "data", "subscription");
            await setDoc(subRef, newSub, { merge: true });
        } catch (e) {
            console.error("Failed to save subscription", e);
            // Rollback if needed
        }
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, isGuest, loading, login, register, logout, continueAsGuest, error, clearError, subscription, upgradeToPro }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
