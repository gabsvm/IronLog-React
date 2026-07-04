import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      minify: 'esbuild',
      cssCodeSplit: true,
      modulePreload: {
        resolveDependencies: (_filename, deps) => deps.filter(dep =>
          !dep.includes('vendor-firebase') &&
          !dep.includes('vendor-charts') &&
          !dep.includes('vendor-motion')
        ),
      },
      rollupOptions: {
        output: {
          hoistTransitiveImports: false,
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/firebase/app') || id.includes('node_modules/@firebase/app')) {
              return 'vendor-firebase-app';
            }
            if (id.includes('node_modules/firebase/auth') || id.includes('node_modules/@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('node_modules/firebase/firestore') || id.includes('node_modules/@firebase/firestore') || id.includes('node_modules/@firebase/webchannel-wrapper')) {
              return 'vendor-firebase-db';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase-core';
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/date-fns')) {
              return 'vendor-date';
            }
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            if (id.includes('canvas-confetti')) {
              return 'vendor-effects';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    },
    server: {
      host: true
    }
  };
});
