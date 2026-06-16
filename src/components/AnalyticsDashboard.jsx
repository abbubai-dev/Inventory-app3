import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { TrendingUp, Activity, AlertCircle, Users, RefreshCw } from "lucide-react";

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem("InventoryAppToken");
                const res = await fetch("/api/analytics", {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Menjana Laporan Analitik...</div>;
    if (!data) return null;

    // --- AUTO-GENERATED INSIGHTS LOGIC ---
    const topClinic = data.topClinics[0];
    const topItem = data.topItems[0];
    const topBorrower = data.topTransfers[0];
    const topUser = data.activeUsers[0];

    const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];

    return (
        <div className="space-y-6 animate-in fade-in">
            
            {/* EXECUTIVE SUMMARY (AUTO-GENERATED COMMENTS) */}
            <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" /> Rumusan Eksekutif (AI Insights)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {topClinic && (
                        <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                            <p className="text-xs text-orange-600 font-bold mb-1">🔥 Penggunaan Tertinggi</p>
                            <p className="text-sm text-slate-700">
                                <strong>{topClinic.name}</strong> merekodkan penggunaan stok tertinggi daerah dengan pengeluaran sebanyak <strong>{topClinic.total_used.toLocaleString()} unit</strong>.
                            </p>
                        </div>
                    )}
                    {topItem && (
                        <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                            <p className="text-xs text-red-600 font-bold mb-1">⚠️ Susut Nilai Terpantas</p>
                            <p className="text-sm text-slate-700">
                                <strong>{topItem.name}</strong> adalah barangan paling kritikal dengan penyusutan sebanyak <strong>{topItem.total_used.toLocaleString()} unit</strong>.
                            </p>
                        </div>
                    )}
                    {topBorrower && (
                        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                            <p className="text-xs text-blue-600 font-bold mb-1">🔄 Kebergantungan Rangkaian</p>
                            <p className="text-sm text-slate-700">
                                Berlaku kebergantungan stok di mana <strong>{topBorrower.to_loc}</strong> kerap meminjam dari <strong>{topBorrower.from_loc}</strong> ({topBorrower.transfer_count} kali transaksi).
                            </p>
                        </div>
                    )}
                    {topUser && (
                        <div className="p-4 bg-green-50/50 border border-green-100 rounded-2xl">
                            <p className="text-xs text-green-600 font-bold mb-1">✅ Disiplin Audit Tertinggi</p>
                            <p className="text-sm text-slate-700">
                                Pegawai <strong>{topUser.name}</strong> mempamerkan rekod disiplin inventori terbaik dengan mencatatkan <strong>{topUser.activities} aktiviti log</strong>.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* GRAPHS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CHART 1: Top Items */}
                <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Carta Susut Nilai Barangan (Top 5)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topItems} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="total_used" radius={[0, 4, 4, 0]}>
                                    {data.topItems.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* CHART 2: Top Clinics */}
                <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Volum Penggunaan Mengikut Klinik</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.topClinics}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Bar dataKey="total_used" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalyticsDashboard;