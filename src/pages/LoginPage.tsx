
import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, doc, setDoc, serverTimestamp } from "@/lib/firebase-adapter";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { LogIn, Key, Mail, ChevronRight, Settings, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { isAdmin } from "@/lib/constants";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await performLogin(email, password);
    };

    const performLogin = async (email: string, pass: string) => {
        setLoading(true);
        try {
            if (!auth) {
                throw new Error("Firebase is not configured.");
            }
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            
            // Verify if user is admin
            const isUserAdmin = isAdmin(email, userCredential.user.uid);
            const role = isUserAdmin ? "admin" : "user";
            
            if (isAdminMode && !isUserAdmin) {
                toast.error("Sizda admin huquqlari yo'q.");
                return;
            }

            // Sync role to Firestore
            await setDoc(doc(db, "users", userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                role: role,
            }, { merge: true });

            // Set cookie for middleware
            document.cookie = `auth-session=${userCredential.user.uid}; path=/; max-age=604800`;

            toast.success(isAdminMode ? "Admin successfully logged in!" : "Successfully logged in!");
            navigate(isAdminMode ? "/admin" : "/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 relative">
            <Link 
                to="/"
                className="absolute top-6 left-6 md:top-10 md:left-10 p-4 bg-white text-slate-500 rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center group z-10"
                title="Bosh sahifaga qaytish"
            >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" strokeWidth={2.5} />
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className={cn(
                    "bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border transition-all duration-500",
                    isAdminMode ? "border-indigo-500/50 shadow-indigo-100" : "border-slate-100 shadow-slate-200"
                )}>
                    <div className="p-10">
                        <div className="flex justify-center mb-8">
                            <motion.div 
                                animate={{ rotate: isAdminMode ? 180 : 0 }}
                                className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                                    isAdminMode ? "bg-slate-900 shadow-slate-200" : "bg-indigo-600 shadow-indigo-200"
                                )}
                            >
                                {isAdminMode ? <Settings className="text-white h-8 w-8" /> : <LogIn className="text-white h-8 w-8" />}
                            </motion.div>
                        </div>

                        <h1 className="text-4xl font-black text-center text-slate-900 mb-2 font-display">
                            {isAdminMode ? "Admin Portal" : "Welcome Back"}
                        </h1>
                        <p className="text-center text-slate-500 mb-10 font-medium">
                            {isAdminMode ? "Manage your test infrastructure" : "Login to access your tests and results"}
                        </p>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none font-medium"
                                        placeholder="web20100101@gmail.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none font-medium"
                                        placeholder="••••••••"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none transition-colors"
                                    >
                                        {showPassword ? <EyeOff strokeWidth={2.5} size={18} /> : <Eye strokeWidth={2.5} size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70",
                                    isAdminMode ? "bg-slate-900 shadow-slate-200" : "bg-indigo-600 shadow-indigo-200"
                                )}
                            >
                                {loading ? (
                                    <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isAdminMode ? "Enter Dashboard" : "Sign In"}
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
                                        
                                        // Save/Update user in Firestore (sync role/name)
                                        const role = isAdmin(user.email, user.uid) ? "admin" : "user";
                                        
                                        await setDoc(doc(db, "users", user.uid), {
                                            uid: user.uid,
                                            email: user.email,
                                            name: user.displayName || user.email?.split('@')[0],
                                            role: role,
                                            createdAt: serverTimestamp(),
                                        }, { merge: true });

                                        // Set cookie for middleware
                                        document.cookie = `auth-session=${user.uid}; path=/; max-age=604800`;

                                        toast.success("Google Login successful!");
                                        navigate(isAdminMode && role === 'admin' ? "/admin" : "/dashboard");
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
                                className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
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

                    <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col items-center gap-4">
                        {!isAdminMode && (
                            <p className="text-slate-600 font-medium text-sm">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        )}
                        
                        <button 
                            onClick={() => setIsAdminMode(!isAdminMode)}
                            className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            <Settings size={14} />
                            {isAdminMode ? "Go back to Student Login" : "Admin bo'limiga kirish"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
