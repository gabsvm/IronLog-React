
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

const DEFAULT_SUB: UserSubscription = { isPro: false, tier: 'free', expiryDate: null };

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isGuest: boolean;
    loading: boolean;
    login: (email: string, pass:string) => Promise<void>;
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
    const [loading, setLoading] = useState(true); // Start with loading true
    const [error, setError] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUB);

    useEffect(() => {
        if (!auth) {
            console.log("Auth not initialized, using guest mode.");
            setIsGuest(true);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true); // Set loading true on auth state change
            setUser(currentUser);

            if (currentUser) {
                setIsGuest(false);
                if (db) {
                    try {
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
                            await setDoc(subRef, DEFAULT_SUB);
                            setSubscription(DEFAULT_SUB);
                        }
                    } catch (e) {
                        console.error("Error fetching user data", e);
                        setProfile(null);
                        setSubscription(DEFAULT_SUB);
                    }
                }
            } else {
                // If no user, check local storage if they were a guest before.
                const guestStatus = localStorage.getItem('isGuest');
                if (guestStatus === 'true') {
                    setIsGuest(true);
                } else {
                    setIsGuest(false);
                }
                setProfile(null);
                setSubscription(DEFAULT_SUB);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        setError(null);
        if (!auth) {
            setError("Authentication service unavailable.");
            setLoading(false);
            return Promise.reject(new Error("Auth unavailable"));
        }
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            // State will be updated by onAuthStateChanged, which will set loading to false
        } catch (err: any) {
            console.error("Login Error:", err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Too many attempts. Try again later.");
            } else {
                setError(err.message || "Login failed");
            }
            setLoading(false);
            throw err;
        }
    };

    const register = async (email: string, pass: string) => {
        setLoading(true);
        setError(null);
        if (!auth || !db) {
            setError("Authentication service unavailable.");
            setLoading(false);
            return Promise.reject(new Error("Auth or DB unavailable"));
        }
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const newUser = userCredential.user;

            const userRef = doc(db, "users", newUser.uid);
            const subRef = doc(db, "users", newUser.uid, "data", "subscription");

            const displayName = email.split('@')[0];
            const userProfileData: UserProfile = {
                email: newUser.email || email,
                displayName: displayName,
                 // Initialize optional fitness properties
                experience: 'intermediate',
                goal: 'hypertrophy',
                daysPerWeek: 4,
                sessionDuration: 'medium'
            };

            await Promise.all([
                setDoc(userRef, userProfileData),
                setDoc(subRef, DEFAULT_SUB)
            ]);
            
            setProfile(userProfileData); // Optimistically set profile
            // onAuthStateChanged will handle the rest, including setting loading to false

        } catch (err: any) {
            console.error("Register Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email already in use.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError(err.message || "Registration failed");
            }
            setLoading(false);
            throw err;
        }
    };

    const logout = async () => {
        if (auth) {
            await signOut(auth);
        }
        localStorage.removeItem('isGuest');
        // State clearing is handled by onAuthStateChanged
    };

    const continueAsGuest = () => {
        setUser(null);
        setProfile(null);
        setIsGuest(true);
        localStorage.setItem('isGuest', 'true');
        setLoading(false);
        setSubscription(DEFAULT_SUB);
    };

    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user || !db) return;
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, data, { merge: true });
        setProfile(prev => prev ? { ...prev, ...data } : null);
    };

    const upgradeToPro = async (tier: SubscriptionTier) => {
        if (!user || !db) return;
        
        const newSub: UserSubscription = {
            isPro: true,
            tier: tier,
            expiryDate: tier === 'lifetime' ? null : Date.now() + (tier === 'monthly' ? 2592000000 : 31536000000)
        };
        setSubscription(newSub);
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
