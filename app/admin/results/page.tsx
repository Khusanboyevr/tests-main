"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { Award, User, BookOpen, Clock, Calendar, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Result {
    id: string;
    userId: string;
    userEmail: string;
    subjectId: string;
    subjectTitle: string;
    score: number;
    totalQuestions: number;
    createdAt: any;
}

export default function AdminResults() {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const resultsSnap = await getDocs(query(collection(db, "results"), orderBy("createdAt", "desc")));
                const resultsData = resultsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Result[];
                setResults(resultsData);
            } catch (error) {
                console.error("Error fetching results:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, []);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900 font-display">Recent Results</h1>
                <p className="text-slate-500 font-medium">Monitoring student performance and test activity</p>
            </header>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Percentage</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : results.length > 0 ? (
                                results.map((result, idx) => (
                                    <motion.tr 
                                        key={result.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                    {result.userEmail?.[0].toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{result.userEmail?.split('@')[0] || "Unknown"}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{result.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <BookOpen size={16} className="text-slate-400" />
                                                <span className="text-sm font-semibold text-slate-700">{result.subjectTitle}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-900">{result.score}</span>
                                                <span className="text-xs text-slate-400">/ {result.totalQuestions}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {(() => {
                                                const percent = Math.round((result.score / result.totalQuestions) * 100);
                                                return (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${percent >= 70 ? 'bg-emerald-500' : percent >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                        <span className={`text-xs font-bold ${percent >= 70 ? 'text-emerald-600' : percent >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {percent}%
                                                        </span>
                                                    </div>
                                                )
                                            })()}
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar size={14} />
                                                <span className="text-xs font-medium">
                                                    {result.createdAt?.toDate ? result.createdAt.toDate().toLocaleDateString() : new Date(result.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                                        No test results found yet.
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
