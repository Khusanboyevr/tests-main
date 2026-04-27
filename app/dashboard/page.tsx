"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { collection, query, getDocs, orderBy, where, limit } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { Subject, TestResult } from "@/types";
import Link from "next/link";
import { BookOpen, Trophy, Clock, ChevronRight, PlayCircle, BarChart3, AlertCircle, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardPage() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [recentResults, setRecentResults] = useState<TestResult[]>([]);
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Subjects
                const subjectsSnap = await getDocs(query(collection(db, "subjects"), orderBy("createdAt", "desc")));
                const subjectsData = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
                setSubjects(subjectsData);

                // Fetch Recent Results for current user
                if (user) {
                    const resultsQuery = query(
                        collection(db, "results"),
                        where("userId", "==", user.uid),
                        orderBy("createdAt", "desc"),
                        limit(5)
                    );
                    const resultsSnap = await getDocs(resultsQuery);
                    const resultsData = resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TestResult[];
                    setRecentResults(resultsData);

                    // Fetch Leaderboard
                    const usersSnap = await getDocs(collection(db, "users"));
                    const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() as any }));

                    const allResultsSnap = await getDocs(collection(db, "results"));
                    const allResultsData = allResultsSnap.docs.map(doc => doc.data() as any);

                    const usersWithStats = usersData.map(u => {
                        const userResultsList = allResultsData.filter(r => r.userId === u.uid || r.userEmail === u.email);
                        const totalScore = userResultsList.reduce((sum, r) => sum + (r.score || 0), 0);
                        return { ...u, totalScore };
                    });

                    const top = usersWithStats
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .slice(0, 3)
                        .filter(u => u.totalScore > 0);
                    setTopUsers(top);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchData();
    }, [user]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <header className="mb-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <h1 className="text-3xl font-bold text-slate-900 font-display">Student Dashboard</h1>
                            <p className="text-slate-500 mt-1">Welcome back, {user?.email}</p>
                        </motion.div>
                    </header>

                    <div className="grid lg:grid-cols-3 gap-10">
                        {/* Subjects List */}
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-indigo-600" />
                                        Available Subjects
                                    </h2>
                                </div>

                                {loading ? (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                                        ))}
                                    </div>
                                ) : subjects.length > 0 ? (
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {subjects.map((subject, index) => (
                                            <motion.div
                                                key={subject.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group"
                                            >
                                                <div>
                                                    <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <BookOpen className="h-5 w-5 text-indigo-600" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{subject.title}</h3>
                                                    <p className="text-sm text-slate-500 line-clamp-2 mb-6">{subject.description}</p>
                                                </div>
                                                <Link
                                                    href={`/test/${subject.id}`}
                                                    className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors group/btn"
                                                >
                                                    <PlayCircle className="h-4 w-4" />
                                                    Start Quiz
                                                    <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                            <AlertCircle className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No subjects available yet.</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-8">
                            {/* Leaderboard Card */}
                            <section>
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-1 relative overflow-hidden shadow-xl shadow-indigo-200">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Trophy size={80} />
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-[28px] p-6 border border-white/20">
                                        <div className="flex items-center gap-3 mb-6 text-white relative z-10">
                                            <div className="p-3 bg-white/20 rounded-xl">
                                                <Trophy className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold font-display leading-tight">Top Performers</h2>
                                                <p className="text-indigo-100 text-xs font-medium">Overall Leaderboard</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            {loading ? (
                                                [1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)
                                            ) : topUsers.length > 0 ? (
                                                topUsers.map((u, idx) => (
                                                    <div key={u.uid} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm relative group overflow-hidden">
                                                        <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                                                            idx === 0 ? "bg-amber-100 text-amber-500 border-amber-200" :
                                                            idx === 1 ? "bg-slate-100 text-slate-500 border-slate-200" :
                                                            "bg-orange-100 text-orange-500 border-orange-200"
                                                        }`}>
                                                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-slate-900 truncate text-sm">
                                                                {u.email.split('@')[0]}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mt-0.5">
                                                                <Star size={12} className="fill-indigo-600" />
                                                                {u.totalScore} Points
                                                            </div>
                                                        </div>
                                                        <div className="text-xl font-black text-slate-200">
                                                            #{idx + 1}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="bg-white/10 rounded-xl p-6 text-center border border-white/10">
                                                    <p className="text-indigo-100 text-sm font-medium">No results recorded yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        Recent Results
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {loading ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
                                        ))
                                    ) : recentResults.length > 0 ? (
                                        recentResults.map((result, index) => (
                                            <motion.div
                                                key={result.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-200 transition-colors"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{result.subjectId}</p>
                                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                                            {new Date(result.createdAt?.toDate?.() || Date.now()).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${(result.score / result.total) >= 0.7
                                                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                                            : "bg-amber-50 text-amber-600 border border-amber-100"
                                                        }`}>
                                                        {result.score}/{result.total}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                    <span className="flex items-center gap-1.5 font-bold text-indigo-600">
                                                        {Math.round((result.score / result.total) * 100)}%
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                                            <p className="text-sm text-slate-400">No results found.</p>
                                        </div>
                                    )}

                                    {recentResults.length > 0 && (
                                        <Link href="/results" className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 py-2">
                                            View all results
                                        </Link>
                                    )}
                                </div>
                            </section>

                            {/* Quick Stats Summary */}
                            {!loading && recentResults.length > 0 && (
                                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                                            <BarChart3 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">Performance</h4>
                                            <p className="text-indigo-200 text-xs">Based on latest tests</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-indigo-200">Average Proficiency</span>
                                                <span className="font-bold">
                                                    {Math.round(recentResults.reduce((acc, r) => acc + (r.score / r.total), 0) / recentResults.length * 100)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${recentResults.reduce((acc, r) => acc + (r.score / r.total), 0) / recentResults.length * 100}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-white rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
