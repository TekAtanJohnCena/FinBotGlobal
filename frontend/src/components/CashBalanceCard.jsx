import { useState, useEffect } from 'react';
import { DollarSign, Edit2, Check, X } from 'lucide-react';
import api from '../lib/api';

export default function CashBalanceCard() {
    const [cash, setCash] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch cash balance on mount
    useEffect(() => {
        fetchCash();
    }, []);

    async function fetchCash() {
        try {
            const res = await api.get('/portfolio/cash');
            if (res.data.ok) {
                setCash(res.data.balance || 0);
            }
        } catch (err) {
            console.error('Cash fetch error:', err);
        }
    }

    async function saveCash() {
        setLoading(true);
        try {
            const res = await api.post('/portfolio/cash', { amount: Number(editValue) });
            if (res.data.ok) {
                setCash(Number(editValue));
                setIsEditing(false);
            }
        } catch (err) {
            console.error('Cash save error:', err);
        } finally {
            setLoading(false);
        }
    }

    function startEdit() {
        setEditValue(cash.toString());
        setIsEditing(true);
    }

    function cancelEdit() {
        setIsEditing(false);
        setEditValue("");
    }

    return (
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-sm border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-300">Nakit Bakiye</h3>
                </div>
                {!isEditing && (
                    <button
                        onClick={startEdit}
                        className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all"
                    >
                        <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Nakit miktar ($)"
                        className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={saveCash}
                            disabled={loading}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                            <Check className="w-3 h-3" />
                            Kaydet
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-center gap-1"
                        >
                            <X className="w-3 h-3" />
                            İptal
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-3xl font-black text-emerald-400">
                    ${cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            )}
        </div>
    );
}
