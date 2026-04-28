
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { collection, query, getDocs, orderBy, where } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { toast } from "react-hot-toast";
import type { TestResult } from "@/types";
import { Trophy, Clock, Calendar, ChevronLeft, Award, FileText, ArrowRight, ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ResultsHistoryPage() {
    const { user } = useAuth();
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (!user) return;
            try {
                const q = query(
                    collection(db, "results"),
                    where("userId", "==", user.uid)
                );
                const querySnapshot = await getDocs(q);
                const resultsData = querySnapshot.docs.map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                })) as TestResult[];
                
                // Sort by date in frontend to avoid mandatory composite index
                resultsData.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                    return dateB.getTime() - dateA.getTime();
                });
                
                setResults(resultsData);
            } catch (error: any) {
                console.error("Error fetching results:", error);
                toast.error(`Natijalarni yuklashda xatolik: ${error.message || "Noma'lum xato"}`);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [user]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
                            <ChevronLeft size={20} />
                            Back to Dashboard
                        </Link>
                    </div>

                    <header className="mb-12">
                        <h1 className="text-4xl font-extrabold text-slate-900 font-display mb-2">My Test History</h1>
                        <p className="text-lg text-slate-500">Review your performance across all subjects.</p>
                    </header>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                            ))}
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-6">
                            {results.map((result, index) => (
                                <motion.div
                                    key={result.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all group"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="h-14 w-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Award size={28} className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-1 capitalize flex items-center gap-2">
                                                    {result.subjectTitle || result.subjectId?.replace(/-/g, ' ')}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar size={14} />
                                                        {new Date(result.createdAt?.toDate?.() || result.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock size={14} />
                                                        {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Score</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-slate-900">{result.score}</span>
                                                    <span className="text-sm font-bold text-slate-400">/ {result.total}</span>
                                                </div>
                                            </div>

                                            <div className="h-12 w-px bg-slate-100 hidden md:block" />

                                            <div className="relative h-16 w-16 shrink-0">
                                                <svg className="h-full w-full" viewBox="0 0 36 36">
                                                    <path
                                                        className="text-slate-100"
                                                        strokeDasharray="100, 100"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                    <path
                                                        className={(result.score / result.total) >= 0.7 ? "text-emerald-500" : (result.score / result.total) >= 0.4 ? "text-amber-500" : "text-rose-500"}
                                                        strokeDasharray={`${(result.score / result.total) * 100}, 100`}
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {Math.round((result.score / result.total) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {result.detailedResults && (
                                                <button 
                                                    onClick={() => setExpandedId(expandedId === result.id ? null : result.id!)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors shrink-0"
                                                >
                                                    <ChevronDown className={cn("h-6 w-6 transition-transform", expandedId === result.id && "rotate-180")} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedId === result.id && result.detailedResults && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                                                    <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                        <FileText className="h-5 w-5 text-indigo-500" /> 
                                                        Testning batafsil tahlili
                                                    </h4>
                                                    <div className="grid gap-4">
                                                        {result.detailedResults.map((detail, dIdx) => (
                                                            <div key={dIdx} className={cn(
                                                                "p-5 rounded-2xl border flex gap-4",
                                                                detail.isCorrect ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"
                                                            )}>
                                                                <div className="shrink-0 mt-0.5">
                                                                    {detail.isCorrect ? 
                                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : 
                                                                        <XCircle className="h-5 w-5 text-rose-500" />
                                                                    }
                                                                </div>
                                                                <div className="flex-1 space-y-3 min-w-0">
                                                                    <p className="font-medium text-slate-900 text-sm leading-relaxed">
                                                                        <span className="font-bold text-slate-400 mr-2">{dIdx + 1}.</span>
                                                                        {detail.question}
                                                                    </p>
                                                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                                                        {detail.options.map((opt, oIdx) => {
                                                                            const isSelected = detail.selectedOption === oIdx;
                                                                            const isActualCorrect = detail.correctOption === oIdx;
                                                                            return (
                                                                                <div key={oIdx} className={cn(
                                                                                    "px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 truncate",
                                                                                    isActualCorrect ? "bg-emerald-100/50 border-emerald-200 text-emerald-800" : 
                                                                                    (isSelected && !isActualCorrect) ? "bg-rose-100/50 border-rose-200 text-rose-800" : 
                                                                                    "bg-white border-slate-100 text-slate-500"
                                                                                )}>
                                                                                    <div className={cn(
                                                                                        "h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0",
                                                                                        isActualCorrect ? "bg-emerald-500 text-white" : 
                                                                                        (isSelected && !isActualCorrect) ? "bg-rose-500 text-white" : 
                                                                                        "bg-slate-100 text-slate-400"
                                                                                    )}>
                                                                                        {String.fromCharCode(65 + oIdx)}
                                                                                    </div>
                                                                                    <span className="truncate">{opt}</span>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText size={40} className="text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">No attempts found</h2>
                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't completed any tests yet. Start your first test to see your results here.</p>
                            <Link 
                                to="/dashboard" 
                                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                                Browse Subjects
                                <ArrowRight size={20} />
                            </Link>
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
