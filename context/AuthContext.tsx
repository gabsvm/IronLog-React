
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { auth, db } from '../lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    User 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SubscriptionTier, UserSubscription, UserProfile } from '../types';

// Define a default subscription state
const DEFAULT_SUB: UserSubscription = { isPro: false, tier: 'free', expiryDate: null };

// The shape of our Authentication Context
interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isGuest: boolean;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void;
    error: string | null;
    clearError: () => void;
    subscription: UserSubscription;
    upgradeToPro: (tier: SubscriptionTier) => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
                        // Parallel fetch for profile and subscription
                        const userRef = doc(db, "users", currentUser.uid);
                        const subRef = doc(db, "users", currentUser.uid, "data", "subscription");

                        const [userSnap, subSnap] = await Promise.all([
                            getDoc(userRef),
                            getDoc(subRef)
                        ]);

                        if (userSnap.exists()) {
                            setProfile(userSnap.data() as UserProfile);
                        }

                        if (subSnap.exists()) {
                            setSubscription(subSnap.data() as UserSubscription);
                        } else {
                            // If for some reason a user exists without a subscription doc, create it.
                            await setDoc(subRef, DEFAULT_SUB);
                            setSubscription(DEFAULT_SUB);
                        }
                    } catch (e) {
                        console.error("Error fetching user data", e);
                        // Set to default states on error
                        setProfile(null);
                        setSubscription(DEFAULT_SUB);
                    }
                }
            } else {
                // Clear all user-related state on logout
                setIsGuest(false);
                setProfile(null);
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
            return Promise.reject(new Error("Auth unavailable"));
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
        if (!auth || !db) {
            setError("Authentication service unavailable (Config missing).");
            return Promise.reject(new Error("Auth or DB unavailable"));
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const newUser = userCredential.user;

            // ==> NEW: Create user profile and subscription documents in Firestore <==
            const userRef = doc(db, "users", newUser.uid);
            const subRef = doc(db, "users", newUser.uid, "data", "subscription");

            const displayName = email.split('@')[0];
            const userProfileData: UserProfile = {
                email: newUser.email || email,
                displayName: displayName
            };

            // Create both documents in a batch for atomicity
            await Promise.all([
                setDoc(userRef, userProfileData),
                setDoc(subRef, DEFAULT_SUB)
            ]);
            
            // Optimistically set the profile for the new user
            setProfile(userProfileData);

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
        // State clearing is handled by onAuthStateChanged
    };

    const continueAsGuest = () => {
        setUser(null);
        setProfile(null);
        setIsGuest(true);
        setLoading(false);
        setSubscription(DEFAULT_SUB);
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user || !db) return;
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, data, { merge: true });
        // Optimistic update of local state
        setProfile(prev => prev ? { ...prev, ...data } : null);
    };

    const upgradeToPro = async (tier: SubscriptionTier) => {
        if (!user || !db) return;
        
        const newSub: UserSubscription = {
            isPro: true,
            tier: tier,
            expiryDate: tier === 'lifetime' ? null : Date.now() + (tier === 'monthly' ? 2592000000 : 31536000000)
        };
        setSubscription(newSub); // Optimistic UI Update
        const subRef = doc(db, "users", user.uid, "data", "subscription");
        await setDoc(subRef, newSub, { merge: true });
    };

    const clearError = () => setError(null);

    const contextValue = useMemo(() => ({
        user, profile, isGuest, loading, login, register, logout, continueAsGuest, error, clearError, subscription, upgradeToPro, updateProfile
    }), [user, profile, isGuest, loading, error, subscription]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

