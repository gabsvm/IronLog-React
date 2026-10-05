import { pickLang, formatMessage } from './utils/i18n';
import React, { StrictMode, ReactNode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource-variable/inter';
import './index.css';
import './native-performance.css';
import './styles/app-polish.css';
import App from './App';
import { CRASH_SCREEN_COPY } from './constants/crashScreenCopy';
import { bootLanguage, loadTranslations } from './constants/translations';
import { resetLocalData } from './services/localDataReset';
import { isServiceWorkerAllowed } from './utils/serviceWorker';
import { useStore } from './lib/store';
import { getPreferredLanguage, downloadEmergencyBackup } from './utils/emergencyBackup';
import { logError, registerGlobalErrorListeners } from './utils/errorLog';
console.log("Starting App Initialization...");

const isNativeShell = Capacitor.isNativePlatform();

// The installed Capacitor build has a different performance envelope from the
// browser PWA. Mark it once so CSS and navigation can use cheaper compositing.
if (isNativeShell) {
  document.documentElement.classList.add('native-shell');

  // Clean up a Service Worker that may have been registered by an older build.
  // Capacitor serves packaged assets locally and does not need an extra SW cache.
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations()
      .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
      .catch(() => {});
  }
}

const notifyUpdateAvailable = (registration: ServiceWorkerRegistration) => {
  window.dispatchEvent(new CustomEvent('ironlog:update-available', {
    detail: { registration },
  }));
};

const registerServiceWorker = () => {
  if (!isServiceWorkerAllowed()) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const swUrl = '/sw.js';
      navigator.serviceWorker.register(swUrl, { scope: '/' })
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);

          if (registration.waiting) {
            notifyUpdateAvailable(registration);
          }

          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;

            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                notifyUpdateAvailable(registration);
              }
            });
          });
        })
        .catch((error) => {
          console.warn('ServiceWorker registration skipped:', error.message);
        });
    }, 1000);
  });
};

registerServiceWorker();

let hadControllerOnLoad = false;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  hadControllerOnLoad = !!navigator.serviceWorker.controller;
}

if (isServiceWorkerAllowed()) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadControllerOnLoad) return;

    const hasActiveSession = Boolean(useStore.getState().activeSession);
    const userRequested = Boolean((window as any).__USER_TRIGGERED_SW_UPDATE__);

    if (hasActiveSession && !userRequested) {
      console.warn('[SW] Deferring automatic page reload because an active workout session is running.');
      window.dispatchEvent(new CustomEvent('ironlog:update-deferred'));
      return;
    }

    refreshing = true;
    window.location.reload();
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    console.warn('[PWA] Chunk preload failed (possibly outdated version); signaling update available.');
    window.dispatchEvent(new CustomEvent('ironlog:update-available', {
      detail: { registration: null, isPreloadError: true }
    }));
  });
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  confirmReset: boolean;
  isResetting: boolean;
  isExporting: boolean;
  exportedFileName: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      confirmReset: false,
      isResetting: false,
      isExporting: false,
      exportedFileName: null,
    };
    this.props = props;
  }

  static getDerivedStateFromError(error: any): Partial<ErrorBoundaryState> {
    return { hasError: true, error, confirmReset: false, isResetting: false };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
    void logError({
      message: String(error?.message ?? error ?? 'unknown'),
      stack: [error?.stack, errorInfo?.componentStack].filter(Boolean).join('\n'),
      source: 'boundary',
    });
  }

  render() {
    if (this.state.hasError) {
      const lang = getPreferredLanguage();
      const tc = pickLang(lang, CRASH_SCREEN_COPY);

      return (
        <div style={{
          minHeight: '100dvh',
          backgroundColor: '#09090b',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          fontFamily: 'monospace',
          textAlign: 'center',
          zIndex: 99999
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
            {tc.criticalError}
          </h1>
          <p style={{ opacity: 0.8, fontSize: '14px', maxWidth: '420px', marginBottom: '24px', lineHeight: 1.4 }}>
            {tc.theApplicationFailedTo}
          </p>

          {this.state.exportedFileName && (
            <div style={{
              color: '#4ade80',
              fontSize: '12px',
              marginBottom: '16px',
              padding: '6px 12px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              ✓ {formatMessage(tc.backupSaved, { file: this.state.exportedFileName })}
            </div>
          )}

          {this.state.confirmReset && (
            <div style={{
              backgroundColor: '#18181b',
              border: '1px solid #dc2626',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '440px',
              width: '100%',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              <h2 style={{ color: '#ef4444', fontSize: '15px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                {tc.resetLocalData}
              </h2>
              <p style={{ color: '#d4d4d8', fontSize: '12px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {tc.resettingLocalDataWill}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={this.state.isResetting}
                  onClick={() => {
                    this.setState({ isResetting: true });
                    void resetLocalData().finally(() => {
                      window.location.reload();
                    });
                  }}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: this.state.isResetting ? 'wait' : 'pointer',
                    opacity: this.state.isResetting ? 0.7 : 1,
                  }}
                >
                  {this.state.isResetting
                    ? (tc.resetting)
                    : (tc.confirmReset)}
                </button>
                <button
                  type="button"
                  disabled={this.state.isResetting}
                  onClick={() => this.setState({ confirmReset: false })}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#27272a',
                    color: '#e4e4e7',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {tc.cancel}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '28px' }}>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: '10px 18px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {tc.reloadApp}
            </button>

            <button
              type="button"
              disabled={this.state.isExporting}
              onClick={async () => {
                this.setState({ isExporting: true });
                try {
                  const filename = await downloadEmergencyBackup();
                  this.setState({ isExporting: false, exportedFileName: filename });
                } catch (err) {
                  console.error('Failed to export emergency backup:', err);
                  this.setState({ isExporting: false });
                }
              }}
              style={{
                padding: '10px 18px',
                backgroundColor: '#15803d',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: this.state.isExporting ? 'wait' : 'pointer',
                opacity: this.state.isExporting ? 0.7 : 1,
              }}
            >
              {this.state.isExporting
                ? (tc.exporting)
                : (tc.exportBackup)}
            </button>

            {!this.state.confirmReset && (
              <button
                onClick={() => {
                  this.setState({ confirmReset: true });
                }}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#27272a',
                  color: '#f87171',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {tc.resetLocalData}
              </button>
            )}
          </div>

          <details style={{
            width: '100%',
            maxWidth: '520px',
            textAlign: 'left',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '12px 16px',
            overflow: 'hidden'
          }}>
            <summary style={{
              color: '#a1a1aa',
              fontSize: '12px',
              cursor: 'pointer',
              userSelect: 'none',
              fontWeight: 600
            }}>
              {tc.viewTechnicalErrorDetails}
            </summary>
            <div style={{ marginTop: '12px', overflowX: 'auto', background: '#09090b', padding: '12px', borderRadius: '6px' }}>
              <pre style={{ color: '#f87171', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {String(this.state.error?.stack || this.state.error || 'Unknown error')}
              </pre>
            </div>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
// S7: only the active language is downloaded; render once it is in memory.
// If it cannot load (should not happen: both chunks are precached), render
// anyway so the error boundary can offer reload / backup export.
const translationsReady = loadTranslations(bootLanguage()).catch((error) => {
  console.error('Translations failed to load', error);
});

if (rootElement) {
  void translationsReady.then(() => {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  (window as any).__appMounted = true;
  registerGlobalErrorListeners();
  });
} else {
  console.error("Root element not found");
  document.body.innerHTML = '<h1 style="color:red">FATAL: #root missing</h1>';
}
