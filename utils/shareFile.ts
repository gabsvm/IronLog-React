/**
 * Share a file via Web Share when the platform can share files, plain
 * download otherwise. Used by the JSON backup export (Q6), the CSV training
 * export (Q12) and the session summary image (U8).
 * U8: inside the native app the Android WebView supports neither Web Share with
 * files nor <a download> blobs, so the file goes through the native share sheet.
 */
import { Capacitor } from '@capacitor/core';
import { nativeShareFile } from './audio';

type ShareableNavigator = Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
};

const toBase64 = async (content: string | Blob): Promise<string> => {
    const blob = typeof content === 'string' ? new Blob([content]) : content;
    // FileReader encodes large exports inside the WebView implementation
    // instead of allocating a second JS byte array and concatenated string.
    // Especially useful before the Capacitor bridge copies the payload.
    if (blob.size >= 65536 && typeof FileReader !== 'undefined') {
        try {
            return await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(reader.error ?? new Error('read failed'));
                reader.onload = () => {
                    const data = reader.result;
                    if (typeof data !== 'string' || !data.includes(',')) {
                        reject(new Error('invalid data URI'));
                        return;
                    }
                    resolve(data.slice(data.indexOf(',') + 1));
                };
                reader.readAsDataURL(blob);
            });
        } catch {
            // Retain the proven arrayBuffer conversion as a compatibility path.
        }
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
};

export const shareFileOrDownload = async (
    content: string | Blob,
    filename: string,
    mime: string,
    title = 'GainsLab',
    deps: { nativeShare?: typeof nativeShareFile; isNative?: () => boolean } = {},
): Promise<'shared' | 'downloaded'> => {
    const isNative = deps.isNative ?? (() => Capacitor.isNativePlatform());
    if (isNative()) {
        const nativeShare = deps.nativeShare ?? nativeShareFile;
        if (await nativeShare(filename, mime, await toBase64(content), title)) return 'shared';
    }

    const nav = navigator as ShareableNavigator;

    if (typeof nav.canShare === 'function' && typeof nav.share === 'function') {
        try {
            const file = new File([content], filename, { type: mime });
            if (nav.canShare({ files: [file] })) {
                await nav.share({ files: [file], title, text: filename });
                return 'shared';
            }
        } catch {
            // Fall through to download (user cancel included).
        }
    }

    const blob = typeof content === 'string' ? new Blob([content], { type: mime }) : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
};
