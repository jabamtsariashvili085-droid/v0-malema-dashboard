import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from './Icons';

export function Modal({ title, onClose, children }) {
    const { t } = useApp();
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto">
            <div className="absolute inset-0 backdrop-blur-sm" style={{ background: t.overlay }} onClick={onClose} />
            <div className="relative rounded-2xl w-full max-w-md shadow-2xl border glass flex flex-col my-auto sm:my-0" style={{ borderColor: t.border }}>
                <div className="flex items-center justify-between p-6 border-b shrink-0" style={{ borderColor: t.border }}>
                    <h3 className="text-lg font-semibold font-display" style={{ color: t.text }}>{title}</h3>
                    <button onClick={onClose} style={{ color: t.textFaint }} className="hover:opacity-70 transition-opacity">{Icon.close}</button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export function Input({ label, ...props }) {
    const { t } = useApp();
    return (
        <div className="mb-4">
            {label && <label className="block text-sm mb-1.5 font-medium" style={{ color: t.textMuted }}>{label}</label>}
            <input
                className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all text-sm border"
                style={{ background: t.input, borderColor: t.inputBorder, color: t.text }}
                {...props}
            />
        </div>
    );
}

export function Select({ label, children, ...props }) {
    const { t } = useApp();
    return (
        <div className="mb-4">
            {label && <label className="block text-sm mb-1.5 font-medium" style={{ color: t.textMuted }}>{label}</label>}
            <select
                className="w-full rounded-xl px-4 py-3 focus:outline-none transition-all text-sm border"
                style={{ background: t.selectBg, borderColor: t.inputBorder, color: t.text }}
                {...props}
            >
                {children}
            </select>
        </div>
    );
}

export function Btn({ children, variant = "primary", className = "", style = {}, ...props }) {
    const { t } = useApp();
    const base = "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50 cursor-pointer border";

    const getStyle = () => {
        if (variant === "primary") return { background: t.accent, color: t.accentText, borderColor: t.accent };
        if (variant === "ghost") return { background: t.input, color: t.text, borderColor: t.inputBorder };
        if (variant === "danger") return { background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" };
        if (variant === "success") return { background: "rgba(52,211,153,0.1)", color: "#34d399", borderColor: "rgba(52,211,153,0.2)" };
        return {};
    };

    return (
        <button className={`${base} ${className}`} style={{ ...getStyle(), ...style }} {...props}>
            {children}
        </button>
    );
}

export function Card({ children, className = "" }) {
    const { t } = useApp();
    return (
        <div className={`rounded-2xl p-6 border glass ${className}`} style={{ borderColor: t.border }}>
            {children}
        </div>
    );
}

export function StatCard({ label, value, sub, color }) {
    const { t } = useApp();
    return (
        <div className="glow-card rounded-2xl p-6 border glass" style={{ borderColor: t.border, '--glow-color': color || t.accent }}>
            <div className="glow-content">
                <p className="text-sm mb-2" style={{ color: t.textMuted }}>{label}</p>
                <p className="text-2xl font-bold font-display" style={{ color: color || t.accent }}>{value}</p>
                {sub && <p className="text-xs mt-1" style={{ color: t.textFaint }}>{sub}</p>}
            </div>
        </div>
    );
}

export function Badge({ children, color = "gold" }) {
    const { t } = useApp();
    const colors = {
        gold: { background: t.accentBg, color: t.accent },
        green: { background: "rgba(52,211,153,0.15)", color: "#34d399" },
        red: { background: "rgba(239,68,68,0.15)", color: "#ef4444" },
        blue: { background: "rgba(96,165,250,0.15)", color: "#60a5fa" },
        gray: { background: t.input, color: t.textMuted },
    };
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium" style={colors[color]}>
            {children}
        </span>
    );
}

export function Toast({ msg, type = "success", onClose }) {
    const { useEffect } = React;
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
    return (
        <div className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-3 animate-slide-up text-white`}
            style={{ background: type === "success" ? "#22c55e" : "#ef4444" }}>
            {type === "success" ? "✓" : "✕"} {msg}
        </div>
    );
}

export function SearchInput({ value, onChange, placeholder = "ძებნა..." }) {
    const { t } = useApp();
    return (
        <div className="relative flex-1 max-w-md">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: t.textFaint }}>
                🔍
            </div>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl pl-10 pr-10 py-2.5 focus:outline-none transition-all text-sm border"
                style={{
                    background: t.input,
                    borderColor: value ? t.accent : t.inputBorder,
                    color: t.text
                }}
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                    style={{ color: t.textFaint }}
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export function Logo({ size = "md", className = "" }) {
    const { t } = useApp();
    const dims = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-2xl"
    }[size];

    return (
        <div className={`${dims} rounded-xl flex items-center justify-center font-bold font-display border shadow-sm ${className}`}
            style={{
                background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accent}dd 100%)`,
                borderColor: t.accentBorder,
                color: "white",
                textShadow: "0 1px 2px rgba(0,0,0,0.2)"
            }}>
            M
        </div>
    );
}

export function Loader() {
    const { t } = useApp();
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${t.accent}30`, borderTopColor: t.accent }} />
        </div>
    );
}

/* ── Date Range Filter ── */
export function DateRangeFilter({ value, onChange }) {
    const { t } = useApp();
    const presets = useMemo(() => {
        const now = new Date();
        const y = now.getFullYear(), m = now.getMonth();
        const startOfMonth = new Date(y, m, 1).toISOString().slice(0, 10);
        const startOfLastMonth = new Date(y, m - 1, 1).toISOString().slice(0, 10);
        const endOfLastMonth = new Date(y, m, 0).toISOString().slice(0, 10);
        const start3Months = new Date(y, m - 2, 1).toISOString().slice(0, 10);
        const today = now.toISOString().slice(0, 10);
        return [
            { label: "ყველა", from: "", to: "" },
            { label: "ეს თვე", from: startOfMonth, to: today },
            { label: "წინა თვე", from: startOfLastMonth, to: endOfLastMonth },
            { label: "3 თვე", from: start3Months, to: today },
        ];
    }, []);

    const [mode, setMode] = useState("ყველა");

    const handlePreset = (p) => {
        setMode(p.label);
        onChange({ from: p.from, to: p.to });
    };

    const handleCustom = (field, val) => {
        setMode("custom");
        onChange({ ...value, [field]: val });
    };

    return (
        <div className="flex flex-wrap items-center gap-2">
            {presets.map((p) => (
                <button
                    key={p.label}
                    onClick={() => handlePreset(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                    style={{
                        background: mode === p.label ? t.accent : t.input,
                        color: mode === p.label ? t.accentText : t.textMuted,
                        borderColor: mode === p.label ? t.accent : t.inputBorder,
                    }}
                >
                    {p.label}
                </button>
            ))}
            <div className="flex items-center gap-1.5">
                <input
                    type="date"
                    value={value.from}
                    onChange={(e) => handleCustom("from", e.target.value)}
                    className="rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none"
                    style={{ background: t.input, borderColor: mode === "custom" ? t.accent : t.inputBorder, color: t.text }}
                />
                <span className="text-xs" style={{ color: t.textFaint }}>-</span>
                <input
                    type="date"
                    value={value.to}
                    onChange={(e) => handleCustom("to", e.target.value)}
                    className="rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none"
                    style={{ background: t.input, borderColor: mode === "custom" ? t.accent : t.inputBorder, color: t.text }}
                />
            </div>
        </div>
    );
}

/* ── Pagination ── */
export function Pagination({ currentPage, totalPages, onPageChange, totalItems, perPage }) {
    const { t } = useApp();

    if (totalPages <= 1) return null;

    const pages = useMemo(() => {
        const arr = [];
        const delta = 1;
        const left = Math.max(2, currentPage - delta);
        const right = Math.min(totalPages - 1, currentPage + delta);

        arr.push(1);
        if (left > 2) arr.push("...");
        for (let i = left; i <= right; i++) arr.push(i);
        if (right < totalPages - 1) arr.push("...");
        if (totalPages > 1) arr.push(totalPages);
        return arr;
    }, [currentPage, totalPages]);

    const start = (currentPage - 1) * perPage + 1;
    const end = Math.min(currentPage * perPage, totalItems);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t" style={{ borderColor: t.border }}>
            <span className="text-xs" style={{ color: t.textFaint }}>
                {start}-{end} / {totalItems}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-30"
                    style={{ background: t.input, color: t.textMuted, borderColor: t.inputBorder }}
                >
                    &laquo;
                </button>
                {pages.map((p, i) =>
                    p === "..." ? (
                        <span key={`dot-${i}`} className="px-1.5 text-xs" style={{ color: t.textFaint }}>...</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className="w-8 h-8 rounded-lg text-xs font-medium border transition-all"
                            style={{
                                background: currentPage === p ? t.accent : t.input,
                                color: currentPage === p ? t.accentText : t.textMuted,
                                borderColor: currentPage === p ? t.accent : t.inputBorder,
                            }}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-30"
                    style={{ background: t.input, color: t.textMuted, borderColor: t.inputBorder }}
                >
                    &raquo;
                </button>
            </div>
        </div>
    );
}

/* ── Confirm Dialog ── */
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "დადასტურება", cancelLabel = "გაუქმება", variant = "danger" }) {
    const { t } = useApp();

    if (!open) return null;

    const confirmStyle = variant === "danger"
        ? { background: "#ef4444", color: "#fff", borderColor: "#ef4444" }
        : { background: t.accent, color: t.accentText, borderColor: t.accent };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 backdrop-blur-sm animate-fade-in" style={{ background: t.overlay }} onClick={onCancel} />
            <div
                className="relative rounded-2xl w-full max-w-sm shadow-2xl border glass animate-scale-in p-6"
                style={{ borderColor: t.border }}
            >
                <div className="flex items-center gap-3 mb-3">
                    {variant === "danger" && (
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(239,68,68,0.12)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                    )}
                    <h3 className="text-base font-semibold font-display" style={{ color: t.text }}>{title}</h3>
                </div>
                <p className="text-sm mb-6" style={{ color: t.textMuted }}>{message}</p>
                <div className="flex items-center gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                        style={{ background: t.input, color: t.text, borderColor: t.inputBorder }}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                        style={confirmStyle}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── usePagination hook ── */
export function usePagination(items, perPage = 20) {
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));
    const safePage = Math.min(page, totalPages);

    const paged = useMemo(
        () => items.slice((safePage - 1) * perPage, safePage * perPage),
        [items, safePage, perPage]
    );

    const goTo = useCallback((p) => {
        setPage(Math.max(1, Math.min(p, totalPages)));
    }, [totalPages]);

    // Reset page when items change significantly
    React.useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages]);

    return { page: safePage, totalPages, paged, goTo, totalItems: items.length, perPage };
}

/* ── useConfirm hook ── */
export function useConfirm() {
    const [state, setState] = useState({ open: false, title: "", message: "", resolve: null, variant: "danger" });

    const confirm = useCallback((title, message, variant = "danger") => {
        return new Promise((resolve) => {
            setState({ open: true, title, message, resolve, variant });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState((s) => ({ ...s, open: false }));
    }, [state.resolve]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState((s) => ({ ...s, open: false }));
    }, [state.resolve]);

    const dialogProps = {
        open: state.open,
        title: state.title,
        message: state.message,
        variant: state.variant,
        onConfirm: handleConfirm,
        onCancel: handleCancel,
    };

    return { confirm, dialogProps };
}
