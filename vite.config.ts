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
      rollupOptions: {
        output: {
          manualChunks: (rawId) => {
            const id = rawId.replace(/\\/g, '/');

            // Match exact package folders. The previous `node_modules/react`
            // substring also captured react-chartjs-2 and react-virtuoso, pulling
            // lazy feature code into the core React vendor chunk.
            if (
              id.includes('/node_modules/react/') ||
              id.includes('/node_modules/react-dom/') ||
              id.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }

            // Heavy/lazy feature vendors should stay isolated from startup code.
            if (
              id.includes('/node_modules/chart.js/') ||
              id.includes('/node_modules/react-chartjs-2/')
            ) {
              return 'vendor-charts';
            }
            if (id.includes('/node_modules/react-virtuoso/')) return 'vendor-virtual-list';
            if (id.includes('/node_modules/@google/genai/')) return 'vendor-ai';
            if (id.includes('/node_modules/pdfjs-dist/')) return 'vendor-pdf';
            if (id.includes('/node_modules/@dnd-kit/')) return 'vendor-dnd';
            if (id.includes('/node_modules/canvas-confetti/')) return 'vendor-effects';

            // Stable shared vendors.
            if (
              id.includes('/node_modules/firebase/') ||
              id.includes('/node_modules/@firebase/')
            ) {
              return 'vendor-firebase';
            }
            if (
              id.includes('/node_modules/framer-motion/') ||
              id.includes('/node_modules/motion-dom/') ||
              id.includes('/node_modules/motion-utils/')
            ) {
              return 'vendor-motion';
            }
            if (id.includes('/node_modules/date-fns/')) return 'vendor-date';
            if (id.includes('/node_modules/lucide-react/')) return 'vendor-icons';
          }
        }
      }
    },
    server: {
      host: true
    }
  };
});
