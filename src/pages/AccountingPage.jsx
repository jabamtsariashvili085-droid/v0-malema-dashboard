import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Card, StatCard, Loader } from '../components/UI';
import { fmt, fmtNum } from '../utils/format';

export function AccountingPage() {
    const { t, searchQuery } = useApp();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const { data } = await supabase
            .from("sales")
            .select(`
                *,
                product:products (
                    purchase_price,
                    category:categories(name),
                    color:colors(name),
                    thickness
                )
            `)
            .order('created_at', { ascending: false });
        setSales(data || []);
        setLoading(false);
    };

    const exportToCSV = () => {
        const headers = ["თარიღი", "პროდუქტი", "რაოდენობა", "ერთ. ფასი", "ჯამური ფასი", "დანახარჯი", "მოგება"];
        const rows = sales.map(s => {
            const totalPrice = s.sale_price * s.quantity;
            const cost = (s.product?.purchase_price || 0) * s.quantity;
            return [
                new Date(s.created_at).toLocaleDateString('ka-GE'),
                `${s.product?.color?.name || ""} ${s.product?.category?.name || ""}`,
                s.quantity,
                s.sale_price,
                totalPrice,
                cost,
                totalPrice - cost
            ];
        });

        // Add BOM for Excel UTF-8 support
        const csvContent = "\uFEFF" + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `accounting_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <Loader />;

    const totals = sales.reduce((acc, s) => {
        const totalPrice = s.sale_price * s.quantity;
        const cost = (s.product?.purchase_price || 0) * s.quantity;
        return {
            revenue: acc.revenue + totalPrice,
            cost: acc.cost + cost,
            profit: acc.profit + (totalPrice - cost)
        };
    }, { revenue: 0, cost: 0, profit: 0 });

    return (
        <div className="space-y-6 page-enter">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>ბუღალტერია</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>ფინანსური მიმოხილვა და ექსპორტი</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all print:hidden"
                    style={{ background: t.accent, color: "white" }}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Excel (CSV) ექსპორტი
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="მთლიანი შემოსავალი" value={fmt(totals.revenue)} sub="გაყიდვების ჯამი" color="#34d399" />
                <StatCard label="მთლიანი დანახარჯი" value={fmt(totals.cost)} sub="თვითღირებულება" color="#f87171" />
                <StatCard label="სუფთა მოგება" value={fmt(totals.profit)} sub="მოგება" color="#a78bfa" />
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b" style={{ color: t.textMuted, borderColor: t.border }}>
                                <th className="pb-3 font-medium">თარიღი</th>
                                <th className="pb-3 font-medium">პროდუქტი</th>
                                <th className="pb-3 font-medium text-right">რაოდ.</th>
                                <th className="pb-3 font-medium text-right">შემოს.</th>
                                <th className="pb-3 font-medium text-right">დანახ.</th>
                                <th className="pb-3 font-medium text-right">მოგება</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.filter(s => {
                                const query = searchQuery.toLowerCase().trim();
                                if (!query) return true;
                                return (
                                    s.product?.color?.name?.toLowerCase().includes(query) ||
                                    s.product?.category?.name?.toLowerCase().includes(query)
                                );
                            }).map((s, i) => {
                                const totalPrice = s.sale_price * s.quantity;
                                const cost = (s.product?.purchase_price || 0) * s.quantity;
                                return (
                                    <tr key={i} className="border-b" style={{ borderColor: t.border }}>
                                        <td className="py-3" style={{ color: t.textMuted }}>{new Date(s.created_at).toLocaleDateString('ka-GE')}</td>
                                        <td className="py-3">
                                            <p style={{ color: t.text }}>{s.product?.color?.name} — {s.product?.category?.name}</p>
                                            <p className="text-xs" style={{ color: t.textFaint }}>{s.product?.thickness}</p>
                                        </td>
                                        <td className="py-3 text-right" style={{ color: t.textMuted }}>{fmtNum(s.quantity)}</td>
                                        <td className="py-3 text-right" style={{ color: "#34d399" }}>{fmt(totalPrice)}</td>
                                        <td className="py-3 text-right" style={{ color: "#f87171" }}>{fmt(cost)}</td>
                                        <td className="py-3 text-right font-bold" style={{ color: "#a78bfa" }}>{fmt(totalPrice - cost)}</td>
                                    </tr>
                                );
                            })}
                            {sales.length === 0 && (
                                <tr><td colSpan="6" className="py-8 text-center" style={{ color: t.textFaint }}>მონაცემები არ არის</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
