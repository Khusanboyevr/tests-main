"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from "@/lib/firebase-adapter";
import { doc, getDoc } from "@/lib/firebase-adapter";
import { auth, db } from '../lib/firebase';
import { User, Role } from '../types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Fetch user role from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    setUser(userData);
                    // Set a cookie for the middleware
                    document.cookie = `auth-session=true; path=/; max-age=${60 * 60 * 24 * 7}`;
                } else {
                    // Fallback if user doc doesn't exist (e.g. manually added in Firebase Auth)
                    const fallbackUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        role: firebaseUser.email === 'web20100101@gmail.com' || firebaseUser.uid === 'zygdLwQD7vZp1J8Ru4nMvv65gf82' ? 'admin' : 'user',
                        createdAt: new Date().toISOString() as any
                    };
                    setUser(fallbackUser);
                    document.cookie = `auth-session=true; path=/; max-age=${60 * 60 * 24 * 7}`;
                }
            } else {
                setUser(null);
                // Remove cookie
                document.cookie = "auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        if (auth) {
            await auth.signOut();
        }
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
