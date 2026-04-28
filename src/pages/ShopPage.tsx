
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp, query, where } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import type { ShopItem } from "@/types";
import { ShoppingBag, Coins, Check, AlertCircle, Sparkles, Package, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function ShopPage() {
    const { user, updateCoins } = useAuth();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch shop items
                const itemsSnap = await getDocs(query(collection(db, "shop_items"), where("available", "==", true)));
                setItems(itemsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ShopItem[]);

                // Fetch user purchases
                if (user) {
                    const purchasesSnap = await getDocs(query(collection(db, "purchases"), where("userId", "==", user.uid)));
                    setPurchasedIds(purchasesSnap.docs.map((doc: any) => doc.data().itemId));
                }
            } catch (err) {
                console.error("Error fetching shop data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handlePurchase = async (item: ShopItem) => {
        if (!user) return;
        if ((user.coins || 0) < item.price) {
            toast.error("Tangalaringiz yetarli emas! 🪙");
            return;
        }

        setPurchasingId(item.id);
        try {
            // 1. Deduct coins from user
            await updateDoc(doc(db, "users", user.uid), {
                coins: increment(-item.price)
            });

            // 2. Record purchase
            await addDoc(collection(db, "purchases"), {
                userId: user.uid,
                itemId: item.id,
                itemName: item.name,
                price: item.price,
                createdAt: serverTimestamp()
            });

            if (updateCoins) {
                updateCoins((user.coins || 0) - item.price);
            }

            setPurchasedIds(prev => [...prev, item.id]);
            toast.success(`${item.name} muvaffaqiyatli sotib olindi! 🎉`);
        } catch (err) {
            console.error("Purchase error:", err);
            toast.error("Xarid qilishda xatolik yuz berdi.");
        } finally {
            setPurchasingId(null);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-sm font-bold mb-4">
                                <ShoppingBag size={16} />
                                Marketplace
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 font-display mb-2">Student Shop</h1>
                            <p className="text-slate-500 font-medium max-w-xl text-lg">
                                Test ishlash orqali to'plagan tangalaringizga foydali narsalar sotib oling!
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-amber-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <Coins size={100} />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80 relative z-10">Sizning balansingiz</p>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                    <Coins size={24} className="text-white" />
                                </div>
                                <span className="text-5xl font-black tracking-tighter">
                                    {user?.coins || 0}
                                </span>
                            </div>
                        </div>
                    </header>

                    {loading ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-80 bg-white rounded-3xl animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : items.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {items.map((item, idx) => {
                                const isPurchased = purchasedIds.includes(item.id);
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={cn(
                                            "bg-white rounded-[2.5rem] p-8 border-2 transition-all group overflow-hidden relative",
                                            isPurchased ? "border-emerald-100 bg-emerald-50/10" : "border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-20 w-20 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 transition-transform",
                                            item.category === 'theme' ? "bg-purple-100" :
                                            item.category === 'avatar' ? "bg-blue-100" :
                                            item.category === 'badge' ? "bg-amber-100" : "bg-slate-100"
                                        )}>
                                            {item.icon || "🎁"}
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-xl font-black text-slate-900 mb-2">{item.name}</h3>
                                            <p className="text-slate-500 text-sm font-medium line-clamp-2">{item.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-2">
                                                <Coins className="h-5 w-5 text-amber-500" />
                                                <span className="text-2xl font-black text-slate-900">{item.price}</span>
                                            </div>

                                            {isPurchased ? (
                                                <button disabled className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-600 rounded-2xl font-bold text-sm">
                                                    <ShieldCheck size={18} />
                                                    Sotib olingan
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(item)}
                                                    disabled={purchasingId === item.id}
                                                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
                                                >
                                                    {purchasingId === item.id ? (
                                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Package size={18} />
                                                            Sotib olish
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {idx === 0 && !isPurchased && (
                                            <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-bounce">
                                                New
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <Sparkles size={48} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Shop bo'sh</h3>
                            <p className="text-slate-400 font-medium">Hozircha sotuvda hech narsa yo'q. Tez orada qo'shamiz!</p>
                        </div>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
