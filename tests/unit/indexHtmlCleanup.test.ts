import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task L6: index.html Error Handling and CSS Clean-up', () => {
    const rootDir = path.resolve(__dirname, '../../');
    const indexHtmlPath = path.join(rootDir, 'index.html');
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

    it('removes unused legacy CSS (.glass, .dark .glass, .scroll-container, .animate-slideUp) from index.html', () => {
        // Extract <style> block from index.html
        const styleMatch = indexHtml.match(/<style>([\s\S]*?)<\/style>/);
        expect(styleMatch).not.toBeNull();
        const styleContent = styleMatch![1];

        expect(styleContent).not.toContain('.glass {');
        expect(styleContent).not.toContain('.dark .glass');
        expect(styleContent).not.toContain('.scroll-container');
        expect(styleContent).not.toContain('.animate-slideUp');
        expect(styleContent).not.toContain('@keyframes slideUp');
    });

    it('verifies index.html uses textContent instead of innerHTML for error reporting', () => {
        const scriptMatch = indexHtml.match(/<script>([\s\S]*?)<\/script>/g);
        const combinedScripts = scriptMatch ? scriptMatch.join('\n') : '';

        // Should not inject msg via innerHTML
        expect(combinedScripts).not.toMatch(/box\.innerHTML\s*\+?=/);
        expect(combinedScripts).toContain('.textContent = msg');
    });

    it('verifies unhandledrejection is logged to console and does not invoke showError', () => {
        expect(indexHtml).toContain("window.addEventListener('unhandledrejection'");
        expect(indexHtml).toContain("console.error('Unhandled Promise Rejection:'");
        // unhandledrejection handler should not call showError
        const unhandledBlock = indexHtml.match(/addEventListener\('unhandledrejection'[\s\S]*?\}\);/);
        expect(unhandledBlock).not.toBeNull();
        expect(unhandledBlock![0]).not.toContain('showError');
    });

    describe('Startup error overlay behavior (real inline script from index.html)', () => {
        // Extract the real startup <script> block (the one managing __appMounted)
        // and execute it in this jsdom window instead of re-implementing it.
        const startupScript = (() => {
            const scripts = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
            const found = scripts.find(s => s.includes('__appMounted'));
            if (!found) throw new Error('startup script block not found in index.html');
            return found;
        })();

        const runStartupScript = () => {
            new Function(startupScript)();
        };

        const fireWindowError = (message: string, source?: string, lineno?: number) => {
            const handler = window.onerror as unknown as ((m: string, s?: string, l?: number) => void) | null;
            expect(handler).toEqual(expect.any(Function));
            handler!(message, source, lineno);
        };

        beforeEach(() => {
            vi.useFakeTimers();
            const root = document.createElement('div');
            root.id = 'root';
            document.body.appendChild(root);
            runStartupScript();
        });

        afterEach(() => {
            vi.clearAllTimers();
            vi.useRealTimers();
            document.getElementById('error-box')?.remove();
            document.getElementById('root')?.remove();
            (window as any).onerror = null;
            delete (window as any).__appMounted;
            vi.restoreAllMocks();
        });

        it('shows the overlay with inert text when a startup error fires before mount', () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});

            fireWindowError('<img src=x onerror=alert(1)> Crash occurred', 'chunk.js', 42);

            const box = document.getElementById('error-box');
            expect(box).not.toBeNull();
            // textContent assignment: markup is inert text, never parsed as HTML.
            expect(box!.querySelector('img')).toBeNull();
            expect(box!.textContent).toContain('<img src=x onerror=alert(1)> Crash occurred');
        });

        it('does not display the overlay once the app is mounted', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            (window as any).__appMounted = true;

            fireWindowError('Transient non-critical error', 'chunk.js', 42);

            expect(document.getElementById('error-box')).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('treats a non-empty #root as mounted and stays silent', () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            document.getElementById('root')!.appendChild(document.createElement('div'));

            fireWindowError('Late chunk error', 'chunk.js', 7);

            expect(document.getElementById('error-box')).toBeNull();
            expect((window as any).__appMounted).toBe(true);
        });

        it('ignores ResizeObserver noise and cross-origin script errors', () => {
            vi.spyOn(console, 'error').mockImplementation(() => {});

            fireWindowError('ResizeObserver loop completed with undelivered notifications', 'app.js', 1);
            fireWindowError('Script error.', undefined, 0);

            expect(document.getElementById('error-box')).toBeNull();
        });

        it('logs unhandledrejection to console without showing the overlay', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            window.dispatchEvent(new Event('unhandledrejection'));

            expect(consoleSpy).toHaveBeenCalledWith('Unhandled Promise Rejection:', undefined);
            expect(document.getElementById('error-box')).toBeNull();
        });

        it('shows a startup-timeout error when the app never mounts within 15s', () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            vi.advanceTimersByTime(15_000);

            const box = document.getElementById('error-box');
            expect(box).not.toBeNull();
            expect(box!.textContent).toContain('Startup Timeout');
        });

        it('shows no startup-timeout error when the app mounts in time', () => {
            document.getElementById('root')!.appendChild(document.createElement('div'));

            vi.advanceTimersByTime(15_000);

            expect(document.getElementById('error-box')).toBeNull();
        });
    });
});
