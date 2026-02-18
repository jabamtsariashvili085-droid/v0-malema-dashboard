import React from 'react';
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
