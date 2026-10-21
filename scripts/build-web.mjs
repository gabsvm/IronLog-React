// Production web bundler entrypoint. Always use the production React runtime,
// regardless of the ambient NODE_ENV (a shell exporting NODE_ENV=test would
// otherwise silently ship the development React build: +60 KB and dev warnings).
process.env.NODE_ENV = 'production';

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const result = spawnSync(process.execPath, [viteCli, 'build', ...process.argv.slice(2)], {
    stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
