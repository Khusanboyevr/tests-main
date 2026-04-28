
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import type { TestResult, Subject } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminStats() {
    const [results, setResults] = useState<TestResult[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resultsSnap, subjectsSnap] = await Promise.all([
                    getDocs(query(collection(db, "results"), orderBy("createdAt", "desc"))),
                    getDocs(collection(db, "subjects"))
                ]);

                setResults(resultsSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })) as TestResult[]);
                setSubjects(subjectsSnap.docs.map((doc: QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() })) as Subject[]);
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate subject distribution
    const subjectStats = subjects.map(sub => {
        const subResults = results.filter(r => r.subjectId === sub.id);
        const avgScore = subResults.length > 0
            ? Math.round(subResults.reduce((acc, r) => acc + (r.score / r.total), 0) / subResults.length * 100)
            : 0;

        return {
            name: sub.title,
            count: subResults.length,
            average: avgScore
        };
    }).filter(s => s.count > 0);

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6'];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-slate-900 font-display">Platform Analytics</h1>
                <p className="text-slate-500 font-medium">In-depth performance metrics and subject analysis</p>
            </header>

            {/* Top Stats Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Award className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg. Score</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">
                        {results.length > 0
                            ? Math.round(results.reduce((acc, r) => acc + (r.score / r.total), 0) / results.length * 100)
                            : 0}%
                    </h2>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Avg. Time</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">
                        {results.length > 0
                            ? Math.round(results.reduce((acc, r) => acc + r.timeSpent, 0) / results.length / 60)
                            : 0}m
                    </h2>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Tests</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">{results.length}</h2>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sessions</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">{results.length * 1}</h2>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Popular Subjects Chart */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-8">Subject Distribution</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subjectStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="count"
                                >
                                    {subjectStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        {subjectStats.map((s, i) => (
                            <div key={s.name} className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">{s.name} ({s.count})</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Proficiency by Subject */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-8">Avg. Proficiency by Subject</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} width={100} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="average" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
