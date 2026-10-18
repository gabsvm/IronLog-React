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
    musclesLabel?: string;
    highlightsLabel?: string;
    sessionCaption?: string;
}

export interface SessionCardLabels {
    workoutComplete: string;
    time: string;
    sets: string;
    totalVolume: string;
    musclesHit: string;
    highlights?: string;
    sessionCaption?: string;
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
        musclesLabel: labels.musclesHit,
        highlightsLabel: labels.highlights || 'HIGHLIGHTS',
        sessionCaption: labels.sessionCaption || 'SESSION RECAP',
    };
};

export const SESSION_CARD_SIZE = { width: 1080, height: 1350 } as const;
export type SessionCardFormat = 'png' | 'jpeg';
export type SessionCardVariant = 'dark-photo' | 'minimal-dark' | 'lime-accent';

const readAccent = (): string => {
    try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim();
        if (/^\d{1,3}\s+\d{1,3}\s+\d{1,3}$/.test(raw)) return 'rgb(' + raw.replace(/\s+/g, ',') + ')';
    } catch { /* no DOM (model-only tests) */ }
    return '#c4f13a';
};

const textFit = (ctx: CanvasRenderingContext2D, value: string, width: number): string => {
    if (ctx.measureText(value).width <= width) return value;
    let low = 0, high = value.length;
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (ctx.measureText(value.slice(0, mid) + '…').width <= width) low = mid;
        else high = mid - 1;
    }
    return value.slice(0, Math.max(0, low)).trimEnd() + '…';
};

const wrapTitle = (ctx: CanvasRenderingContext2D, title: string, maxWidth: number): string[] => {
    const words = title.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return ['GainsLab'];
    const rows = [''];
    for (const word of words) {
        const i = rows.length - 1;
        const next = rows[i] ? rows[i] + ' ' + word : word;
        if (ctx.measureText(next).width <= maxWidth || !rows[i]) rows[i] = next;
        else if (rows.length < 2) rows.push(word);
        else { rows[1] += ' ' + word; }
    }
    return rows.map(row => textFit(ctx, row, maxWidth));
};

const roundFill = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
};

const font = (weight: number, size: number) => weight + ' ' + size + 'px "Inter Variable", Inter, system-ui, sans-serif';

const drawValue = (ctx: CanvasRenderingContext2D, value: string, x: number, y: number, maxWidth: number, target: number) => {
    ctx.fillStyle = '#f5f8f4';
    let size = target;
    do { ctx.font = font(850, size); if (ctx.measureText(value).width <= maxWidth) break; size -= 2; } while (size > 26);
    ctx.fillText(textFit(ctx, value, maxWidth), x, y);
};

/**
 * Premium editorial image (1080x1350). Canvas-only: zero external assets, remote
 * requests, DOM capture, layout measurement or async font loading. No private
 * measurements beyond the completed workout.
 * JPEG is intended for the native bridge, reducing encode/IPC payload; the web
 * keeps a lossless PNG for backwards-compatible downloads.
 */
