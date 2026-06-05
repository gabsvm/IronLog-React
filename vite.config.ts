
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext', // Modern browsers for smaller bundle
      minify: 'esbuild',
      cssCodeSplit: true, // Split CSS by chunk
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core React Vendor
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) {
              return 'vendor-react';
            }
            // Firebase (auth + firestore) — large & stable, split for long-term caching
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase';
            }
            // Animation library — used app-wide, stable across releases
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
              return 'vendor-motion';
            }
            // Date utilities
            if (id.includes('node_modules/date-fns')) {
              return 'vendor-date';
            }
            // Heavy Charting Library (Only load on Stats)
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
              return 'vendor-charts';
            }
            // GenAI SDK (Only load on nutrition label scanner)
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-ai';
            }
            // PDF parsing (Only load when importing a PDF program)
            if (id.includes('node_modules/pdfjs-dist')) {
              return 'vendor-pdf';
            }
            // Drag and Drop (Only load on Workout)
            if (id.includes('@dnd-kit')) {
              return 'vendor-dnd';
            }
            // Animations
            if (id.includes('canvas-confetti')) {
              return 'vendor-effects';
            }
            // Icons (Keep core icons fast)
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
