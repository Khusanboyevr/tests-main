
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { collection, getDocs } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { Trophy, Star, Medal, User, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
    uid: string;
    name: string;
    email: string;
    totalScore: number;
    testsTaken: number;
    avgAccuracy: number;
}

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Fetch all users and results
                const [usersSnap, resultsSnap] = await Promise.all([
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "results"))
                ]);

                const usersData = usersSnap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));
                const allResults = resultsSnap.docs.map((doc: any) => doc.data());

                const leaderboardData = usersData.map((u: any) => {
                    const userResults = allResults.filter((r: any) => r.userId === u.uid);
                    const totalScore = userResults.reduce((sum, r) => sum + (r.score || 0), 0);
                    const testsTaken = userResults.length;
                    const totalPossible = userResults.reduce((sum, r) => sum + (r.total || 0), 0);
                    const avgAccuracy = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;

                    return {
                        uid: u.uid,
                        name: u.name || u.email.split('@')[0],
                        email: u.email,
                        totalScore,
                        testsTaken,
                        avgAccuracy
                    };
                });

                // Sort by total score, then by accuracy
                const sorted = leaderboardData
                    .filter(e => e.testsTaken > 0)
                    .sort((a, b) => b.totalScore - a.totalScore || b.avgAccuracy - a.avgAccuracy);

                setEntries(sorted);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <header className="mb-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-4"
                        >
                            <Trophy size={16} />
                            Overall Rankings
                        </motion.div>
                        <h1 className="text-4xl font-black text-slate-900 font-display mb-4">Leaderboard</h1>
                        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                            See how you compare with others across the platform. Top performers are ranked by total points earned.
                        </p>
                    </header>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : entries.length > 0 ? (
                        <div className="space-y-6">
                            {/* Top 3 Podium */}
                            <div className="grid md:grid-cols-3 gap-6 mb-12">
                                {[1, 0, 2].map((idx) => {
                                    const entry = entries[idx];
                                    if (!entry) return null;
                                    return (
                                        <motion.div
                                            key={entry.uid}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={cn(
                                                "relative p-8 rounded-[2.5rem] border-2 text-center group",
                                                idx === 0 ? "bg-gradient-to-b from-amber-50 to-white border-amber-200 order-first md:order-none md:scale-110 z-10 shadow-xl shadow-amber-100/50" :
                                                idx === 1 ? "bg-white border-slate-200" : "bg-white border-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg group-hover:scale-110 transition-transform",
                                                idx === 0 ? "bg-amber-100 ring-4 ring-amber-50" :
                                                idx === 1 ? "bg-slate-100 ring-4 ring-slate-50" : "bg-orange-100 ring-4 ring-orange-50"
                                            )}>
                                                {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 mb-1 truncate px-2">{entry.name}</h3>
                                            <p className="text-sm text-slate-400 font-medium mb-6">{entry.email}</p>
                                            
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Points</p>
                                                    <p className="text-2xl font-black text-indigo-600">{entry.totalScore}</p>
                                                </div>
                                                <div className="h-8 w-px bg-slate-100" />
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                                                    <p className="text-2xl font-black text-slate-900">{Math.round(entry.avgAccuracy)}%</p>
                                                </div>
                                            </div>

                                            <div className="absolute -top-3 -right-3 h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-sm">
                                                #{idx + 1}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Rest of the List */}
                            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <div className="col-span-1">Rank</div>
                                    <div className="col-span-5">Student</div>
                                    <div className="col-span-2 text-center">Tests</div>
                                    <div className="col-span-2 text-center">Accuracy</div>
                                    <div className="col-span-2 text-right">Total Score</div>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {entries.slice(3).map((entry, idx) => (
                                        <div key={entry.uid} className="grid md:grid-cols-12 gap-4 px-8 py-6 hover:bg-slate-50 transition-colors items-center">
                                            <div className="col-span-1 font-bold text-slate-400">#{idx + 4}</div>
                                            <div className="col-span-5 flex items-center gap-4">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold uppercase">
                                                    {entry.name[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-900 truncate">{entry.name}</p>
                                                    <p className="text-xs text-slate-400 truncate font-medium">{entry.email}</p>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-slate-600 font-bold">
                                                    <FileText size={14} className="text-slate-300" />
                                                    {entry.testsTaken}
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-600 rounded-lg font-bold text-sm">
                                                    <TrendingUp size={14} className="text-slate-300" />
                                                    {Math.round(entry.avgAccuracy)}%
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <div className="text-xl font-black text-slate-900">{entry.totalScore}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <Star size={48} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No results recorded yet. Be the first!</p>
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}

import { FileText } from "lucide-react";
