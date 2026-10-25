
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gainslab.pro',
  appName: 'Repyntra',
  webDir: process.env.CAPACITOR_WEB_DIR || 'dist',
  server: {
    androidScheme: 'https'
  },
  // NOTE: no native plugin blocks here on purpose. There are no
  // @capacitor/keyboard, splash-screen or status-bar packages installed,
  // so any `plugins: { SystemBars | Keyboard | SplashScreen }` section would
  // be silently ignored by Capacitor. The real behavior is:
  // - safe-area insets come from CSS env() (index.css) + EdgeToEdge.enable
  //   in MainActivity (Android 15+ edge-to-edge);
  // - keyboard resize is AndroidManifest `adjustResize` + visualViewport
  //   compensation in JS (Sheet, RestTimerActive);
  // - splash is the native Theme.SplashScreen drawable, not a JS plugin
  //   (no Splash.hide() call exists). If a plugin is ever installed,
  //   document its exact package + version here.
};

export default config;
