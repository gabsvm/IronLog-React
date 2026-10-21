import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cliPath = fileURLToPath(new URL('../node_modules/@capacitor/cli/bin/capacitor', import.meta.url));
const result = spawnSync(process.execPath, [cliPath, 'sync', 'android'], {
  stdio: 'inherit',
  env: { ...process.env, CAPACITOR_WEB_DIR: 'dist-capacitor' },
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
