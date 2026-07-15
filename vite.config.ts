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
            // Match package directories exactly. The previous broad `react`
            // match also captured react-chartjs-2 and React-Native Firebase
            // internals, making the startup React chunk pull charts and auth.
            const moduleId = id.replace(/\\/g, '/');
            if (
              moduleId.includes('/node_modules/react/') ||
              moduleId.includes('/node_modules/react-dom/') ||
              moduleId.includes('/node_modules/scheduler/') ||
              moduleId.includes('/node_modules/use-sync-external-store/')
            ) {
              return 'vendor-react';
            }
            if (moduleId.includes('/node_modules/firebase/app') || moduleId.includes('/node_modules/@firebase/app')) {
              return 'vendor-firebase-app';
            }
            if (moduleId.includes('/node_modules/firebase/auth') || moduleId.includes('/node_modules/@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (moduleId.includes('/node_modules/firebase/firestore') || moduleId.includes('/node_modules/@firebase/firestore') || moduleId.includes('/node_modules/@firebase/webchannel-wrapper')) {
              return 'vendor-firebase-db';
            }
            if (moduleId.includes('/node_modules/firebase') || moduleId.includes('/node_modules/@firebase')) {
              return 'vendor-firebase-core';
            }
            if (moduleId.includes('/node_modules/framer-motion') || moduleId.includes('/node_modules/motion')) {
              return 'vendor-motion';
            }
            if (moduleId.includes('/node_modules/date-fns')) {
              return 'vendor-date';
            }
            if (moduleId.includes('/node_modules/chart.js') || moduleId.includes('/node_modules/react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (moduleId.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            if (moduleId.includes('canvas-confetti')) {
              return 'vendor-effects';
            }
            if (moduleId.includes('lucide-react')) {
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
