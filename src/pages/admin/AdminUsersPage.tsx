import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import type { User } from "@/types";
import { Users, Search, Mail, ShieldCheck, Calendar, ShieldAlert, BarChart2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UserWithStats extends User {
    totalTests: number;
    totalScore: number;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'user' | 'admin'>('user');
    const [sortBy, setSortBy] = useState<'name' | 'tests' | 'score'>('score');

    const fetchUsers = async () => {
        setLoading(true);
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

            const sorted = usersWithStats.sort((a, b) => b.totalScore - a.totalScore);
            setUsers(sorted as UserWithStats[]);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users
        .filter(u =>
            (u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (u.name || "").toLowerCase().includes(searchTerm.toLowerCase())) && 
            u.role === activeTab
        )
        .sort((a, b) => {
            if (sortBy === 'score') return b.totalScore - a.totalScore;
            if (sortBy === 'tests') return b.totalTests - a.totalTests;
            return (a.name || a.email).localeCompare(b.name || b.email);
        });

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">User Management</h1>
                    <p className="text-slate-500 font-medium">Manage and view all registered platform users</p>
                </div>
            </header>

            {/* Tabs & Stats */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={cn(
                            "flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'user' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Users className="h-4 w-4" />
                        Users ({users.filter(u => u.role === 'user').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('admin')}
                        className={cn(
                            "flex-1 md:flex-none px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'admin' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <ShieldAlert className="h-4 w-4" />
                        Admins ({users.filter(u => u.role === 'admin').length})
                    </button>
                </div>

                <div className="flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Sort by:</span>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-600 cursor-pointer pr-4"
                    >
                        <option value="score">Top Score</option>
                        <option value="tests">Most Tests</option>
                        <option value="name">Name</option>
                    </select>
                </div>

                <div className="flex-1 w-full max-w-md">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}s...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest w-16 text-center">Rank</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Student Details</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Performance</th>
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
                                    <motion.tr 
                                        key={user.uid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-8 py-6 text-center">
                                            <div className={cn(
                                                "h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs mx-auto",
                                                idx === 0 ? "bg-amber-100 text-amber-600" :
                                                idx === 1 ? "bg-slate-100 text-slate-500" :
                                                idx === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                                            )}>
                                                {idx + 1}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg border",
                                                    user.role === 'admin' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                )}>
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 leading-tight">{user.name || user.email.split('@')[0]}</span>
                                                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <select
                                                value={user.role}
                                                onChange={async (e) => {
                                                    const newRole = e.target.value as 'admin' | 'user';
                                                    if (confirm(`Change ${user.email} role to ${newRole}?`)) {
                                                        try {
                                                            await updateDoc(doc(db, "users", user.uid), { role: newRole });
                                                            toast.success("Role updated");
                                                            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
                                                        } catch (err) {
                                                            toast.error("Failed to update role");
                                                        }
                                                    }
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer border transition-all",
                                                    user.role === 'admin' ? "bg-rose-50 text-rose-600 border-rose-100 focus:ring-rose-100" : "bg-indigo-50 text-indigo-600 border-indigo-100 focus:ring-indigo-100"
                                                )}
                                            >
                                                <option value="user">USER</option>
                                                <option value="admin">ADMIN</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 font-bold">
                                                    <BarChart2 className="h-4 w-4 text-indigo-500" />
                                                    {user.totalTests}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                                    {user.totalScore}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="ml-2 text-sm font-bold text-slate-700">Active</span>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="inline-flex h-16 w-16 bg-slate-50 rounded-full items-center justify-center mb-4">
                                            <Users className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-medium">No results found for this category.</p>
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
