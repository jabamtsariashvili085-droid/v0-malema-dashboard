import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { fmtNum } from '../utils/format';

export function NotificationBell() {
    const { t } = useApp();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const items = [];

            // Low stock alerts
            const { data: inventory } = await supabase.from("inventory").select("*");
            if (inventory) {
                const outOfStock = inventory.filter(i => i.stock === 0);
                const lowStock = inventory.filter(i => i.stock > 0 && i.stock <= 5);

                outOfStock.forEach(p => {
                    items.push({
                        id: `out-${p.product_id}`,
                        type: "danger",
                        title: "სტოკი ამოიწურა",
                        message: `${p.color} - ${p.category} (${p.thickness})`,
                        time: null,
                    });
                });

                lowStock.forEach(p => {
                    items.push({
                        id: `low-${p.product_id}`,
                        type: "warning",
                        title: `მცირე სტოკი: ${fmtNum(p.stock)} ლისტი`,
                        message: `${p.color} - ${p.category} (${p.thickness})`,
                        time: null,
                    });
                });
            }

            // Recent sales (last 24h)
            const since = new Date();
            since.setHours(since.getHours() - 24);
            const { data: recentSales } = await supabase
                .from("sales")
                .select("*, customers(full_name), products(*, categories(name), colors(name))")
                .gte("created_at", since.toISOString())
                .order("created_at", { ascending: false })
                .limit(5);

            if (recentSales) {
                recentSales.forEach(s => {
                    items.push({
                        id: `sale-${s.id}`,
                        type: "success",
                        title: "ახალი გაყიდვა",
                        message: `${s.products?.colors?.name} - ${s.products?.categories?.name} (${s.quantity} ლ.) ${s.customers?.full_name ? `- ${s.customers.full_name}` : ""}`,
                        time: s.created_at,
                    });
                });
            }

            setNotifications(items);
        } catch (e) {
            // Silently handle errors
        }
        setLoading(false);
    };

    const dangerCount = notifications.filter(n => n.type === "danger" || n.type === "warning").length;

    const typeStyles = {
        danger: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", icon: "!" },
        warning: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", icon: "!" },
        success: { bg: "rgba(52,211,153,0.1)", color: "#34d399", icon: "+" },
        info: { bg: "rgba(96,165,250,0.1)", color: "#60a5fa", icon: "i" },
    };

    const formatTime = (time) => {
        if (!time) return "";
        const diff = Date.now() - new Date(time).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} წთ. წინ`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} სთ. წინ`;
        return new Date(time).toLocaleDateString("ka-GE");
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg transition-colors"
                style={{ color: t.textMuted, background: open ? t.accentBg : "transparent" }}
                aria-label="Notifications"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {dangerCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#ef4444" }}>
                        {dangerCount > 9 ? "9+" : dangerCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border shadow-2xl z-50"
                    style={{ background: t.sidebar, borderColor: t.border }}
                >
                    <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: t.border }}>
                        <h4 className="font-semibold text-sm" style={{ color: t.text }}>შეტყობინებები</h4>
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: t.accentBg, color: t.accent }}>
                            {notifications.length}
                        </span>
                    </div>

                    {loading && notifications.length === 0 ? (
                        <div className="p-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${t.accent}30`, borderTopColor: t.accent }} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="text-sm" style={{ color: t.textFaint }}>შეტყობინებები არ არის</p>
                        </div>
                    ) : (
                        <div className="p-2">
                            {notifications.map(n => {
                                const style = typeStyles[n.type] || typeStyles.info;
                                return (
                                    <div key={n.id} className="flex gap-3 p-3 rounded-xl transition-colors hover:opacity-80" style={{ background: "transparent" }}>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: style.bg, color: style.color }}>
                                            {style.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium" style={{ color: style.color }}>{n.title}</p>
                                            <p className="text-xs truncate" style={{ color: t.textFaint }}>{n.message}</p>
                                            {n.time && <p className="text-[10px] mt-0.5" style={{ color: t.textFaint }}>{formatTime(n.time)}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
