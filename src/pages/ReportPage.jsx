import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Card, StatCard, Loader } from '../components/UI';
import { fmt, fmtNum } from '../utils/format';

export function ReportPage() {
    const { t, searchQuery } = useApp();
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);
    const loadData = async () => {
        const { data } = await supabase.from("profit_report").select("*");
        setReport(data || []); setLoading(false);
    };

    if (loading) return <Loader />;

    const totals = report.reduce((acc, r) => ({
        sold: acc.sold + (r.total_sold || 0),
        revenue: acc.revenue + (r.total_revenue || 0),
        cost: acc.cost + (r.total_cost || 0),
        profit: acc.profit + (r.total_profit || 0),
    }), { sold: 0, revenue: 0, cost: 0, profit: 0 });

    return (
        <div className="space-y-6 page-enter">
            <div>
                <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>მოგების ანგარიში</h2>
                <p className="text-sm mt-1" style={{ color: t.textMuted }}>ყველა გაყიდვის სტატისტიკა</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="გაყიდული" value={fmtNum(totals.sold)} sub="ლისტი სულ" color="#60a5fa" />
                <StatCard label="შემოსავალი" value={fmt(totals.revenue)} sub="გაყიდვების ჯამი" color="#34d399" />
                <StatCard label="დანახარჯი" value={fmt(totals.cost)} sub="შეძენის ღირებულება" color="#f87171" />
                <StatCard label="სუფთა მოგება" value={fmt(totals.profit)} sub="შემოსავალი − დანახარჯი" color="#a78bfa" />
            </div>
            <Card>
                <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>პროდუქტების მიხედვით</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b" style={{ color: t.textMuted, borderColor: t.border }}>
                                <th className="pb-3 font-medium">პროდუქტი</th>
                                <th className="pb-3 font-medium text-right">გაყიდ.</th>
                                <th className="pb-3 font-medium text-right">შემოს.</th>
                                <th className="pb-3 font-medium text-right">დანახ.</th>
                                <th className="pb-3 font-medium text-right">მოგება</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.filter(r => {
                                const query = searchQuery.toLowerCase().trim();
                                if (!query) return true;
                                return (
                                    r.category?.toLowerCase().includes(query) ||
                                    r.color?.toLowerCase().includes(query) ||
                                    r.thickness?.toLowerCase().includes(query)
                                );
                            }).map((r, i) => (
                                <tr key={i} className="border-b" style={{ borderColor: t.border }}>
                                    <td className="py-3">
                                        <p style={{ color: t.text }}>{r.color} — {r.category}</p>
                                        <p className="text-xs" style={{ color: t.textFaint }}>{r.thickness}</p>
                                    </td>
                                    <td className="py-3 text-right" style={{ color: t.textMuted }}>{fmtNum(r.total_sold)} ლ.</td>
                                    <td className="py-3 text-right" style={{ color: "#34d399" }}>{fmt(r.total_revenue)}</td>
                                    <td className="py-3 text-right" style={{ color: "#f87171" }}>{fmt(r.total_cost)}</td>
                                    <td className="py-3 text-right font-bold" style={{ color: "#a78bfa" }}>{fmt(r.total_profit)}</td>
                                </tr>
                            ))}
                            {report.length === 0 && (
                                <tr><td colSpan="5" className="py-8 text-center" style={{ color: t.textFaint }}>მონაცემები არ არის</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
