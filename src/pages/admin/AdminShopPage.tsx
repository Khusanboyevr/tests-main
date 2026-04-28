
import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "@/lib/firebase-adapter";
import { db } from "@/lib/firebase";
import type { ShopItem } from "@/types";
import { ShoppingBag, Plus, Trash2, Edit3, Save, X, Coins, Package, Tag, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AdminShop() {
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingItem, setEditingItem] = useState<ShopItem | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        icon: '🎁',
        category: 'other' as ShopItem['category'],
        available: true
    });

    const fetchItems = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "shop_items"));
            setItems(snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ShopItem[]);
        } catch (error) {
            console.error("Error fetching items:", error);
            toast.error("Failed to fetch shop items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await updateDoc(doc(db, "shop_items", editingItem.id), formData);
                toast.success("Item updated");
            } else {
                await addDoc(collection(db, "shop_items"), {
                    ...formData,
                    createdAt: serverTimestamp()
                });
                toast.success("Item added");
            }
            setIsAdding(false);
            setEditingItem(null);
            setFormData({ name: '', description: '', price: 0, icon: '🎁', category: 'other', available: true });
            fetchItems();
        } catch (error) {
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        try {
            await deleteDoc(doc(db, "shop_items", id));
            toast.success("Item deleted");
            fetchItems();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 font-display">Shop Management</h1>
                    <p className="text-slate-500 font-medium">Manage items available in the student store</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(true);
                        setEditingItem(null);
                        setFormData({ name: '', description: '', price: 0, icon: '🎁', category: 'other', available: true });
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    <Plus className="h-5 w-5" />
                    Add New Item
                </button>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl"
                    >
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
                                <div className="relative group">
                                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        required
                                        type="text"
                                        placeholder="Premium Badge"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Price (Coins)</label>
                                <div className="relative group">
                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        required
                                        type="number"
                                        placeholder="500"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    required
                                    placeholder="Briefly describe what this item does..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all h-24 resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Icon (Emoji or Icon Name)</label>
                                <div className="relative group">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="💎"
                                        value={formData.icon}
                                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                <div className="relative group">
                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all appearance-none"
                                    >
                                        <option value="theme">🎨 Theme</option>
                                        <option value="avatar">👤 Avatar</option>
                                        <option value="badge">🏅 Badge</option>
                                        <option value="other">🎁 Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {editingItem ? "Update Item" : "Create Item"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100" />
                    ))
                ) : items.map(item => (
                    <div
                        key={item.id}
                        className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-200 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner uppercase">
                                {item.icon}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => {
                                        setEditingItem(item);
                                        setFormData({
                                            name: item.name,
                                            description: item.description,
                                            price: item.price,
                                            icon: item.icon,
                                            category: item.category,
                                            available: item.available
                                        });
                                        setIsAdding(true);
                                    }}
                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                    <Edit3 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <h3 className="font-bold text-slate-900 mb-1">{item.name}</h3>
                        <p className="text-xs text-slate-400 font-medium mb-4 line-clamp-2">{item.description}</p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                                <Coins size={16} className="text-amber-500" />
                                {item.price}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                item.available ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                            )}>
                                {item.available ? "Active" : "Hidden"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
