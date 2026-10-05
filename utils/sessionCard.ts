// U8: shareable session summary image (1080x1350, portrait for stories/chats).
// buildSessionCardModel is pure (tested); renderSessionCard draws it on a
// canvas and returns a PNG Blob. Nothing personal beyond what the user sees on
// the summary screen (no email, no body weight).
import type { Log } from '../types';

export interface SessionCardModel {
    badge: string;
    title: string;
    date: string;
    stats: Array<{ label: string; value: string }>;
    topExercises: Array<{ name: string; detail: string }>;
    muscles: string[];
    footer: string;
}

export interface SessionCardLabels {
    workoutComplete: string;
    time: string;
    sets: string;
    totalVolume: string;
    musclesHit: string;
}

export const formatSessionDuration = (sec: number): string => {
    const safe = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const buildSessionCardModel = (input: {
    log: Log;
    labels: SessionCardLabels;
    locale: string;
    totals: { volume: number; sets: number; muscles: string[] };
    volumeText: string;
    exerciseName: (ex: Log['exercises'][number]) => string;
    bestSetText: (ex: Log['exercises'][number]) => string | null;
}): SessionCardModel => {
    const { log, labels, locale, totals } = input;
    const topExercises = (log.exercises || [])
        .map((ex) => ({ ex, done: (ex.sets || []).filter((s) => s.completed && !s.skipped).length }))
        .filter((x) => x.done > 0)
        .sort((a, b) => b.done - a.done)
        .slice(0, 4)
        .map(({ ex, done }) => ({ name: input.exerciseName(ex), detail: input.bestSetText(ex) ?? `${done} ${labels.sets.toLowerCase()}` }));
    return {
        badge: labels.workoutComplete,
        title: log.name || 'GainsLab',
        date: new Date(log.endTime || log.startTime || Date.now()).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
        stats: [
            { label: labels.time, value: formatSessionDuration(log.duration) },
            { label: labels.sets, value: String(totals.sets) },
            { label: labels.totalVolume, value: input.volumeText },
        ],
        topExercises,
        muscles: totals.muscles.slice(0, 6),
        footer: 'GAINSLAB',
    };
};

export const SESSION_CARD_SIZE = { width: 1080, height: 1350 } as const;

const readToken = (name: string, fallback: string): string => {
    try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v ? `rgb(${v.split(' ').join(', ')})` : fallback;
    } catch {
        return fallback;
    }
};

const fitText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string => {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
    return `${t}…`;
};

/** Draws the card (always on a dark background, brand accent) → PNG Blob. */
export const renderSessionCard = async (model: SessionCardModel): Promise<Blob> => {
    const { width: W, height: H } = SESSION_CARD_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    const accent = readToken('--primary-500', 'rgb(196, 241, 58)');
    const font = (weight: number, size: number) => `${weight} ${size}px "Inter Variable", Inter, system-ui, sans-serif`;

    ctx.fillStyle = '#050506';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, 14);

    const pad = 88;
    let y = 150;
    ctx.fillStyle = accent;
    ctx.font = font(800, 34);
    ctx.fillText(fitText(ctx, model.badge.toUpperCase(), W - pad * 2), pad, y);
    y += 96;
    ctx.fillStyle = '#ffffff';
    ctx.font = font(900, 84);
    ctx.fillText(fitText(ctx, model.title, W - pad * 2), pad, y);
    y += 64;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = font(600, 36);
    ctx.fillText(fitText(ctx, model.date, W - pad * 2), pad, y);

    // Stat tiles
    y += 70;
    const gap = 24;
    const tileW = (W - pad * 2 - gap * 2) / 3;
    model.stats.forEach((stat, i) => {
        const x = pad + i * (tileW + gap);
        ctx.fillStyle = '#17171a';
        ctx.beginPath();
        ctx.roundRect(x, y, tileW, 190, 28);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = font(900, 54);
        ctx.fillText(fitText(ctx, stat.value, tileW - 48), x + 28, y + 95);
        ctx.fillStyle = '#71717a';
        ctx.font = font(700, 26);
        ctx.fillText(fitText(ctx, stat.label.toUpperCase(), tileW - 48), x + 28, y + 150);
    });

    // Top exercises
    y += 270;
    for (const ex of model.topExercises) {
        ctx.fillStyle = '#ffffff';
        ctx.font = font(800, 40);
        ctx.fillText(fitText(ctx, ex.name, W - pad * 2 - 330), pad, y);
        ctx.fillStyle = accent;
        ctx.font = font(800, 36);
        const detail = fitText(ctx, ex.detail, 320);
        ctx.fillText(detail, W - pad - ctx.measureText(detail).width, y);
        y += 78;
    }

    // Muscles
    if (model.muscles.length > 0) {
        y += 20;
        ctx.font = font(700, 30);
        let x = pad;
        for (const m of model.muscles) {
            const w = ctx.measureText(m).width + 44;
            if (x + w > W - pad) break;
            ctx.fillStyle = '#212125';
            ctx.beginPath();
            ctx.roundRect(x, y - 40, w, 58, 29);
            ctx.fill();
            ctx.fillStyle = '#d4d4d8';
            ctx.fillText(m, x + 22, y);
            x += w + 14;
        }
    }

    ctx.fillStyle = accent;
    ctx.font = font(900, 40);
    ctx.fillText(model.footer, pad, H - 90);

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
    });
};
