"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { ArrowRight, CheckCircle2, BookOpen, BarChart3, Clock, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "@/lib/firebase-adapter";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const [isAccessing, setIsAccessing] = useState(false);

  const handleQuickStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAccessing(true);
    try {
        await signInWithEmailAndPassword(auth, "guest@example.com", "password123");
        toast.success("Welcome! You've entered as a Guest.");
        router.push("/dashboard");
    } catch (error) {
        toast.error("Failed to enter platform.");
    } finally {
        setIsAccessing(false);
    }
  };
  const features = [
    {
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      title: "Multiple Subjects",
      description: "Take tests across various subjects including Math, History, Science, and more."
    },
    {
      icon: <Clock className="h-6 w-6 text-purple-600" />,
      title: "Timed Exams",
      description: "Real-time countdown timer to help you prepare for actual exam conditions."
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-emerald-600" />,
      title: "Detailed Analytics",
      description: "Get instant results with detailed performance breakdowns and score history."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-blue-600" />,
      title: "Secure Testing",
      description: "Randomized questions and secure environment to ensure fair testing for everyone."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-50/50 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-6 ring-1 ring-indigo-100">
              <CheckCircle2 className="h-4 w-4" />
              Empowering Students Worldwide
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight font-display">
              Master Your Skills with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient">
                Interactive Online Tests
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-600 mb-10 leading-relaxed">
              The ultimate platform for self-assessment and exam preparation. Practice with randomized questions, track your progress, and excel in your studies.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleQuickStart}
                disabled={isAccessing}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isAccessing ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        Start Testing Now
                        <ArrowRight className="h-5 w-5" />
                    </>
                )}
              </button>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-display">Why Choose FastTest?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Everything you need to boost your academic performance in one place.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 text-center border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-7 w-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold text-slate-900 font-display">FastTest</span>
          </div>
          <p className="text-slate-500 mb-6">Built for students who strive for excellence.</p>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} FastTest Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
