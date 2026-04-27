"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { User } from "@/types";
import { Users, Search, Mail, ShieldCheck, Calendar, ShieldAlert, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserWithStats extends User {
    totalTests: number;
    totalScore: number;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                const usersData = snap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() })) as User[];

                const resultsSnap = await getDocs(collection(db, "results"));
                const resultsData = resultsSnap.docs.map((doc: any) => doc.data());

                const usersWithStats = usersData.map(user => {
                    const userResults = resultsData.filter((r: any) => r.userId === user.uid || r.userEmail === user.email);
                    const totalTests = userResults.length;
                    const totalScore = userResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
                    return { ...user, totalTests, totalScore };
                });

                setUsers(usersWithStats as UserWithStats[]);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900 font-display">User Management</h1>
                <p className="text-slate-500 font-medium">Manage and view all registered platform users</p>
            </header>

            {/* Search & Stats */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search users by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 font-bold text-slate-600">
                    <Users size={20} className="text-indigo-600" />
                    <span>{users.length} Registered Users</span>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Statistics</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Joined Date</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}>
                                        <td colSpan={4} className="px-8 py-10 text-center animate-pulse">
                                            <div className="h-4 w-1/3 bg-slate-100 rounded mx-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.length > 0 ? (
                                filteredUsers.map((user, idx) => (
                                    <tr key={user.uid} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 leading-tight">{user.email.split('@')[0]}</span>
                                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                                    ? "bg-rose-50 text-rose-600 border border-rose-100"
                                                    : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                                }`}>
                                                {user.role === 'admin' ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                                                    <BarChart2 className="h-4 w-4 text-indigo-500" />
                                                    {user.totalTests} Tests Taken
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    {user.totalScore} Total correct answers
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 font-medium whitespace-nowrap">
                                                <Calendar className="h-4 w-4 text-slate-300" />
                                                {new Date(user.createdAt?.toDate?.() || Date.now()).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="ml-2 text-sm font-bold text-slate-700">Active</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <p className="text-slate-400 font-medium text-lg">No users found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
