"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { TestResult } from "@/types";
import { Trophy, Clock, CheckCircle2, XCircle, ArrowRight, Share2, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function ResultPage() {
    const { id } = useParams();
    const [result, setResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const resultDoc = await getDoc(doc(db, "results", id as string));
                if (resultDoc.exists()) {
                    setResult({ id: resultDoc.id, ...resultDoc.data() } as TestResult);
                }
            } catch (error) {
                console.error("Error fetching result:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchResult();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!result) return <div>Result not found</div>;

    const percentage = Math.round((result.score / result.total) * 100);
    const isPassed = percentage >= 60;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="max-w-3xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl shadow-indigo-100"
                >
                    {/* Result Header */}
                    <div className={cn(
                        "p-12 text-center text-white",
                        isPassed ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-indigo-600 to-purple-700"
                    )}>
                        <div className="inline-flex h-24 w-24 items-center justify-center bg-white/20 backdrop-blur-md rounded-full mb-6 relative">
                            <Trophy className="h-12 w-12" />
                            {isPassed && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                </motion.div>
                            )}
                        </div>
                        <h1 className="text-4xl font-extrabold mb-2 font-display">
                            {isPassed ? "Congratulations!" : "Keep Practicing!"}
                        </h1>
                        <p className="text-white/80 font-medium">You've completed the {result.subjectTitle} test</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="p-12">
                        <div className="grid grid-cols-2 gap-8 mb-12">
                            <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                                <h2 className="text-5xl font-black text-slate-900">
                                    {result.score}<span className="text-slate-300 text-3xl mx-1">/</span>{result.total}
                                </h2>
                                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                                    <span className={cn(
                                        "h-2 w-2 rounded-full",
                                        isPassed ? "bg-emerald-500" : "bg-indigo-500"
                                    )} />
                                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap">{percentage}% Proficiency</span>
                                </div>
                            </div>

                            <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Time Elapsed</p>
                                <div className="h-[60px] flex items-center justify-center">
                                    <div className="flex items-center gap-3 text-3xl font-black text-slate-900">
                                        <Clock className="h-8 w-8 text-indigo-500" />
                                        {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-3 uppercase tracking-wider">
                                    {Math.round(result.timeSpent / result.total)}s Avg. per question
                                </p>
                            </div>
                        </div>

                        {/* Performance Bar */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Ranking</span>
                                <span className="text-sm font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg">
                                    {isPassed ? "Very Good" : "Needs Review"}
                                </span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000",
                                        isPassed ? "bg-emerald-500" : "bg-indigo-600 shadow-lg shadow-indigo-200"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/dashboard"
                                className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                            >
                                <LayoutDashboard className="h-5 w-5" />
                                Return to Dashboard
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="px-8 py-5 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                            >
                                <Share2 className="h-5 w-5" />
                                Share Result
                            </button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

// Add cn helper inside if needed or import
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
