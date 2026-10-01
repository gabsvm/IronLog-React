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

    describe('Startup error overlay behavior', () => {
        beforeEach(() => {
            const existingBox = document.getElementById('error-box');
            if (existingBox) existingBox.remove();
            (window as any).__appMounted = false;
        });

        afterEach(() => {
            const existingBox = document.getElementById('error-box');
            if (existingBox) existingBox.remove();
            delete (window as any).__appMounted;
            vi.restoreAllMocks();
        });

        it('does not display error overlay once the app is mounted', () => {
            (window as any).__appMounted = true;
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Simulate the index.html error handler logic
            const errorHandler = (message: any, source?: any, lineno?: any) => {
                const msg = message + '\n' + (source || '') + (lineno ? (':' + lineno) : '');
                console.error(msg);
                if ((window as any).__appMounted) return;
                const root = document.getElementById('root');
                if (root && root.childElementCount > 0) {
                    (window as any).__appMounted = true;
                    return;
                }
                const box = document.createElement('div');
                box.id = 'error-box';
                document.body.appendChild(box);
            };

            errorHandler('Transient non-critical error', 'chunk.js', 42);

            expect(document.getElementById('error-box')).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
        });

        it('safely renders startup errors with textContent without injecting HTML tags', () => {
            (window as any).__appMounted = false;
            vi.spyOn(console, 'error').mockImplementation(() => {});

            const maliciousOrHtmlError = '<img src=x onerror=alert(1)> Crash occurred';

            // Simulate showError logic from index.html
            const showError = (msg: string) => {
                let box = document.getElementById('error-box');
                if (!box) {
                    box = document.createElement('div');
                    box.id = 'error-box';
                    const heading = document.createElement('h2');
                    heading.textContent = 'Application Error';
                    box.appendChild(heading);
                    document.body.appendChild(box);
                }
                const line = document.createElement('div');
                line.textContent = msg;
                box.appendChild(line);
            };

            showError(maliciousOrHtmlError);

            const box = document.getElementById('error-box');
            expect(box).not.toBeNull();
            expect(box!.querySelector('img')).toBeNull();
            expect(box!.textContent).toContain('<img src=x onerror=alert(1)> Crash occurred');
        });
    });
});
