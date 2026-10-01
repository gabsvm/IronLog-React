import React, { StrictMode, ReactNode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import '@fontsource-variable/inter';
import './index.css';
import './native-performance.css';
import App from './App';
import { requestBackgroundSync, requestPeriodicSync } from './services/backgroundSync';
import { resetLocalData } from './services/localDataReset';
import { isServiceWorkerAllowed } from './utils/serviceWorker';
import { useStore } from './lib/store';
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

          void requestBackgroundSync();
          void requestPeriodicSync();
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

if (!isNativeShell) {
  window.addEventListener('online', () => {
    void requestBackgroundSync();
    void requestPeriodicSync();
  });

  window.addEventListener('ironlog:sync-queue-changed', (event) => {
    const pending = Number((event as CustomEvent).detail?.pending ?? 0);
    if (pending > 0) {
      void requestBackgroundSync();
    }
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
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, confirmReset: false, isResetting: false };
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error, confirmReset: false, isResetting: false };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#09090b',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'monospace',
          textAlign: 'center',
          zIndex: 99999
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>CRITICAL ERROR</h1>
          <p style={{ opacity: 0.8, marginBottom: '24px' }}>The application failed to initialize.</p>

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
                Reset Local Data / Reiniciar Datos
              </h2>
              <p style={{ color: '#d4d4d8', fontSize: '12px', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Resetting local data will clear cached sessions and offline state. This action is permanent and cannot be undone.
                <br />
                <span style={{ opacity: 0.7, fontSize: '11px' }}>
                  Esto borrará las sesiones en caché y el estado offline. Esta acción es permanente.
                </span>
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
                  {this.state.isResetting ? 'Resetting...' : 'Confirm Reset / Confirmar'}
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
                  Cancel / Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
            <button
              onClick={() => {
                window.location.reload();
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Reload App / Recargar
            </button>
            {!this.state.confirmReset && (
              <button
                onClick={() => {
                  this.setState({ confirmReset: true });
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#27272a',
                  color: '#f87171',
                  border: '1px solid #dc2626',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Reset Local Data / Reiniciar Datos
              </button>
            )}
          </div>

          <div style={{ width: '100%', maxWidth: '500px', textAlign: 'left', background: '#000', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
            <pre style={{ color: '#f87171', fontSize: '11px', margin: 0 }}>
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  (window as any).__appMounted = true;
} else {
  console.error("Root element not found");
  document.body.innerHTML = '<h1 style="color:red">FATAL: #root missing</h1>';
}