export const renderSessionCard = async (
    model: SessionCardModel,
    options: { format?: SessionCardFormat; variant?: SessionCardVariant } = {},
): Promise<Blob> => {
    const { width: W, height: H } = SESSION_CARD_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('no 2d context');
    const accent = readAccent();
    const variant = options.variant || 'dark-photo';
    const P = 72;
    const ink = '#f5f8f4';
    const dim = '#a4afa7';

    // Dark, tactile background: gradients and geometrical arcs instead of
    // expensive remote photos, blurs, canvas filters or screenshot capture.
    const base = ctx.createLinearGradient(0, 0, W, H);
    base.addColorStop(0, variant === 'lime-accent' ? '#294a2e' : variant === 'minimal-dark' ? '#131817' : '#14221a');
    base.addColorStop(0.48, variant === 'lime-accent' ? '#142c21' : '#0e1512');
    base.addColorStop(1, '#090e0d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.9, 135, 4, W * 0.9, 135, 560);
    glow.addColorStop(0, 'rgba(150,198,98,.18)');
    glow.addColorStop(1, 'rgba(150,198,98,0)');
    ctx.fillStyle = glow;
    if (variant !== 'minimal-dark') ctx.fillRect(0, 0, W, 780);

    if (variant !== 'minimal-dark') {
    ctx.save();
    ctx.translate(900, 365);
    ctx.rotate(-Math.PI / 8);
    ctx.lineWidth = 3;
    for (const radius of [170, 228, 286]) {
        ctx.strokeStyle = radius === 170 ? 'rgba(198,241,156,.24)' : 'rgba(198,241,156,.085)';
        ctx.beginPath();
        ctx.arc(0, 0, radius, -1.55, 1.05);
        ctx.stroke();
    }
    ctx.restore();
    }
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, W, variant === 'lime-accent' ? 15 : 9);

    // Quiet upper brand rail.
    roundFill(ctx, P, 68, 48, 48, 15, accent);
    ctx.fillStyle = '#102015';
    ctx.font = font(900, 23);
    ctx.fillText('G', P + 14, 100);
    ctx.fillStyle = ink;
    ctx.font = font(850, 30);
    ctx.fillText(model.footer, P + 64, 102);
    ctx.font = font(650, 22);
    ctx.fillStyle = dim;
    const stamp = model.sessionCaption || 'SESSION RECAP';
    ctx.fillText(stamp, W - P - ctx.measureText(stamp).width, 98);

    // Badge, readable two-line title, and quiet date; nothing clips at phone width.
    roundFill(ctx, P, 172, 420, 56, 28, variant === 'lime-accent' ? 'rgba(196,241,58,.23)' : 'rgba(196,241,58,.12)');
    ctx.font = font(800, 25);
    ctx.fillStyle = accent;
    ctx.fillText(textFit(ctx, model.badge.toUpperCase(), 376), P + 24, 209);
    ctx.fillStyle = ink;
    ctx.font = font(900, 77);
    const titleRows = wrapTitle(ctx, model.title, W - P * 2);
    titleRows.forEach((line, i) => ctx.fillText(line, P, 315 + i * 91));
    ctx.fillStyle = dim;
    ctx.font = font(570, 30);
    ctx.fillText(textFit(ctx, model.date, W - P * 2), P, titleRows.length === 1 ? 437 : 467);

    // Two short metrics + a deliberately wider volume metric. No ellipsis.
    const top = 523, gap = 16, cardH = 180;
    const widths = [238, 238, W - 2 * P - 2 * gap - 476];
    let sx = P;
    model.stats.slice(0, 3).forEach((stat, index) => {
        const w = widths[index];
        roundFill(ctx, sx, top, w, cardH, 28, index === 2 ? (variant === 'lime-accent' ? '#355a31' : '#213b2b') : (variant === 'minimal-dark' ? '#1a211e' : '#1d2922'));
        ctx.fillStyle = 'rgba(255,255,255,.10)';
        ctx.fillRect(sx + 28, top + 28, 32, 3);
        drawValue(ctx, stat.value, sx + 27, top + 109, w - 54, index === 2 ? 53 : 64);
        ctx.fillStyle = '#b8c5b9';
        ctx.font = font(700, 22);
        ctx.fillText(textFit(ctx, stat.label.toUpperCase(), w - 54), sx + 28, top + 149);
        sx += w + gap;
    });

    // Editorial exercise list: rank on the left, best-set performance on right.
    ctx.fillStyle = ink;
    ctx.font = font(850, 33);
    ctx.fillText(textFit(ctx, (model.highlightsLabel || 'HIGHLIGHTS').toUpperCase(), W - 190), P, 776);
    ctx.fillStyle = dim;
    ctx.font = font(600, 21);
    const count = String(model.topExercises.length).padStart(2, '0');
    ctx.fillText(count, W - P - ctx.measureText(count).width, 775);
    ctx.strokeStyle = 'rgba(255,255,255,.13)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(P, 801); ctx.lineTo(W - P, 801); ctx.stroke();

    const rowTop = 824, rowH = 80;
    for (let i = 0; i < model.topExercises.length; i++) {
        const exercise = model.topExercises[i];
        const y = rowTop + i * rowH;
        ctx.font = font(650, 23);
        ctx.fillStyle = '#8d9b90';
        ctx.fillText(String(i + 1).padStart(2, '0'), P + 1, y + 28);
        ctx.font = font(750, 31);
        ctx.fillStyle = ink;
        ctx.fillText(textFit(ctx, exercise.name, 630), P + 66, y + 31);
        ctx.font = font(800, 30);
        ctx.fillStyle = accent;
        const detail = textFit(ctx, exercise.detail, 236);
        ctx.fillText(detail, W - P - ctx.measureText(detail).width, y + 30);
        ctx.beginPath(); ctx.moveTo(P + 66, y + 51); ctx.lineTo(W - P, y + 51); ctx.stroke();
    }

    // Muscle tags wrap to a second row instead of silently dropping chips.
    let tagX = P, tagY = 1168;
    if (model.muscles.length) {
        ctx.fillStyle = dim;
        ctx.font = font(750, 21);
        ctx.fillText((model.musclesLabel || 'MÚSCULOS').toUpperCase(), P, 1140);
    }
    ctx.font = font(680, 23);
    for (const muscle of model.muscles.slice(0, 6)) {
        const label = textFit(ctx, muscle, 290);
        const w = Math.min(340, ctx.measureText(label).width + 42);
        if (tagX + w > W - P) { tagX = P; tagY += 55; }
        if (tagY > 1225) break;
        roundFill(ctx, tagX, tagY, w, 43, 21, '#29342b');
        ctx.fillStyle = '#e3e9e0';
        ctx.fillText(label, tagX + 21, tagY + 29);
        tagX += w + 11;
    }

    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.moveTo(P, 1280); ctx.lineTo(W - P, 1280); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = font(850, 28);
    ctx.fillText(model.footer, P, 1322);
    ctx.fillStyle = dim;
    ctx.font = font(600, 21);
    const caption = 'TRAIN • TRACK • PROGRESS';
    ctx.fillText(caption, W - P - ctx.measureText(caption).width, 1320);

    const mime = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('image encode failed')), mime,
            options.format === 'jpeg' ? 0.9 : undefined);
    });
};
