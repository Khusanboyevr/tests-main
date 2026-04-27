"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { Subject } from "@/types";
import { Plus, Edit2, Trash2, Search, X, Check, BookOpen, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSubject, setCurrentSubject] = useState<Partial<Subject>>({ title: "", description: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "subjects"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subject[];
            setSubjects(data);
        } catch (error) {
            toast.error("Failed to fetch subjects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        // Check for duplicate name
        const titleLower = currentSubject.title?.toLowerCase().trim() || "";
        const isDuplicate = subjects.some(s => s.title.toLowerCase().trim() === titleLower && s.id !== currentSubject.id);
        if (isDuplicate) {
            toast.error("Bu nomdagi bo'lim allaqachon mavjud!");
            return;
        }

        setSubmitting(true);
        try {
            if (isEditing && currentSubject.id) {
                await updateDoc(doc(db, "subjects", currentSubject.id), {
                    title: currentSubject.title,
                    description: currentSubject.description,
                });
                toast.success("Subject updated successfully");
            } else {
                await addDoc(collection(db, "subjects"), {
                    title: currentSubject.title?.trim(),
                    description: currentSubject.description,
                    createdAt: serverTimestamp(),
                });
                toast.success("Subject added successfully");
            }
            setIsModalOpen(false);
            fetchSubjects();
        } catch (error) {
            toast.error("Error saving subject");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this subject?")) {
            try {
                await deleteDoc(doc(db, "subjects", id));
                toast.success("Subject deleted");
                fetchSubjects();
            } catch (error) {
                toast.error("Error deleting subject");
            }
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Manage Subjects</h1>
                    <p className="text-slate-500 font-medium">Add or edit testing categories</p>
                </div>
                <button
                    onClick={() => {
                        setCurrentSubject({ title: "", description: "" });
                        setIsEditing(false);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-105"
                >
                    <Plus size={20} />
                    Add Subject
                </button>
            </header>

            {/* Search & Stats */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="px-6 py-3.5 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center gap-3 border border-indigo-100 font-bold">
                    <BookOpen size={20} />
                    <span>{subjects.length} Total Subjects</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Subject Information</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i}>
                                        <td colSpan={3} className="px-8 py-10 text-center animate-pulse">
                                            <div className="h-4 w-1/3 bg-slate-100 rounded mx-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSubjects.length > 0 ? (
                                filteredSubjects.map((subject) => (
                                    <tr key={subject.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold">
                                                    {subject.title[0]}
                                                </div>
                                                <span className="font-bold text-slate-900">{subject.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 max-w-md">
                                            <p className="text-sm text-slate-500 line-clamp-2">{subject.description}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setCurrentSubject(subject);
                                                        setIsEditing(true);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(subject.id)}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-8 py-20 text-center">
                                        <p className="text-slate-400 font-medium">No subjects found matching your criteria.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">
                                    {isEditing ? "Edit Subject" : "New Subject"}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Subject Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentSubject.title}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, title: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. Mathematics, History, Physics"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Subject Description</label>
                                    <textarea
                                        required
                                        value={currentSubject.description}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-32 resize-none"
                                        placeholder="Briefly describe what this subject covers..."
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all font-display"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Check size={20} />
                                        {isEditing ? "Update Subject" : "Create Subject"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
