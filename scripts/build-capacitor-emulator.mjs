// The emulator bundle must also use the production React runtime.
process.env.NODE_ENV = 'production';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';

const emulatorEnv = loadEnv('capacitor', process.cwd(), 'VITE_');
if (
  emulatorEnv.VITE_FIREBASE_EMULATOR !== '1' ||
  !String(emulatorEnv.VITE_FIREBASE_PROJECT_ID || '').startsWith('demo-') ||
  emulatorEnv.VITE_FIREBASE_EMULATOR_AUTH !== '10.0.2.2:9099' ||
  emulatorEnv.VITE_FIREBASE_EMULATOR_FIRESTORE !== '10.0.2.2:8085'
) {
  throw new Error('Refusing to build: .env.capacitor.local must target the local demo project and Android Emulator endpoints.');
}

const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const result = spawnSync(process.execPath, [viteCli, 'build', '--mode', 'capacitor', '--outDir', 'dist-capacitor'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...emulatorEnv,
    VITE_FIREBASE_APPCHECK_SITE_KEY: '',
    VITE_FIREBASE_APPCHECK_DEBUG: '',
    VITE_CLOUD_LOGS_V2: '0',
  },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
