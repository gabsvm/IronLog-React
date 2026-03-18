import React from 'react';

interface MacroRingProps {
  calories: number;
  goalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  calories, goalCalories, protein, carbs, fat, size = 160
}) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const strokeW = size * 0.09;
  const circumference = 2 * Math.PI * r;

  const totalCalFromMacros = protein * 4 + carbs * 4 + fat * 9;
  const proteinPct = totalCalFromMacros > 0 ? (protein * 4) / totalCalFromMacros : 0;
  const carbsPct   = totalCalFromMacros > 0 ? (carbs * 4)   / totalCalFromMacros : 0;
  const fatPct     = totalCalFromMacros > 0 ? (fat * 9)     / totalCalFromMacros : 0;

  const gap = circumference * 0.015;
  const segments = [
    { pct: proteinPct, color: '#3b82f6' },  // blue — protein
    { pct: carbsPct,   color: '#f59e0b' },  // amber — carbs
    { pct: fatPct,     color: '#ec4899' },  // pink  — fat
  ];

  let offset = 0;
  const arcs = segments.map(seg => {
    const len = circumference * seg.pct - gap;
    const arc = { ...seg, dashArray: `${Math.max(0, len)} ${circumference - Math.max(0, len)}`, dashOffset: -offset };
    offset += circumference * seg.pct;
    return arc;
  });

  const progress = Math.min(calories / Math.max(goalCalories, 1), 1);
  const calPct = Math.round(progress * 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={strokeW} />
        {/* Macro arcs */}
        {arcs.map((arc, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={strokeW}
            strokeDasharray={arc.dashArray}
            strokeDashoffset={arc.dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        ))}
      </svg>
      {/* Center text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white leading-none">{calories}</span>
        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">kcal</span>
        <span className="text-[10px] text-zinc-600">{calPct}%</span>
      </div>
    </div>
  );
};