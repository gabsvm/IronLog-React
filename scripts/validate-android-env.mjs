import { loadEnv } from 'vite';

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
  console.error('\n❌ Android build blocked: Firebase configuration is incomplete.');
  console.error('Missing variables:');
  for (const key of missing) console.error(`  - ${key}`);
  console.error('\nThe Vercel production build injects these variables, but a local Capacitor/APK build does not.');
  console.error('Load the production Vercel environment (for example into .env.production.local) before building Android.');
  console.error('Do not publish an APK until this validation passes.\n');
  process.exit(1);
}

console.log(`✅ Android Firebase environment validated for project: ${env.VITE_FIREBASE_PROJECT_ID}`);
