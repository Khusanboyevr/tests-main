"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Users,
    BarChart2,
    LogOut,
    Menu,
    X,
    Settings,
    Bell,
    Plus
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", href: "/admin" },
        { icon: BookOpen, label: "Subjects", href: "/admin/subjects" },
        { icon: FileText, label: "Tests", href: "/admin/tests" },
        { icon: BarChart2, label: "Results", href: "/admin/results" },
        { icon: Users, label: "Users", href: "/admin/users" },
        { icon: Bell, label: "Stats", href: "/admin/stats" },
    ];

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-3 shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                                <span className="text-white font-bold text-xl">F</span>
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-xl font-bold text-slate-900 block leading-none font-display">FastTest</span>
                                <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold">Admin</span>
                            </div>
                        </Link>
                    </div>

                    <nav className="flex-1 flex justify-center gap-1 mx-8 overflow-x-auto no-scrollbar">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon size={18} className={cn(isActive ? "text-indigo-600" : "text-slate-400")} />
                                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-4 shrink-0">
                        <Link 
                            href="/admin/tests"
                            className="hidden xl:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Plus size={16} />
                            TEST QO'SHISH
                        </Link>
                        
                        <div className="h-8 w-px bg-slate-200 mx-1" />
                        
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Account</p>
                                <p className="text-sm font-extrabold text-slate-900 leading-none">Admin</p>
                            </div>
                            <button
                                onClick={() => logout()}
                                className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-6 md:p-8 flex-1 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
