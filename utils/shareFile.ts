/**
 * Share a text file via Web Share when the platform can share files, plain
 * download otherwise. Shared by the JSON backup export (Q6) and the CSV
 * training export (Q12).
 */

type ShareableNavigator = Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
};

export const shareFileOrDownload = async (
    content: string,
    filename: string,
    mime: string,
    title = 'GainsLab'
): Promise<'shared' | 'downloaded'> => {
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

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
};
