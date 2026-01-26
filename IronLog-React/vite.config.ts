
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  
  const apiKey = env.API_KEY || process.env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY || 'AIzaSyAnVhFr2GKNsH52RdUlxiZ8j1pZDlApsp8';

  if (mode === 'production' && !apiKey) {
      console.warn("⚠️ WARNING: API_KEY not found in environment variables. AI features will fail.");
  }

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env': {} 
    },
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
            // Heavy Charting Library (Only load on Stats)
            if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) {
              return 'vendor-charts';
            }
            // GenAI SDK (Only load on Chat)
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-ai';
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
