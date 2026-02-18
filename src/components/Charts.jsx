import React from 'react';
import { useApp } from '../context/AppContext';

export function BarChart({ data, height = 200, barColor }) {
    const { t } = useApp();
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const color = barColor || t.accent;

    return (
        <div className="w-full" style={{ height }}>
            <div className="flex items-end gap-1 h-full">
                {data.map((d, i) => {
                    const barHeight = (d.value / maxValue) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative">
                            <div
                                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
                                style={{ background: t.card, color: t.text, border: `1px solid ${t.border}` }}
                            >
                                {d.label}: {d.displayValue || d.value}
                            </div>
                            <div
                                className="w-full rounded-t-md transition-all duration-500 min-h-[2px]"
                                style={{
                                    height: `${barHeight}%`,
                                    background: `linear-gradient(to top, ${color}, ${color}cc)`,
                                    opacity: 0.85,
                                }}
                            />
                            <span className="text-[10px] truncate w-full text-center" style={{ color: t.textFaint }}>
                                {d.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function LineChart({ data, height = 200, lineColor }) {
    const { t } = useApp();
    if (!data || data.length < 2) return null;

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const color = lineColor || t.accent;
    const padding = 24;
    const svgWidth = 500;
    const svgHeight = height - 24;

    const points = data.map((d, i) => ({
        x: padding + (i / (data.length - 1)) * (svgWidth - padding * 2),
        y: svgHeight - padding - ((d.value / maxValue) * (svgHeight - padding * 2)),
        ...d,
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - padding} L ${points[0].x} ${svgHeight - padding} Z`;

    return (
        <div className="w-full" style={{ height }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`area-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill={`url(#area-gradient-${color.replace('#', '')})`} />
                <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4" fill={color} stroke={t.card || '#fff'} strokeWidth="2" className="opacity-0 hover:opacity-100 transition-opacity" />
                        <text x={p.x} y={svgHeight - 4} textAnchor="middle" fill={t.textFaint} fontSize="9" fontFamily="inherit">
                            {p.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
}

export function DonutChart({ data, size = 160 }) {
    const { t } = useApp();
    if (!data || data.length === 0) return null;

    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return null;

    const radius = 60;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox="0 0 160 160">
                {data.map((d, i) => {
                    const pct = d.value / total;
                    const dashLength = circumference * pct;
                    const currentOffset = offset;
                    offset += dashLength;
                    return (
                        <circle
                            key={i}
                            cx="80" cy="80" r={radius}
                            fill="none"
                            stroke={d.color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                            strokeDashoffset={-currentOffset}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}
                        />
                    );
                })}
                <text x="80" y="76" textAnchor="middle" fill={t.text} fontSize="18" fontWeight="bold" fontFamily="inherit">
                    {total}
                </text>
                <text x="80" y="94" textAnchor="middle" fill={t.textFaint} fontSize="10" fontFamily="inherit">
                    {"სულ"}
                </text>
            </svg>
            <div className="flex flex-col gap-1.5">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs" style={{ color: t.textMuted }}>{d.label}</span>
                        <span className="text-xs font-medium" style={{ color: t.text }}>{d.displayValue || d.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
