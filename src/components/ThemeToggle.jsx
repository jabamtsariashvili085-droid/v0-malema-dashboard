import React from 'react';
import { useApp } from '../context/AppContext';

export function ThemeToggle({ dark, onToggle }) {
    const { t } = useApp();
    return (
        <button
            onClick={onToggle}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ color: t.textMuted }}
        >
            <div className="w-10 h-5 rounded-full relative transition-all flex items-center px-0.5"
                style={{ background: dark ? "#374151" : t.accent }}>
                <div className="w-4 h-4 rounded-full bg-white shadow transition-all duration-300 flex items-center justify-center"
                    style={{ transform: dark ? "translateX(0)" : "translateX(20px)" }}>
                    <span className="text-[8px]">{dark ? "🌙" : "☀️"}</span>
                </div>
            </div>
            {dark ? "მუქი რეჟიმი" : "ნათელი რეჟიმი"}
        </button>
    );
}
