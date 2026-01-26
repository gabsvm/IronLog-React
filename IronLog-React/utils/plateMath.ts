
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

export const calculatePlates = (targetWeight: number, barWeight = 20): { plates: PlateConfig[], remainder: number } => {
    let weightPerSide = (targetWeight - barWeight) / 2;
    const result: PlateConfig[] = [];

    if (weightPerSide <= 0) return { plates: [], remainder: 0 };

    for (const plate of STANDARD_PLATES) {
        while (weightPerSide >= plate.weight) {
            result.push(plate);
            weightPerSide -= plate.weight;
        }
    }

    return { plates: result, remainder: weightPerSide * 2 }; // Remainder is total remaining weight
};
