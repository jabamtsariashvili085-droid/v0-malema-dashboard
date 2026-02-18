import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Card, StatCard, Badge, Loader } from '../components/UI';
import { fmt, fmtNum } from '../utils/format';
import { BarChart, LineChart, DonutChart } from '../components/Charts';

const DATE_FILTERS = [
    { id: "7d", label: "7 დღე" },
    { id: "30d", label: "30 დღე" },
    { id: "90d", label: "3 თვე" },
    { id: "all", label: "ყველა" },
];

function getDateRange(filterId) {
    const now = new Date();
    if (filterId === "all") return null;
    const days = filterId === "7d" ? 7 : filterId === "30d" ? 30 : 90;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    return from.toISOString();
}

export function DashboardPage() {
    const { toast, t } = useApp();
    const [inventory, setInventory] = useState([]);
    const [allSales, setAllSales] = useState([]);
    const [profitData, setProfitData] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState("30d");

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [inv, sales, profit] = await Promise.all([
                supabase.from("inventory").select("*"),
                supabase.from("sales").select("*, customers(full_name), products(*, categories(name), colors(name))").order("created_at", { ascending: false }),
                supabase.from("profit_report").select("*"),
            ]);
            setInventory(inv.data || []);
            setAllSales(sales.data || []);
            setProfitData(profit.data || []);
            setLowStock((inv.data || []).filter(i => i.stock <= 10 && i.stock >= 0));
        } catch (e) { toast("მონაცემების ჩატვირთვა ვერ მოხერხდა", "error"); }
        finally { setLoading(false); }
    };

    const filteredSales = useMemo(() => {
        const rangeStart = getDateRange(dateFilter);
        if (!rangeStart) return allSales;
        return allSales.filter(s => s.created_at >= rangeStart);
    }, [allSales, dateFilter]);

    const stats = useMemo(() => ({
        products: inventory.length,
        totalStock: inventory.reduce((s, i) => s + (i.stock || 0), 0),
        totalRevenue: profitData.reduce((s, i) => s + (i.total_revenue || 0), 0),
        totalProfit: profitData.reduce((s, i) => s + (i.total_profit || 0), 0),
        filteredRevenue: filteredSales.reduce((s, sale) => s + (sale.sale_price * sale.quantity), 0),
        filteredCount: filteredSales.length,
    }), [inventory, profitData, filteredSales]);

    const dailySalesData = useMemo(() => {
        const grouped = {};
        filteredSales.forEach(s => {
            const day = new Date(s.created_at).toLocaleDateString("ka-GE", { day: "2-digit", month: "short" });
            if (!grouped[day]) grouped[day] = 0;
            grouped[day] += s.sale_price * s.quantity;
        });
        return Object.entries(grouped).slice(-14).map(([label, value]) => ({
            label,
            value,
            displayValue: fmt(value),
        }));
    }, [filteredSales]);

    const dailyQuantityData = useMemo(() => {
        const grouped = {};
        filteredSales.forEach(s => {
            const day = new Date(s.created_at).toLocaleDateString("ka-GE", { day: "2-digit", month: "short" });
            if (!grouped[day]) grouped[day] = 0;
            grouped[day] += s.quantity;
        });
        return Object.entries(grouped).slice(-14).map(([label, value]) => ({
            label,
            value,
            displayValue: `${fmtNum(value)} ლ.`,
        }));
    }, [filteredSales]);

    const categoryDonutData = useMemo(() => {
        const colors = ["#e8b86d", "#60a5fa", "#34d399", "#f87171", "#a78bfa", "#fb923c"];
        const grouped = {};
        filteredSales.forEach(s => {
            const cat = s.products?.categories?.name || "სხვა";
            if (!grouped[cat]) grouped[cat] = 0;
            grouped[cat] += s.quantity;
        });
        return Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length],
                displayValue: `${fmtNum(value)} ლ.`,
            }));
    }, [filteredSales]);

    const recentSales = filteredSales.slice(0, 5);

    if (loading) return <Loader />;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold font-display" style={{ color: t.text }}>მიმოხილვა</h2>
                    <p className="text-sm mt-1" style={{ color: t.textMuted }}>საწყობის მდგომარეობა</p>
                </div>
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: t.input }}>
                    {DATE_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setDateFilter(f.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={dateFilter === f.id
                                ? { background: t.accent, color: t.accentText }
                                : { color: t.textMuted }
                            }
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="პროდუქტები" value={fmtNum(stats.products)} sub="სახეობა" />
                <StatCard label="სტოკი სულ" value={fmtNum(stats.totalStock)} sub="ლისტი" color="#60a5fa" />
                <StatCard label="შემოსავალი" value={fmt(stats.filteredRevenue)} sub={`${fmtNum(stats.filteredCount)} გაყიდვა`} color="#34d399" />
                <StatCard label="მოგება" value={fmt(stats.totalProfit)} sub="სუფთა მოგება" color="#a78bfa" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>შემოსავალი დღეების მიხედვით</h3>
                    {dailySalesData.length > 0 ? (
                        <BarChart data={dailySalesData} height={200} barColor="#34d399" />
                    ) : (
                        <p className="text-sm py-8 text-center" style={{ color: t.textFaint }}>მონაცემები არ არის ამ პერიოდში</p>
                    )}
                </Card>
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>გაყიდული ლისტები</h3>
                    {dailyQuantityData.length >= 2 ? (
                        <LineChart data={dailyQuantityData} height={200} lineColor="#60a5fa" />
                    ) : (
                        <p className="text-sm py-8 text-center" style={{ color: t.textFaint }}>საკმარისი მონაცემები არ არის</p>
                    )}
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>კატეგორიების მიხედვით</h3>
                    {categoryDonutData.length > 0 ? (
                        <DonutChart data={categoryDonutData} />
                    ) : (
                        <p className="text-sm py-4 text-center" style={{ color: t.textFaint }}>მონაცემები არ არის</p>
                    )}
                </Card>
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>მცირე სტოკი</h3>
                    {lowStock.length === 0 ? (
                        <p className="text-sm" style={{ color: t.textFaint }}>ყველა პროდუქტი კარგ მდგომარეობაშია</p>
                    ) : (
                        <div className="space-y-2">
                            {lowStock.slice(0, 6).map(p => (
                                <div key={p.product_id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.input }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: t.text }}>{p.color} -- {p.category}</p>
                                        <p className="text-xs" style={{ color: t.textFaint }}>{p.thickness}</p>
                                    </div>
                                    <Badge color={p.stock === 0 ? "red" : "gold"}>{p.stock} ლისტი</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
                <Card>
                    <h3 className="font-semibold mb-4 font-display" style={{ color: t.text }}>ბოლო გაყიდვები</h3>
                    {recentSales.length === 0 ? (
                        <p className="text-sm" style={{ color: t.textFaint }}>გაყიდვები ჯერ არ არის</p>
                    ) : (
                        <div className="space-y-2">
                            {recentSales.map(s => (
                                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: t.input }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: t.text }}>{s.customers?.full_name || "უცნობი"}</p>
                                        <p className="text-xs" style={{ color: t.textFaint }}>{s.products?.colors?.name} -- {s.quantity} ლისტი</p>
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
