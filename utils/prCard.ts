export const PR_CARD_SIZE = { width: 1080, height: 1080 } as const;

const TROPHY_SVG_PATH =
    'M5.25 2.25H18.75C19.9926 2.25 21 3.25736 21 4.5V9C21 11.0506 19.6225 12.7797 17.7501 13.3107C17.4764 16.2995 15.1105 18.6659 12.1875 18.7461V20.25H15C15.4142 20.25 15.75 20.5858 15.75 21C15.75 21.4142 15.4142 21.75 15 21.75H9C8.58579 21.75 8.25 21.4142 8.25 21C8.25 20.5858 8.58579 20.25 9 20.25H11.8125V18.7461C8.88947 18.6659 6.52361 16.2995 6.24987 13.3107C4.37752 12.7797 3 11.0506 3 9V4.5C3 3.25736 4.00736 2.25 5.25 2.25ZM18.75 3.75H17.25V9C17.25 10.3807 16.1307 11.5 14.75 11.5H9.25C7.86929 11.5 6.75 10.3807 6.75 9V3.75H5.25C4.83579 3.75 4.5 4.08579 4.5 4.5V9C4.5 10.7424 5.70014 12.2031 7.31972 12.6075C7.85461 15.4057 10.0248 17.6596 12.8687 18.2323L12 18.25L11.1313 18.2323C13.9752 17.6596 16.1454 15.4057 16.6803 12.6075C18.2999 12.2031 19.5 10.7424 19.5 9V4.5C19.5 4.08579 19.1642 3.75 18.75 3.75Z';

const font = (weight: number, size: number, italic = false) =>
    `${italic ? 'italic ' : ''}${weight} ${size}px "Inter Variable", Inter, system-ui, sans-serif`;

const wrapCenteredLines = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = 4,
): string[] => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !current) {
            current = candidate;
        } else {
            lines.push(current);
            current = word;
            if (lines.length === maxLines - 1) break;
        }
    }
    if (current && lines.length < maxLines) {
        const remainingIdx = lines.join(' ').split(/\s+/).filter(Boolean).length;
        const leftover = words.slice(remainingIdx).join(' ');
        let finalLine = leftover || current;
        while (finalLine.length > 1 && ctx.measureText(finalLine + '…').width > maxWidth && ctx.measureText(finalLine).width > maxWidth) {
            finalLine = finalLine.slice(0, -1).trimEnd();
        }
        if (ctx.measureText(finalLine).width > maxWidth) {
            finalLine += '…';
        }
        lines.push(finalLine);
    }
    return lines;
};

/**
 * Generates an offline PNG Blob celebrating a personal record using native 2D Canvas.
 */
export const renderPRCard = async (input: {
    title: string;
    message: string;
    watermark?: string;
}): Promise<Blob> => {
    const { width: W, height: H } = PR_CARD_SIZE;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('no 2d context');

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // Subtle golden radial glow
    const glow = ctx.createRadialGradient(W / 2, 340, 20, W / 2, 340, 420);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
    glow.addColorStop(0.55, 'rgba(250, 204, 21, 0.06)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Subtle rounded frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(48, 48, W - 96, H - 96, 48);
    } else {
        ctx.rect(48, 48, W - 96, H - 96);
    }
    ctx.stroke();

    // Trophy artwork (#facc15)
    ctx.save();
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = 'rgba(250, 204, 21, 0.45)';
    ctx.shadowBlur = 32;
    if (typeof Path2D !== 'undefined') {
        const scale = 11.5;
        const iconSize = 24 * scale;
        ctx.translate((W - iconSize) / 2, 200);
        ctx.scale(scale, scale);
        const path = new Path2D(TROPHY_SVG_PATH);
        ctx.fill(path);
    } else {
        // Minimal canvas stub fallback
        ctx.beginPath();
        ctx.arc(W / 2, 330, 110, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // Bold italic white title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    let titleSize = 96;
    do {
        ctx.font = font(900, titleSize, true);
        if (ctx.measureText(input.title).width <= W - 160) break;
        titleSize -= 4;
    } while (titleSize > 48);
    ctx.fillText(input.title, W / 2, 575);

    // Word-wrapped subtitle
    ctx.fillStyle = '#d4d4d8';
    ctx.font = font(500, 38);
    const lines = wrapCenteredLines(ctx, input.message, W - 220, 4);
    const lineHeight = 56;
    const startY = 675;
    lines.forEach((line, idx) => {
        ctx.fillText(line, W / 2, startY + idx * lineHeight);
    });

    // Subtle uppercase watermark at bottom
    const watermark = (input.watermark || 'REPYNTRA PRO').toUpperCase();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.font = font(700, 24);
    ctx.fillText(watermark, W / 2, H - 110);

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('image encode failed'))),
            'image/png',
        );
    });
};
