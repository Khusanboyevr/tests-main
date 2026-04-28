
import { Link } from 'react-router-dom';
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, LayoutDashboard, Settings, ChevronDown, Plus, BarChart2, Clock, Trophy, Coins, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-110 transition-transform">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-display">FastTest</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {user.role === 'admin' && (
                                    <Link
                                        to="/admin"
                                        className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100"
                                    >
                                        <Settings className="h-4 w-4" />
                                        Admin Panel
                                    </Link>
                                )}


                                <Link
                                    to="/leaderboard"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <Trophy className="h-4 w-4" />
                                    Leaderboard
                                </Link>

                                <Link
                                    to="/shop"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    Shop
                                </Link>

                                <Link
                                    to="/results"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <Clock className="h-4 w-4" />
                                    Test History
                                </Link>

                                <Link
                                    to="/dashboard"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboard
                                </Link>

                                    <div className="flex items-center gap-4">
                                        {user && (
                                            <Link to="/shop" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors">
                                                <Coins className="h-4 w-4 text-amber-500" />
                                                <span className="text-sm font-black text-amber-700">{user.coins || 0}</span>
                                            </Link>
                                        )}
                                        
                                        <div className="relative">
                                            <button
                                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                                className="flex items-center gap-2 p-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-all outline-none"
                                            >
                                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold">
                                                    {(user.name || user.email)?.[0].toUpperCase()}
                                                </div>
                                                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            <AnimatePresence>
                                                {isProfileOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 overflow-hidden ring-1 ring-black ring-opacity-5"
                                                    >
                                                        <div className="px-4 py-3 border-b border-slate-50">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{user.name || user.email.split('@')[0]}</p>
                                                            <p className="text-xs font-medium text-slate-400 truncate">{user.email}</p>
                                                        </div>

                                                        <div className="p-1">
                                                            <Link
                                                                to="/dashboard"
                                                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                                                            >
                                                                <User className="h-4 w-4" />
                                                                My Profile
                                                            </Link>
                                                            {user.role === 'admin' && (
                                                                <Link
                                                                    to="/admin"
                                                                    className="flex md:hidden items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors"
                                                                >
                                                                    <Settings className="h-4 w-4" />
                                                                    Admin Panel
                                                                </Link>
                                                            )}
                                                            <button
                                                                onClick={() => logout()}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                            >
                                                                <LogOut className="h-4 w-4" />
                                                                Sign Out
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                                    Log in
                                </Link>
                                <Link to="/register" className="px-5 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all transform hover:scale-105">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
