/**
 * Resolve theme CSS variables to concrete colors for <canvas> consumers
 * (Chart.js datasets, gradients). Canvas 2D does not resolve `var(--x)`,
 * so `rgb(var(--primary-500))` paints black — read the computed value
 * instead. Theme vars in index.css use the space-separated "R G B" format.
 */

export const PRIMARY_500_FALLBACK = '#c4f13a';

const FIXED_INTENSITY_COLORS = ['#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#9333ea'];

export const resolveCssVarColor = (varName: string, fallback: string): string => {
    if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
        return fallback;
    }
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    if (!raw) return fallback;

    const parts = raw.split(/[\s,]+/).filter(part => part.length > 0);
    if (parts.length === 3 && parts.every(part => !Number.isNaN(Number(part)))) {
        return `rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`;
    }
    if (parts.length === 4 && parts.every(part => !Number.isNaN(Number(part)))) {
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${parts[3]})`;
    }
    // Already a concrete color (hex, rgb(), hsl(), named): pass through.
    return raw;
};

/** Current theme's primary-500 as a canvas-safe color. */
export const primaryChartColor = (): string =>
    resolveCssVarColor('--primary-500', PRIMARY_500_FALLBACK);

/** Palette for the intensity doughnut: themed primary + fixed segments. */
export const buildIntensityPalette = (): string[] => [
    primaryChartColor(),
    ...FIXED_INTENSITY_COLORS,
];

export interface DoughnutData {
    labels: string[];
    datasets: [{ data: number[]; backgroundColor: string[]; borderWidth: number; hoverOffset: number }];
}

/** Doughnut dataset for set-type distribution (labels from TRANSLATIONS types). */
export const buildDoughnutData = (
    setTypeDist: Record<string, number>,
    types: Record<string, string>,
): DoughnutData => {
    const entries = Object.entries(setTypeDist);
    const palette = buildIntensityPalette();
    return {
        labels: entries.map(([type]) => types[type] || type),
        datasets: [{
            data: entries.map(([, count]) => count),
            backgroundColor: entries.map((_, i) => palette[i % palette.length]),
            borderWidth: 0,
            hoverOffset: 4,
        }],
    };
};
