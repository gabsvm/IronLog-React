// SettingsParity owner: pure plate-calculator math (Strong parity).
// All values canonical kg. Unlimited supply of each ENABLED denomination is
// assumed (Strong behaves the same: you tick the plates your gym has).
// Integer-gram greedy avoids float drift; never throws.

export interface PlateLoadResult {
    /** Plates on ONE side, canonical kg, descending. */
    perSideKg: number[];
    /** Bar + both sides actually loaded, canonical kg. */
    loadedKg: number;
    /** targetKg - loadedKg (>= 0 when target >= bar; negative = under bar). */
    remainderKg: number;
    barKg: number;
}

const toGrams = (kg: number): number => Math.round(Number(kg) * 1000);

export const computePlateLoading = (
    targetKg: number,
    barKg: number,
    platesDescKg: number[],
): PlateLoadResult => {
    const targetG = toGrams(targetKg);
    const barG = toGrams(barKg);
    if (!Number.isFinite(targetG) || !Number.isFinite(barG) || barG <= 0) {
        return { perSideKg: [], loadedKg: 0, remainderKg: Number(targetKg) || 0, barKg: Number(barKg) || 0 };
    }
    if (targetG <= barG) {
        return { perSideKg: [], loadedKg: barKg, remainderKg: Math.round((targetKg - barKg) * 1000) / 1000, barKg };
    }
    const platesG = platesDescKg.map(toGrams).filter((g) => g > 0).sort((a, b) => b - a);
    let remainingSideG = Math.floor((targetG - barG) / 2);
    const perSideG: number[] = [];
    for (const plateG of platesG) {
        while (plateG <= remainingSideG) {
            perSideG.push(plateG);
            remainingSideG -= plateG;
        }
    }
    const loadedG = targetG - remainingSideG * 2;
    return {
        perSideKg: perSideG.map((g) => g / 1000),
        loadedKg: Math.round(loadedG) / 1000,
        remainderKg: Math.round(remainingSideG * 2) / 1000,
        barKg,
    };
};

/** Bar presets, canonical kg. */
export const BAR_PRESETS_KG: number[] = [20, 15, 10];
/** Bar presets sold in lb, canonical kg (45/35/15 lb). */
export const BAR_PRESETS_LB_KG: number[] = [45, 35, 15].map((lb) => Math.round(lb * 0.45359237 * 10000) / 10000);

/** Format a canonical-kg plate/bar in the display unit, no grouping. */
export const formatPlateWeight = (kg: number, unit: 'kg' | 'lb'): string => {
    const value = unit === 'lb' ? kg / 0.45359237 : kg;
    return String(Math.round(value * 100) / 100).replace(/\.0+$/, '').replace(/(\.\d)0$/, '$1');
};
