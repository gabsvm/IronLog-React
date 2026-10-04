// Q10: OS auto-backup stays disabled (explicit Q6 backups + cloud instead).
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

describe('Q10: source manifest disables OS auto-backup', () => {
    it('sets allowBackup="false" on <application>', () => {
        const xml = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
        expect(xml).toContain('android:allowBackup="false"');
        expect(xml).not.toMatch(/android:allowBackup="true"/);
    });
});

const findAapt = (): string | null => {
    const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
    if (!sdk) return null;
    const tools = join(sdk, 'build-tools');
    if (!existsSync(tools)) return null;
    for (const version of readdirSync(tools).sort().reverse()) {
        const candidate = join(tools, version, 'aapt.exe');
        if (existsSync(candidate)) return candidate;
        const nix = join(tools, version, 'aapt');
        if (existsSync(nix)) return nix;
    }
    return null;
};

const DEBUG_APK = 'android/app/build/outputs/apk/debug/app-debug.apk';
const aapt = findAapt();

describe.skipIf(!aapt || !existsSync(DEBUG_APK))('Q10: merged manifest (aapt, needs a built APK)', () => {
    it('merged manifest keeps allowBackup=false', () => {
        const out = execFileSync(aapt as string, ['dump', 'xmltree', DEBUG_APK, 'AndroidManifest.xml'], {
            encoding: 'utf8',
        });
        const line = out.split('\n').find((l) => l.includes('android:allowBackup'));
        expect(line, 'allowBackup attribute missing from merged manifest').toBeDefined();
        expect(line).toContain('0x0');
    });
});
