
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { TestQuestion, Subject } from "@/types";
import { toast } from "react-hot-toast";
import { Clock, ChevronRight, ChevronLeft, Flag, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";

export default function TakeTest() {
    const { subjectId } = useParams();
    const { user, updateCoins } = useAuth();
    const navigate = useNavigate();

    const [subject, setSubject] = useState<Subject | null>(null);
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [violations, setViolations] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTime, setBlockTime] = useState(0);

    const fetchTestData = async () => {
        try {
            const subjectDoc = await getDoc(doc(db, "subjects", subjectId as string));
            if (!subjectDoc.exists()) {
                toast.error("Subject not found");
                navigate("/dashboard");
                return;
            }
            setSubject({ id: subjectDoc.id, ...subjectDoc.data() } as Subject);

            const q = query(collection(db, "tests"), where("subjectId", "==", subjectId));
            const questionsSnap = await getDocs(q);
            let questionsData = questionsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as TestQuestion[];

            if (questionsData.length === 0) {
                toast.error("No questions available for this subject");
                navigate("/dashboard");
                return;
            }

            questionsData = questionsData.sort(() => Math.random() - 0.5);
            setQuestions(questionsData);
            setTimeLeft(questionsData.length * 60);
        } catch (error) {
            console.error("Error fetching test:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subjectId) fetchTestData();
    }, [subjectId]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && !isBlocked && !loading && questions.length > 0) {
                const nextViolations = violations + 1;
                setViolations(nextViolations);
                
                let penaltySeconds = 10 + (nextViolations * 10); // 1:20s, 2:30s, 3:40s, 4:50s, 5:60s
                
                if (penaltySeconds >= 60) {
                    penaltySeconds = 600; // 10 minutes
                }

                setBlockTime(penaltySeconds);
                setIsBlocked(true);
                
                toast.error(`Diqqat! Qoidabuzarlik aniqlandi. Test ${penaltySeconds >= 600 ? '10 minutga' : penaltySeconds + ' soniyaga'} bloklandi.`, {
                    duration: 5000,
                    icon: '🚫'
                });
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleVisibilityChange);

        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleVisibilityChange);
        };
    }, [violations, isBlocked, loading, questions]);

    useEffect(() => {
        if (!isBlocked || blockTime <= 0) return;

        const timer = setInterval(() => {
            setBlockTime(prev => {
                if (prev <= 1) {
                    setIsBlocked(false);
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isBlocked, blockTime]);

    useEffect(() => {
        if (loading || timeLeft <= 0 || questions.length === 0 || isBlocked) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [loading, timeLeft, questions, isBlocked]);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        let score = 0;
        const detailedResults = questions.map((q, idx) => {
            const isCorrect = answers[idx] === q.correctAnswer;
            if (isCorrect) score++;
            return {
                question: q.question,
                options: q.options,
                selectedOption: answers[idx] ?? -1,
                correctOption: q.correctAnswer,
                isCorrect
            };
        });

        try {
            const resultData = {
                userId: user!.uid,
                subjectId,
                subjectTitle: subject!.title,
                score,
                total: questions.length,
                timeSpent: (questions.length * 60) - timeLeft,
                detailedResults,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, "results"), resultData);
            
            // Award Coins: 10 coins per correct answer
            if (score > 0) {
                const coinsEarned = score * 10;
                await updateDoc(doc(db, "users", user!.uid), {
                    coins: increment(coinsEarned)
                });
                if (updateCoins) {
                    updateCoins((user!.coins || 0) + coinsEarned);
                }
                toast.success(`${coinsEarned} tanga qo'lga kiritdingiz! 🪙`);
            } else {
                toast.success("Test yakunlandi!");
            }
            
            navigate(`/result/${docRef.id}`);
        } catch (error: any) {
            console.error("Save error:", error);
            toast.error(`Natijani saqlashda xatolik: ${error.message || 'Server xatosi'}`);
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Preparing your test...</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <AnimatePresence>
                    {isBlocked && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-white rounded-[2rem] p-10 max-w-md w-full text-center shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
                                <div className="h-20 w-20 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-12">
                                    <AlertTriangle size={40} className="text-rose-600" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2 font-display">TEST LOCKED!</h2>
                                <p className="text-slate-500 font-medium mb-8">
                                    Xavfsizlik tizimi siz test ekranidan chiqib ketganingizni aniqladi. Test vaqtincha bloklandi.
                                </p>
                                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 ring-4 ring-slate-50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Block vaqti</p>
                                    <p className="text-6xl font-black text-indigo-600 font-mono tracking-tighter">
                                        {Math.floor(blockTime / 60).toString().padStart(2, '0')}:{(blockTime % 60).toString().padStart(2, '0')}
                                    </p>
                                </div>
                                <p className="mt-8 text-xs text-rose-500 font-bold uppercase tracking-widest bg-rose-50 inline-block px-4 py-2 rounded-full">
                                    Qoidabuzarlik #{violations}
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Test Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-6 py-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-none">{subject?.title}</h2>
                            <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</p>
                        </div>

                        <div className={cn(
                            "flex items-center gap-3 px-5 py-2.5 rounded-2xl font-mono text-xl font-bold transition-colors",
                            timeLeft < 60 ? "bg-rose-50 text-rose-600 animate-pulse" : "bg-slate-900 text-white"
                        )}>
                            <Clock className="h-5 w-5" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-indigo-600"
                        />
                    </div>
                </header>

                <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Question */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                                <h3 className="text-2xl font-bold text-slate-900 mb-8 leading-relaxed">
                                    {currentQuestion.question}
                                </h3>

                                <div className="space-y-4">
                                    {currentQuestion.options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setAnswers({ ...answers, [currentIndex]: idx })}
                                            className={cn(
                                                "w-full flex items-center gap-5 p-6 rounded-2xl border-2 text-left transition-all group",
                                                answers[currentIndex] === idx
                                                    ? "bg-indigo-50 border-indigo-600 ring-4 ring-indigo-50"
                                                    : "bg-white border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-8 w-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors",
                                                answers[currentIndex] === idx ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                            )}>
                                                {String.fromCharCode(65 + idx)}
                                            </div>
                                            <span className={cn(
                                                "text-lg font-medium",
                                                answers[currentIndex] === idx ? "text-indigo-900" : "text-slate-600"
                                            )}>
                                                {option}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentIndex === 0}
                                    className="px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition-all disabled:opacity-30 flex items-center gap-2"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                    Previous
                                </button>

                                {currentIndex === questions.length - 1 ? (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                                    >
                                        {isSubmitting ? "Submitting..." : (
                                            <>
                                                <CheckCircle2 className="h-5 w-5" />
                                                Finish & Submit
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    >
                                        Next Question
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Quick Nav Grid */}
                    <div className="mt-12 pt-8 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Test Map</p>
                        <div className="flex flex-wrap gap-2">
                            {questions.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentIndex(i)}
                                    className={cn(
                                        "h-10 w-10 rounded-xl font-bold text-xs transition-all border",
                                        currentIndex === i
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-110 z-10"
                                            : answers[i] !== undefined
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-white text-slate-400 border-slate-200 hover:border-indigo-300"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
