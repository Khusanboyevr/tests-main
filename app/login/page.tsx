"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "@/lib/firebase-adapter";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { LogIn, Key, Mail, ChevronRight, Settings, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const router = useRouter();

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
            
            // Basic role verification if in admin mode (simplified for demo)
            if (isAdminMode && email !== 'web20100101@gmail.com' && userCredential?.user?.uid !== 'zygdLwQD7vZp1J8Ru4nMvv65gf82') {
                toast.error("Sizda admin huquqlari yo'q.");
                return;
            }

            // Set cookie for middleware
            document.cookie = `auth-session=${userCredential.user.uid}; path=/; max-age=604800`;

            toast.success(isAdminMode ? "Admin successfully logged in!" : "Successfully logged in!");
            router.push(isAdminMode ? "/admin" : "/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4 relative">
            <Link 
                href="/"
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
                        </form>
                    </div>

                    <div className="px-10 py-8 bg-slate-50/50 border-t border-slate-100 flex flex-col items-center gap-4">
                        {!isAdminMode && (
                            <p className="text-slate-600 font-medium text-sm">
                                Don't have an account?{" "}
                                <Link href="/register" className="text-indigo-600 font-bold hover:underline">
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
