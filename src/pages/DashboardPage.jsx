import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Card, StatCard, Badge, Loader } from '../components/UI';
import { fmt, fmtNum } from '../utils/format';

const GEO_MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];

function BarChart({ data, dataKey, color, label, formatValue }) {
    const { t } = useApp();
    const max = Math.max(...data.map(d => d[dataKey]), 1);

    return (
        <Card>
            <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>{label}</h3>
            {data.length === 0 ? (
                <p className="text-sm" style={{ color: t.textFaint }}>მონაცემები არ არის</p>
            ) : (
                <div className="flex items-end gap-1.5" style={{ height: 180 }}>
                    {data.map((d, i) => {
                        const h = Math.max((d[dataKey] / max) * 140, 4);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative" style={{ minWidth: 0 }}>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className="rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap shadow-lg border"
                                        style={{ background: t.cardBg || t.input, borderColor: t.border, color: t.text }}>
                                        {formatValue(d[dataKey])}
                                    </div>
                                </div>
                                <div
                                    className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                                    style={{ height: h, background: color, minHeight: 4, opacity: 0.85 }}
                                />
                                <span className="text-[10px] leading-tight truncate w-full text-center" style={{ color: t.textFaint }}>
                                    {d.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}

export function DashboardPage() {
    const { toast, t } = useApp();
    const [stats, setStats] = useState({ products: 0, totalStock: 0, totalRevenue: 0, totalProfit: 0 });
    const [lowStock, setLowStock] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [allSales, setAllSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [inv, recentSalesRes, allSalesRes, profit] = await Promise.all([
                supabase.from("inventory").select("*"),
                supabase.from("sales").select("*, customers(full_name), products(*, categories(name), colors(name))").order("created_at", { ascending: false }).limit(5),
                supabase.from("sales").select("id, sale_price, quantity, created_at, products(purchase_price)").order("created_at", { ascending: true }),
                supabase.from("profit_report").select("*"),
            ]);
            const inventory = inv.data || [];
            const profitData = profit.data || [];
            setStats({
                products: inventory.length,
                totalStock: inventory.reduce((s, i) => s + (i.stock || 0), 0),
                totalRevenue: profitData.reduce((s, i) => s + (i.total_revenue || 0), 0),
                totalProfit: profitData.reduce((s, i) => s + (i.total_profit || 0), 0),
            });
            setLowStock(inventory.filter(i => i.stock <= 10 && i.stock >= 0));
            setRecentSales(recentSalesRes.data || []);
            setAllSales(allSalesRes.data || []);
        } catch (e) { toast("მონაცემების ჩატვირთვა ვერ მოხერხდა", "error"); }
        finally { setLoading(false); }
    };

    const monthlyData = useMemo(() => {
        if (!allSales.length) return [];
        const map = {};
        allSales.forEach(s => {
            const d = new Date(s.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!map[key]) map[key] = { revenue: 0, profit: 0, month: d.getMonth(), year: d.getFullYear() };
            const rev = (s.sale_price || 0) * (s.quantity || 0);
            const cost = (s.products?.purchase_price || 0) * (s.quantity || 0);
            map[key].revenue += rev;
            map[key].profit += rev - cost;
        });
        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-12)
            .map(([, v]) => ({
                label: GEO_MONTHS[v.month],
                revenue: Math.round(v.revenue),
                profit: Math.round(v.profit),
            }));
    }, [allSales]);

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 page-enter">
            <div>
                <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>მიმოხილვა</h2>
                <p className="text-sm mt-1" style={{ color: t.textMuted }}>საწყობის მდგომარეობა</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="პროდუქტები" value={fmtNum(stats.products)} sub="სახეობა" />
                <StatCard label="სტოკი სულ" value={fmtNum(stats.totalStock)} sub="ლისტი" color="#60a5fa" />
                <StatCard label="შემოსავალი" value={fmt(stats.totalRevenue)} sub="სულ გაყიდვები" color="#34d399" />
                <StatCard label="მოგება" value={fmt(stats.totalProfit)} sub="სუფთა მოგება" color="#a78bfa" />
            </div>
            {monthlyData.length > 0 && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <BarChart data={monthlyData} dataKey="revenue" color="#34d399" label="თვიური შემოსავალი" formatValue={fmt} />
                    <BarChart data={monthlyData} dataKey="profit" color="#a78bfa" label="თვიური მოგება" formatValue={fmt} />
                </div>
            )}
            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>მცირე სტოკი</h3>
                    {lowStock.length === 0 ? (
                        <p className="text-sm" style={{ color: t.textFaint }}>ყველა პროდუქტი კარგ მდგომარეობაშია</p>
                    ) : (
                        <div className="space-y-2">
                            {lowStock.map(p => (
                                <div key={p.product_id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.input }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: t.text }}>{p.color} — {p.category}</p>
                                        <p className="text-xs" style={{ color: t.textFaint }}>{p.thickness}</p>
                                    </div>
                                    <Badge color={p.stock === 0 ? "red" : "gold"}>{p.stock} ლისტი</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>🛒 ბოლო გაყიდვები</h3>
                    {recentSales.length === 0 ? (
                        <p className="text-sm" style={{ color: t.textFaint }}>გაყიდვები ჯერ არ არის</p>
                    ) : (
                        <div className="space-y-2">
                            {recentSales.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.input }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: t.text }}>{s.customers?.full_name || "უცნობი"}</p>
                                        <p className="text-xs" style={{ color: t.textFaint }}>{s.products?.colors?.name} — {s.quantity} ლისტი</p>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: "#34d399" }}>{fmt(s.sale_price * s.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
