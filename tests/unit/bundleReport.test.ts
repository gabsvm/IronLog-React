// Q20: bundle-report — real gzip accounting, budget enforcement, and report output.
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import {
    analyzeDist,
    collectDistAssets,
    findEntryChunk,
    renderReport,
} from '../../scripts/bundle-report.mjs';

const tmpDirs: string[] = [];
afterEach(() => {
    while (tmpDirs.length) {
        const dir = tmpDirs.pop() as string;
        try {
            rmSync(dir, { recursive: true, force: true });
        } catch {
            // Best effort: a failed cleanup must not fail the suite.
        }
    }
});

/** Minimal dist: entry + one static dep (critical) + one dynamic chunk (lazy). */
function makeFixtureDist() {
    const dir = mkdtempSync(join(tmpdir(), 'q20-dist-'));
    tmpDirs.push(dir);
    const assetsDir = join(dir, 'assets');
    mkdirSync(assetsDir, { recursive: true });
    const entryJs = `import{a}from"./vendor-aaa.js";const lazy=()=>import("./lazy-bbb.js");console.log(a,lazy);export const boot=1;/*${'entry-padding '.repeat(2000)}*/`;
    const vendorJs = `export const a=1;/*${'vendor-padding '.repeat(1000)}*/`;
    const lazyJs = `export const lazy=2;/*${'lazy-padding '.repeat(500)}*/`;
    writeFileSync(
        join(dir, 'index.html'),
        '<!doctype html><html><head></head><body><script type="module" src="/assets/entry-xyz.js"></script></body></html>',
    );
    writeFileSync(join(assetsDir, 'entry-xyz.js'), entryJs);
    writeFileSync(join(assetsDir, 'vendor-aaa.js'), vendorJs);
    writeFileSync(join(assetsDir, 'lazy-bbb.js'), lazyJs);
    return {
        dir,
        entryGzip: gzipSync(entryJs).length,
        vendorGzip: gzipSync(vendorJs).length,
        lazyGzip: gzipSync(lazyJs).length,
    };
}

function runCli(args: string[]): { code: number; stdout: string; stderr: string } {
    const script = join(process.cwd(), 'scripts', 'bundle-report.mjs');
    try {
        const stdout = execFileSync(process.execPath, [script, ...args], {
            encoding: 'utf8',
            timeout: 60000,
        }) as string;
        return { code: 0, stdout, stderr: '' };
    } catch (error: any) {
        return {
            code: typeof error?.status === 'number' ? error.status : 99,
            stdout: String(error?.stdout ?? ''),
            stderr: String(error?.stderr ?? ''),
        };
    }
}

describe('Q20: findEntryChunk', () => {
    it('resolves absolute, relative, and query-string script sources', () => {
        expect(findEntryChunk('<script type="module" src="/assets/index-1.js"></script>')).toBe('/assets/index-1.js');
        expect(findEntryChunk('<script type="module" src="./assets/index-1.js"></script>')).toBe('/assets/index-1.js');
        expect(findEntryChunk('<script src="assets/index-1.js?v=2"></script>')).toBe('/assets/index-1.js');
        expect(findEntryChunk('<html><body>no script here</body></html>')).toBeNull();
    });
});

describe('Q20: analyzeDist on a fixture dist', () => {
    it('measures real gzip sizes and tags entry/critical/lazy', async () => {
        const fx = makeFixtureDist();
        expect(collectDistAssets(join(fx.dir, 'assets')).sort()).toEqual([
            '/assets/entry-xyz.js',
            '/assets/lazy-bbb.js',
            '/assets/vendor-aaa.js',
        ]);
        const analysis = await analyzeDist(fx.dir);
        expect(analysis.entry?.url).toBe('/assets/entry-xyz.js');
        expect(analysis.entryJsGzip).toBe(fx.entryGzip);
        expect(analysis.criticalTotalGzip).toBe(fx.entryGzip + fx.vendorGzip);
        expect(analysis.lazyTotalGzip).toBe(fx.lazyGzip);
        const byUrl = new Map(analysis.files.map((f) => [f.url, f]));
        expect(byUrl.get('/assets/entry-xyz.js')).toMatchObject({ entry: true, critical: true });
        expect(byUrl.get('/assets/vendor-aaa.js')).toMatchObject({ entry: false, critical: true });
        expect(byUrl.get('/assets/lazy-bbb.js')).toMatchObject({ entry: false, critical: false });
    });

    it('renders a report naming the entry and the status', async () => {
        const fx = makeFixtureDist();
        const analysis = await analyzeDist(fx.dir);
        const report = renderReport(analysis, { entryJsGzip: 1, criticalTotalGzip: 1 }, 'OVER BUDGET');
        expect(report).toContain('/assets/entry-xyz.js');
        expect(report).toContain('OVER BUDGET');
        expect(report).toContain('ENTRY (critical)');
    });
});

describe('Q20: CLI exit codes and budget file (real subprocess)', () => {
    it('exits 0 within budget and writes the report', () => {
        const fx = makeFixtureDist();
        const budgetPath = join(fx.dir, 'budget.json');
        const reportPath = join(fx.dir, 'report.md');
        writeFileSync(
            budgetPath,
            JSON.stringify({ entryJsGzip: fx.entryGzip + 100, criticalTotalGzip: fx.entryGzip + fx.vendorGzip + 100 }),
        );
        const result = runCli([fx.dir, '--budget', budgetPath, '--report', reportPath]);
        expect(result.code).toBe(0);
        expect(result.stdout).toContain('WITHIN BUDGET');
        expect(readFileSync(reportPath, 'utf8')).toContain('WITHIN BUDGET');
    });

    it('exits 1 over budget and names the violated limit', () => {
        const fx = makeFixtureDist();
        const budgetPath = join(fx.dir, 'budget.json');
        const reportPath = join(fx.dir, 'report.md');
        writeFileSync(budgetPath, JSON.stringify({ entryJsGzip: 1, criticalTotalGzip: fx.entryGzip + fx.vendorGzip + 100 }));
        const result = runCli([fx.dir, '--budget', budgetPath, '--report', reportPath]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('over budget: entry');
        expect(readFileSync(reportPath, 'utf8')).toContain('OVER BUDGET');
    });

    it('exits 1 with a missing budget file', () => {
        const fx = makeFixtureDist();
        const result = runCli([fx.dir, '--budget', join(fx.dir, 'nope.json'), '--report', join(fx.dir, 'report.md')]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain('missing');
    });

    it('--write-budget stores current size + 5%', () => {
        const fx = makeFixtureDist();
        const budgetPath = join(fx.dir, 'budget.json');
        const result = runCli([fx.dir, '--budget', budgetPath, '--report', join(fx.dir, 'report.md'), '--write-budget']);
        expect(result.code).toBe(0);
        const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));
        expect(budget.entryJsGzip).toBe(Math.ceil(fx.entryGzip * 1.05));
        expect(budget.criticalTotalGzip).toBe(Math.ceil((fx.entryGzip + fx.vendorGzip) * 1.05));
    });
});
