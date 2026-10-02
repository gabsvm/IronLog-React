import { execSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const failures = [];

// --- 1. Firebase env (unchanged) ---
const env = {
  ...loadEnv('production', process.cwd(), 'VITE_'),
  ...process.env,
};

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = required.filter((key) => !String(env[key] || '').trim());

if (missing.length > 0) {
  failures.push(
    'Firebase configuration is incomplete. Missing variables:\n' +
      missing.map((key) => `  - ${key}`).join('\n') +
      '\nLoad the production Vercel environment (for example into .env.production.local) before building Android.'
  );
} else {
  console.log(`✅ Firebase environment validated for project: ${env.VITE_FIREBASE_PROJECT_ID}`);
}

// --- 2. JDK (Capacitor 8: 17+ required, 21 recommended) ---
const MIN_JDK = 17;
const RECOMMENDED_JDK = 21;

const findJava = () => {
  const fromHome = process.env.JAVA_HOME
    ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
    : null;
  if (fromHome && existsSync(fromHome)) return fromHome;
  return 'java';
};

try {
  const javaBin = findJava();
  // java -version writes to stderr: merge it into stdout.
  const text = String(execSync(`"${javaBin}" -version 2>&1`, { encoding: 'utf8' }));
  const match = text.match(/version "(\d+)(?:\.(\d+))?/);
  // Java 8 and earlier report 1.<major>; 9+ report the major directly.
  const major = match ? (match[1] === '1' && match[2] ? Number(match[2]) : Number(match[1])) : NaN;
  if (!Number.isFinite(major)) {
    failures.push(`Could not parse JDK version from ${javaBin} output: ${text.split('\n')[0]}`);
  } else if (major < MIN_JDK) {
    failures.push(
      `JDK ${major} is too old (found via ${javaBin}). Capacitor 8 requires JDK ${MIN_JDK}+ ` +
        `(${RECOMMENDED_JDK} recommended). Set JAVA_HOME to a JDK ${RECOMMENDED_JDK} install.`
    );
  } else if (major < RECOMMENDED_JDK) {
    console.log(`⚠️  JDK ${major} meets the minimum (${MIN_JDK}+) but JDK ${RECOMMENDED_JDK}+ is recommended.`);
  } else {
    console.log(`✅ JDK ${major} (${javaBin})`);
  }
} catch (err) {
  failures.push(`Could not run java -version: ${(err && err.message) || err}`);
}

// --- 3. Android SDK: platform + build-tools for the target SDK ---
const TARGET_SDK = 36;

const sdkRoot = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdkRoot || !existsSync(sdkRoot)) {
  failures.push('ANDROID_HOME (or ANDROID_SDK_ROOT) is not set to an existing SDK directory.');
} else {
  const platformDir = join(sdkRoot, 'platforms', `android-${TARGET_SDK}`);
  if (!existsSync(platformDir)) {
    failures.push(
      `SDK platform android-${TARGET_SDK} is missing. Install it with:\n` +
        `  sdkmanager "platforms;android-${TARGET_SDK}"`
    );
  } else {
    console.log(`✅ SDK platform android-${TARGET_SDK}`);
  }

  const buildToolsDir = join(sdkRoot, 'build-tools');
  let buildToolsOk = false;
  try {
    buildToolsOk = readdirSync(buildToolsDir).some((entry) => entry.startsWith(`${TARGET_SDK}.`));
  } catch {
    buildToolsOk = false;
  }
  if (!buildToolsOk) {
    failures.push(
      `No build-tools ${TARGET_SDK}.x found under ${buildToolsDir}. Install with:\n` +
        `  sdkmanager "build-tools;${TARGET_SDK}.0.0"`
    );
  } else {
    console.log(`✅ build-tools ${TARGET_SDK}.x`);
  }
}

if (failures.length > 0) {
  console.error('\n❌ Android build environment validation failed:');
  for (const failure of failures) console.error(`\n- ${failure}`);
  console.error('');
  process.exit(1);
}

console.log('\n✅ Android build environment ready (Capacitor 8 / SDK 36).');
