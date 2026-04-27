"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, where, orderBy } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { Subject, TestQuestion } from "@/types";
import { Plus, Edit2, Trash2, Search, X, Check, FileText, ChevronDown, Filter, Trophy, Star } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface TopUser {
    uid: string;
    email: string;
    totalScore: number;
}
import { cn } from "@/lib/utils";

export default function AdminTests() {
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<TestQuestion>>({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        subjectId: ""
    });
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubject, setFilterSubject] = useState("all");
    const [topUsers, setTopUsers] = useState<TopUser[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkJson, setBulkJson] = useState("");
    const [bulkSubjectId, setBulkSubjectId] = useState("");
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [newSubject, setNewSubject] = useState({ title: "", description: "" });
    const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
    const fetchData = async () => {
        setLoading(true);
        try {
            const subjectsSnap = await getDocs(collection(db, "subjects"));
            const subjectsData = subjectsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Subject[];
            setSubjects(subjectsData);

            const questionsSnap = await getDocs(query(collection(db, "tests"), orderBy("createdAt", "desc")));
            const questionsData = questionsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as TestQuestion[];
            setQuestions(questionsData);

            const usersSnap = await getDocs(collection(db, "users"));
            const usersData = usersSnap.docs.map((doc: any) => ({ uid: doc.id, ...doc.data() }));

            const resultsSnap = await getDocs(collection(db, "results"));
            const resultsData = resultsSnap.docs.map((doc: any) => doc.data());

            const usersWithStats = usersData.map((user: any) => {
                const userResults = resultsData.filter((r: any) => r.userId === user.uid || r.userEmail === user.email);
                const totalScore = userResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
                return { ...user, totalScore };
            });

            const top = usersWithStats
                .sort((a: any, b: any) => b.totalScore - a.totalScore)
                .slice(0, 3)
                .filter((u: any) => u.totalScore > 0);
            setTopUsers(top);
        } catch (error) {
            toast.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkSubjectId) {
            toast.error("Please select a subject for the bulk import");
            return;
        }

        try {
            setLoading(true);
            const blocks = bulkJson.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 0);
            let count = 0;

            for (const block of blocks) {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                
                // Identify options based on starting with A), B), C), D) or a., b., etc.
                const optIndices = [];
                for (let i = 0; i < lines.length; i++) {
                    if (/^[a-dA-D][\)\.]\s+/.test(lines[i])) {
                        optIndices.push(i);
                    }
                }

                if (optIndices.length >= 4) {
                    const firstOptIndex = optIndices[0];
                    // Extract question text
                    const questionStr = lines.slice(0, firstOptIndex).join('\n').replace(/^\d+[\.\)]\s*/, '').trim();
                    
                    // Extract exactly 4 options
                    const cleanOptions = optIndices.slice(0, 4).map(idx => lines[idx].replace(/^[a-dA-D][\)\.]\s*/, '').trim());
                    
                    // Look for answer inside the whole block
                    const answerLine = lines.find(l => /^(?:javob|answer|to'g'ri)/i.test(l));
                    let correctAnswerIdx = 0;
                    if (answerLine) {
                        const parts = answerLine.split(':');
                        if (parts.length > 1) {
                            const letter = parts[1].trim().charAt(0).toUpperCase();
                            if (['A', 'B', 'C', 'D'].includes(letter)) {
                                correctAnswerIdx = letter.charCodeAt(0) - 65;
                            }
                        } else {
                            const match = answerLine.match(/\b([A-D])\b/i);
                            if (match) {
                                correctAnswerIdx = match[1].toUpperCase().charCodeAt(0) - 65;
                            }
                        }
                    }

                    if (questionStr && cleanOptions.length === 4) {
                        await addDoc(collection(db, "tests"), {
                            question: questionStr,
                            options: cleanOptions,
                            correctAnswer: Math.max(0, Math.min(3, correctAnswerIdx)),
                            subjectId: bulkSubjectId,
                            createdAt: serverTimestamp(),
                        });
                        count++;
                    }
                }
            }

            if (count > 0) {
                toast.success(`Successfully imported ${count} questions`);
                setIsBulkModalOpen(false);
                setBulkJson("");
                fetchData();
            } else {
                toast.error("Format xato. Savollarni topib bo'lmadi.");
            }
        } catch (error: any) {
            toast.error("Import qilishda xatolik: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentQuestion.subjectId) {
            toast.error("Please select a subject");
            return;
        }

        try {
            if (isEditing && currentQuestion.id) {
                await updateDoc(doc(db, "tests", currentQuestion.id), {
                    question: currentQuestion.question,
                    options: currentQuestion.options,
                    correctAnswer: currentQuestion.correctAnswer,
                    subjectId: currentQuestion.subjectId,
                });
                toast.success("Question updated");
            } else {
                await addDoc(collection(db, "tests"), {
                    ...currentQuestion,
                    createdAt: serverTimestamp(),
                });
                toast.success("Question added");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Error saving question");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this question?")) {
            try {
                await deleteDoc(doc(db, "tests", id));
                toast.success("Question deleted");
                fetchData();
            } catch (error) {
                toast.error("Error deleting question");
            }
        }
    };

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterSubject === "all" || q.subjectId === filterSubject;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Question Bank</h1>
                    <p className="text-slate-500 font-medium">Create and manage your test questions</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                    >
                        <FileText size={20} className="text-indigo-600" />
                        Bulk Import
                    </button>
                    <button
                        onClick={() => {
                            setCurrentQuestion({
                                question: "",
                                options: ["", "", "", ""],
                                correctAnswer: 0,
                                subjectId: subjects[0]?.id || ""
                            });
                            setIsEditing(false);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Add Question
                    </button>
                </div>
            </header>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search questions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 bg-white border border-slate-200 rounded-2xl">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                        className="py-3.5 bg-transparent outline-none text-sm font-semibold text-slate-600 cursor-pointer"
                    >
                        <option value="all">All Subjects</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white rounded-3xl border border-slate-200 animate-pulse" />
                    ))
                ) : filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q, idx) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
                        >
                            <div className="flex justify-between items-start gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-indigo-100">
                                            {subjects.find(s => s.id === q.subjectId)?.title || "Unknown Subject"}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 leading-relaxed capitalize">{q.question}</h3>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={() => {
                                            setCurrentQuestion(q);
                                            setIsEditing(true);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(q.id)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                {q.options.map((opt, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm border flex items-center gap-3",
                                            i === q.correctAnswer
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                                                : "bg-slate-50 border-slate-100 text-slate-500"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-5 w-5 rounded-full flex items-center justify-center text-[10px] shrink-0",
                                            i === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        {opt}
                                        {i === q.correctAnswer && <Check size={14} className="ml-auto" />}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <FileText className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium text-lg">No questions found. Add some to get started!</p>
                    </div>
                )}
            </div>
            </div>

            {/* Right Sidebar - Leaderboard */}
            <div className="w-full xl:w-96 shrink-0 space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-1 relative overflow-hidden shadow-xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Trophy size={100} />
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-[28px] p-8 border border-white/20">
                        <div className="flex items-center gap-3 mb-8 text-white relative z-10">
                            <div className="p-3 bg-white/20 rounded-2xl">
                                <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold font-display">Top Performers</h2>
                                <p className="text-indigo-100 text-sm font-medium">Overall Leaderboard</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {topUsers.length > 0 ? (
                                topUsers.map((user, idx) => (
                                    <div key={user.uid} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm relative group overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold border-2 ${
                                            idx === 0 ? "bg-amber-100 text-amber-500 border-amber-200" :
                                            idx === 1 ? "bg-slate-100 text-slate-500 border-slate-200" :
                                            "bg-orange-100 text-orange-500 border-orange-200"
                                        }`}>
                                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-900 truncate">
                                                {user.email.split('@')[0]}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                                                <Star size={12} className="fill-indigo-600" />
                                                {user.totalScore} Points
                                            </div>
                                        </div>
                                        <div className="text-2xl font-black text-slate-200 group-hover:text-slate-300 transition-colors">
                                            #{idx + 1}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white/10 rounded-2xl p-8 text-center border border-white/10">
                                    <p className="text-indigo-100 font-medium">No results recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-slate-900">
                                    {isEditing ? "Edit Question" : "New Question"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 shadow-sm">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Target Subject</label>
                                            <button 
                                                type="button"
                                                onClick={() => setIsSubjectModalOpen(true)}
                                                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md"
                                            >
                                                + New
                                            </button>
                                        </div>
                                        <select
                                            required
                                            value={currentQuestion.subjectId}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, subjectId: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                        >
                                            <option value="">Select subject...</option>
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>{s.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Correct Index</label>
                                        <select
                                            required
                                            value={currentQuestion.correctAnswer}
                                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                        >
                                            {currentQuestion.options?.map((_, i) => (
                                                <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Question Content</label>
                                    <textarea
                                        required
                                        value={currentQuestion.question}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-28 resize-none font-medium leading-relaxed"
                                        placeholder="Enter the question here..."
                                    />
                                </div>

                                <div className="space-y-5">
                                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider block">Answer Options</label>
                                    <div className="grid gap-4">
                                        {currentQuestion.options?.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center font-bold shrink-0 transition-all",
                                                    currentQuestion.correctAnswer === i
                                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                                                        : "bg-slate-100 text-slate-400 group-focus-within:bg-slate-200"
                                                )}>
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <input
                                                    type="text"
                                                    required
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...(currentQuestion.options || [])];
                                                        newOpts[i] = e.target.value;
                                                        setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                                    }}
                                                    className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
                                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-8 py-5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all text-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold font-display shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                                    >
                                        <Check size={24} />
                                        {isEditing ? "Save Changes" : "Publish Question"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bulk Modal */}
            <AnimatePresence>
                {isBulkModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBulkModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <FileText className="text-indigo-600" />
                                    Bulk Import Test Set
                                </h3>
                                <button onClick={() => setIsBulkModalOpen(false)} className="p-3 hover:bg-white rounded-full transition-colors border border-slate-200">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleBulkSubmit} className="p-10 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider">Select Subject</label>
                                        <button 
                                            type="button"
                                            onClick={() => setIsSubjectModalOpen(true)}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md"
                                        >
                                            + Add New Subject
                                        </button>
                                    </div>
                                    <select
                                        required
                                        value={bulkSubjectId}
                                        onChange={(e) => setBulkSubjectId(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                                    >
                                        <option value="">Select subject for this block...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-slate-700 ml-1 uppercase tracking-wider block">
                                        Testlar matni (Word / Telegram format)
                                    </label>
                                    <textarea
                                        required
                                        value={bulkJson}
                                        onChange={(e) => setBulkJson(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-64 resize-none font-mono text-sm leading-relaxed"
                                        placeholder={`1. O'zbekiston poytaxti qayer?
A) Samarqand
B) Buxoro
C) Toshkent
D) Xiva
Javob: C

2. 2+2 nechaga teng?
...`}
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium px-2">
                                        * Eslatma: Har bir test o'zaro ochiq qator (Enter) bilan ajratilishi kerak. Har bir javob varianti harfdan (A, B, C, D) boshlanishi va oxirida "Javob: X" bo'lishi shart.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsBulkModalOpen(false)}
                                        className="flex-1 px-8 py-5 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !bulkJson}
                                        className="flex-1 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={24} />
                                        {loading ? "Processing..." : "Import Block"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Quick Add Subject Modal */}
            <AnimatePresence>
                {isSubjectModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSubjectModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">Quick Add Subject</h3>
                                <button onClick={() => setIsSubjectModalOpen(false)} className="p-2 hover:bg-white rounded-full">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>
                            <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (isSubmittingSubject) return;

                                    const titleLower = newSubject.title?.toLowerCase().trim() || "";
                                    const isDuplicate = subjects.some(s => s.title.toLowerCase().trim() === titleLower);
                                    if (isDuplicate) {
                                        toast.error("Bu nomdagi bo'lim allaqachon mavjud!");
                                        return;
                                    }

                                    setIsSubmittingSubject(true);
                                    try {
                                        const docRef = await addDoc(collection(db, "subjects"), {
                                            title: newSubject.title?.trim(),
                                            description: newSubject.description,
                                            createdAt: serverTimestamp()
                                        });
                                        toast.success("Subject added!");
                                        setNewSubject({ title: "", description: "" });
                                        setIsSubjectModalOpen(false);
                                        // Refresh subjects
                                        const snap = await getDocs(collection(db, "subjects"));
                                        const data = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Subject[];
                                        setSubjects(data);
                                        // Auto select for the active modal
                                        if (isModalOpen) setCurrentQuestion(prev => ({ ...prev, subjectId: docRef.id }));
                                        if (isBulkModalOpen) setBulkSubjectId(docRef.id);
                                    } catch (err) {
                                        toast.error("Error adding subject");
                                    } finally {
                                        setIsSubmittingSubject(false);
                                    }
                                }} 
                                className="p-8 space-y-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subject Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={newSubject.title}
                                        onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold"
                                        placeholder="e.g. Physics"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                    <textarea
                                        required
                                        value={newSubject.description}
                                        onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-24 resize-none"
                                        placeholder="Short description..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingSubject}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Check size={20} />
                                    Save Subject
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
