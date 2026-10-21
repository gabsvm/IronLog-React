import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// An independent, portable review artifact. Never imports the application or its env.
const root = fileURLToPath(new URL('../', import.meta.url));
const result = await build({
  absWorkingDir: root,
  entryPoints: ['design-preview/Proposal.jsx'],
  bundle: true,
  write: false,
  outdir: 'design-preview/bundle',
  format: 'iife',
  minify: true,
  target: ['chrome100'],
  legalComments: 'inline',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.woff2': 'dataurl' },
});
const js = result.outputFiles.find(file => file.path.endsWith('.js')).text;
const css = result.outputFiles.find(file => file.path.endsWith('.css')).text;
const notices = await Promise.all([
  'react', 'react-dom', 'scheduler', 'lucide-react', '@fontsource-variable/inter',
].map(async name => `${name}\n${await readFile(new URL(`../node_modules/${name}/LICENSE`, import.meta.url), 'utf8')}`));
const licenseComment = `<!-- Third-party notices (not a license grant for GainsLab itself):\n${notices.join('\n\n').replace(/--/g, '—')}\n-->`;
const html = `<!doctype html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="color-scheme" content="dark light"><meta name="description" content="Propuesta interactiva de diseño para GainsLab. Datos de ejemplo, sin conexión a servicios ni cuentas reales."><title>GainsLab — Propuesta de diseño</title><style>${css.replace(/<\/style/gi, '<\\/style')}</style></head><body><div id="root"></div><script>${js.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
await writeFile(new URL('./index.html', import.meta.url), html + '\n' + licenseComment);
console.log(`Propuesta lista: design-preview/index.html (${Math.round(Buffer.byteLength(html) / 1024)} KiB). Abrir directamente en el navegador; no requiere servidor ni Firebase.`);
