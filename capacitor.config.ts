
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gainslab.pro',
  appName: 'GainsLab',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SystemBars: {
      // 'css' injects --safe-area-inset-* vars (correct values even on old
      // WebViews); the layout prefers them with env() fallback. The web app
      // is edge-to-edge (viewport-fit=cover), so hint that to avoid jumps.
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
  }
};

export default config;
