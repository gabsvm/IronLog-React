// SettingsParity owner: plate inventory + live loading calculator.
// Every control writes prefs (bar/plates) or derives from them: the preview
// recomputes from the same inventory, so nothing here is decorative.
import React, { useMemo, useState } from 'react';
import type { Lang, WeightUnit } from '../../../../types';
import { platesFor, fromDisplay, toDisplay } from '../../../../utils/units';
import { BAR_PRESETS_KG, BAR_PRESETS_LB_KG, computePlateLoading, formatPlateWeight } from '../../../../utils/plateCalculator';
import { getStrongTrainingCopy } from './strongTrainingCopy';

const sameKg = (a: number, b: number): boolean => Math.abs(a - b) < 0.005;

export const PlateCalculatorCard: React.FC<{
    lang: Lang;
    weightUnit: WeightUnit;
    barKg: number;
    platesKg: number[];
    onBarChange: (barKg: number) => void;
    onPlatesChange: (platesKg: number[]) => void;
}> = ({ lang, weightUnit, barKg, platesKg, onBarChange, onPlatesChange }) => {
    const c = getStrongTrainingCopy(lang);
    const [target, setTarget] = useState('');

    const barOptions = weightUnit === 'lb' ? BAR_PRESETS_LB_KG : BAR_PRESETS_KG;
    const plateOptions = platesFor(weightUnit);

    const togglePlate = (plateKg: number) => {
        const has = platesKg.some((p) => sameKg(p, plateKg));
        const next = has ? platesKg.filter((p) => !sameKg(p, plateKg)) : [...platesKg, plateKg];
        next.sort((a, b) => b - a);
        onPlatesChange(next);
    };

    const result = useMemo(() => {
        const n = Number(String(target).replace(',', '.'));
        if (!Number.isFinite(n) || n <= 0) return null;
        return computePlateLoading(fromDisplay(n, weightUnit), barKg, platesKg);
    }, [target, weightUnit, barKg, platesKg]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{c.plateBar}</span>
                <div
                    className="gl-connected flex w-full gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] p-1 sm:w-auto [&>button]:flex-1"
                    role="group"
                    aria-label={c.plateBar}
                >
                    {barOptions.map((bar) => (
                        <button
                            key={bar}
                            type="button"
                            onClick={() => onBarChange(bar)}
                            aria-pressed={sameKg(barKg, bar)}
                            className={`min-h-[44px] px-3 text-xs rounded-lg font-semibold transition-all ${
                                sameKg(barKg, bar)
                                    ? 'bg-primary-500 text-black shadow-sm'
                                    : 'text-muted hover:text-[rgb(var(--text-primary))]'
                            }`}
                        >
                            {formatPlateWeight(bar, weightUnit)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-3 pt-0">
                <div className="mb-2 text-sm font-medium text-[rgb(var(--text-primary))]">{c.platePlates}</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={c.platePlates}>
                    {plateOptions.map((plate) => {
                        const canonical = fromDisplay(plate, weightUnit);
                        const active = platesKg.some((p) => sameKg(p, canonical));
                        return (
                            <button
                                key={plate}
                                type="button"
                                onClick={() => togglePlate(canonical)}
                                aria-pressed={active}
                                className={`min-h-[44px] min-w-[52px] px-3 rounded-xl border text-xs font-bold transition-all ${
                                    active
                                        ? 'border-primary-500 bg-primary-500/15 text-[rgb(var(--text-primary))]'
                                        : 'border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated))] text-muted'
                                }`}
                            >
                                {formatPlateWeight(canonical, weightUnit)}
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{c.plateTarget}</span>
                <input
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    inputMode="decimal"
                    placeholder={c.plateTargetPlaceholder}
                    aria-label={c.plateTarget}
                    className="gl-input gl-num w-32 text-right font-bold"
                />
            </div>
            {result && (
                <div className="px-3 pb-3" aria-live="polite">
                    <div className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-elevated)/0.5)] p-3">
                        {result.perSideKg.length === 0 ? (
                            <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                                {result.remainderKg < 0 ? c.plateUnderBar : c.plateBarOnly}
                            </div>
                        ) : (
                            <div className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                                {c.platePerSide}: {result.perSideKg.map((p) => formatPlateWeight(p, weightUnit)).join(' + ')}
                            </div>
                        )}
                        <div className="gl-num mt-1 text-xs text-muted">
                            {c.plateTotal}: {toDisplay(result.loadedKg, weightUnit)} · {c.plateRemainder}: {toDisplay(result.remainderKg, weightUnit)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
