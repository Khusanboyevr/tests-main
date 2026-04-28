
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import { Users, BookOpen, FileText, BarChart3, TrendingUp, Award, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminOverview() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSubjects: 0,
        totalTests: 0,
        totalResults: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersSnap, subjectsSnap, testsSnap, resultsSnap] = await Promise.all([
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "subjects")),
                    getDocs(collection(db, "tests")),
                    getDocs(collection(db, "results"))
                ]);

                setStats({
                    totalUsers: usersSnap.size,
                    totalSubjects: subjectsSnap.size,
                    totalTests: testsSnap.size,
                    totalResults: resultsSnap.size
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const chartData = [
        { name: 'Mon', count: 4 },
        { name: 'Tue', count: 7 },
        { name: 'Wed', count: 5 },
        { name: 'Thu', count: 12 },
        { name: 'Fri', count: 9 },
        { name: 'Sat', count: 15 },
        { name: 'Sun', count: 18 },
    ];

    const statCards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-500", shadow: "shadow-blue-200" },
        { label: "Subjects", value: stats.totalSubjects, icon: BookOpen, color: "bg-indigo-500", shadow: "shadow-indigo-200" },
        { label: "Total Questions", value: stats.totalTests, icon: FileText, color: "bg-purple-500", shadow: "shadow-purple-200" },
        { label: "Submissions", value: stats.totalResults, icon: Award, color: "bg-emerald-500", shadow: "shadow-emerald-200" },
    ];

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Dashboard Overview</h1>
                    <p className="text-slate-500 font-medium">Monitoring platform activity and performance</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold text-slate-600">
                        <Calendar className="h-4 w-4" />
                        {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className={`h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="text-white h-6 w-6" />
                            </div>
                            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-extrabold text-slate-900">{loading ? "..." : stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Popular Subject Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Weekly Submissions</h3>
                            <p className="text-sm text-slate-500">Activity for the last 7 days</p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-full">
                            <TrendingUp className="h-4 w-4" />
                            +12.5%
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Quick Actions / Recent Activity Placeholder */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Quick Actions</h3>
                    <div className="space-y-4">
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left">
                            <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <BookOpen className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-slate-700">Add New Subject</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all text-left">
                            <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-slate-700">Create Test Set</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left">
                            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-slate-700">Export Statistics</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
