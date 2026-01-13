
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    User 
} from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    isGuest: boolean; // New: Track if user chose offline mode
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    continueAsGuest: () => void; // New: Method to bypass auth
    error: string | null;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!auth) {
            console.log("Auth not initialized, skipping auth listener.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) setIsGuest(false); // Reset guest if logged in
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
        setIsGuest(false); // Reset to allow login again if needed
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        setLoading(false);
    };

    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{ user, isGuest, loading, login, register, logout, continueAsGuest, error, clearError }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
