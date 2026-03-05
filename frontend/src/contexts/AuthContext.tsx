import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface AuthContextType {
    user: User | null;
    isEnabled: boolean;
    isLoading: boolean;
    isBlocked: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    setBlocked: (blocked: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await checkAndCreateUserDoc(firebaseUser);
            } else {
                setIsEnabled(false);
                setIsBlocked(false);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const checkAndCreateUserDoc = async (firebaseUser: User) => {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create user document with is_enabled = false
            await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                is_enabled: false,
                created_at: serverTimestamp(),
            });
            setIsEnabled(false);
        } else {
            const data = userSnap.data();
            setIsEnabled(data.is_enabled === true);
        }
    };

    const signInWithGoogle = async () => {
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error('Google sign-in error:', error);
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setIsBlocked(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isEnabled,
                isLoading,
                isBlocked,
                signInWithGoogle,
                signOut,
                setBlocked: setIsBlocked,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
