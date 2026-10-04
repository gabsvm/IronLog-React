
import type { WeightUnit } from '../types';

export interface PlateConfig {
    weight: number;
    color: string;
    heightClass: string; // Tailwind height class for visual sizing
}

export const STANDARD_PLATES: PlateConfig[] = [
    { weight: 25, color: 'bg-red-600', heightClass: 'h-16' },
    { weight: 20, color: 'bg-blue-600', heightClass: 'h-16' },
    { weight: 15, color: 'bg-yellow-500', heightClass: 'h-14' },
    { weight: 10, color: 'bg-green-600', heightClass: 'h-12' },
    { weight: 5, color: 'bg-white border-4 border-zinc-800', heightClass: 'h-10' },
    { weight: 2.5, color: 'bg-zinc-800', heightClass: 'h-8' },
    { weight: 1.25, color: 'bg-zinc-500', heightClass: 'h-6' },
];

/** Q11: pound plate set (45/35/25/10/5/2.5). */
export const STANDARD_PLATES_LB: PlateConfig[] = [
    { weight: 45, color: 'bg-red-600', heightClass: 'h-16' },
    { weight: 35, color: 'bg-blue-600', heightClass: 'h-16' },
    { weight: 25, color: 'bg-yellow-500', heightClass: 'h-14' },
    { weight: 10, color: 'bg-green-600', heightClass: 'h-12' },
    { weight: 5, color: 'bg-white border-4 border-zinc-800', heightClass: 'h-10' },
    { weight: 2.5, color: 'bg-zinc-800', heightClass: 'h-8' },
];

export const BAR_WEIGHT: Record<WeightUnit, number> = { kg: 20, lb: 45 };

/**
 * Greedy plate loader. targetWeight/barWeight are in the given unit
 * (default kg with a 20 kg bar — unchanged legacy behavior).
 */
export const calculatePlates = (targetWeight: number, barWeight?: number, inventory: Record<number, number> | null = null, unit: WeightUnit = 'kg'): { plates: PlateConfig[], remainder: number } => {
    const plates = unit === 'lb' ? STANDARD_PLATES_LB : STANDARD_PLATES;
    const bar = barWeight ?? BAR_WEIGHT[unit];
    let weightPerSide = (targetWeight - bar) / 2;
    const result: PlateConfig[] = [];

    if (weightPerSide <= 0) return { plates: [], remainder: targetWeight - bar < 0 ? 0 : targetWeight - bar };

    for (const plate of plates) {
        let availablePerSide = Infinity;
        if (inventory) {
            availablePerSide = Math.floor((inventory[plate.weight] || 0) / 2);
        }

        let added = 0;
        while (weightPerSide >= plate.weight && added < availablePerSide) {
            result.push(plate);
            weightPerSide -= plate.weight;
            added++;
        }
    }

    return { plates: result, remainder: weightPerSide * 2 };
};
