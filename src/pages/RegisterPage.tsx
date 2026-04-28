
import { useState } from "react";
import { createUserWithEmailAndPassword } from "@/lib/firebase-adapter";
import { doc, setDoc, serverTimestamp, signInWithPopup, GoogleAuthProvider } from "@/lib/firebase-adapter";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { UserPlus, Key, Mail, ChevronRight, User } from "lucide-react";
import { motion } from "framer-motion";
import { isAdmin } from "@/lib/constants";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!auth || !db) {
                throw new Error("Firebase is not configured. Please check your environment variables.");
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const role = isAdmin(email, user.uid) ? "admin" : "user";

            // Save user profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                name: name || user.displayName || email.split('@')[0],
                role: role,
                createdAt: serverTimestamp(),
            });

            toast.success("Account created successfully!");
            navigate("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                    <div className="p-8">
                        <div className="flex justify-center mb-6">
                            <div className="h-14 w-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                <UserPlus className="text-white h-7 w-7" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-center text-slate-900 mb-2 font-display">Create Account</h1>
                        <p className="text-center text-slate-500 mb-8">Join us and start your learning journey</p>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 ml-1">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="name@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 ml-1">Password</label>
                                <div className="relative group">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ChevronRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-400 font-bold tracking-widest leading-none">Or continue with</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const provider = new GoogleAuthProvider();
                                        provider.setCustomParameters({ prompt: 'select_account' });
                                        const result = await signInWithPopup(auth, provider);
                                        const user = result.user;
                                        
                                        // Save/Update user in Firestore
                                        const role = isAdmin(user.email, user.uid) ? "admin" : "user";
                                        
                                        await setDoc(doc(db, "users", user.uid), {
                                            uid: user.uid,
                                            email: user.email,
                                            name: user.displayName || user.email?.split('@')[0],
                                            role: role,
                                            createdAt: serverTimestamp(),
                                        }, { merge: true });

                                        toast.success("Google Login successful!");
                                        navigate("/dashboard");
                                    } catch (err: any) {
                                        if (err.code === 'auth/popup-closed-by-user') {
                                            toast.error("Google oynasi yopildi. Davom etish uchun iltimos qaytadan urinib ko'ring.", {
                                                icon: 'ℹ️'
                                            });
                                        } else {
                                            toast.error(err.message || "Google login failed");
                                        }
                                    }
                                }}
                                className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                        </form>
                    </div>

                    <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-slate-600">
                            Already have an account?{" "}
                            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
