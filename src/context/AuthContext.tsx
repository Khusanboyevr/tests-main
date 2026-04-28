
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from "@/lib/firebase-adapter";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "@/lib/firebase-adapter";
import { auth, db } from '../lib/firebase';
import type { User, Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from "@/lib/constants";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    updateCoins: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
    updateCoins: () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                // Fetch user role from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    setUser({ ...userData, coins: userData.coins || 0 });
                    // Set a cookie for the middleware
                    document.cookie = `auth-session=true; path=/; max-age=${60 * 60 * 24 * 7}`;
                } else {
                    const fallbackUser: User = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        name: firebaseUser.displayName || '',
                        role: isAdmin(firebaseUser.email, firebaseUser.uid) ? 'admin' : 'user',
                        coins: 0,
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
        setUser(null);
        document.cookie = "auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };

    const updateCoins = (newBalance: number) => {
        if (user) {
            setUser({ ...user, coins: newBalance });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, updateCoins }}>
            {children}
        </AuthContext.Provider>
    );
};
