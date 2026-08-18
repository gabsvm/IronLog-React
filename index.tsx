import React, { StrictMode, ReactNode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import './index.css';
import './native-performance.css';
import App from './App';
import { requestBackgroundSync, requestPeriodicSync } from './services/backgroundSync';

console.log("Starting App Initialization...");

const isNativeShell = Capacitor.isNativePlatform();

// The installed Capacitor build has a different performance envelope from the
// browser PWA. Mark it once so CSS and navigation can use cheaper compositing.
if (isNativeShell) {
  document.documentElement.classList.add('native-shell');
  document.documentElement.dataset.effects = 'reduced';
  try {
    (document as any).startViewTransition = undefined;
  } catch (_) {
    // Some WebView versions expose it as a non-writable property. App.tsx also
    // checks the reduced-effects dataset before attempting a transition.
  }

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
  if (isNativeShell || !('serviceWorker' in navigator)) return;

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

if (!isNativeShell && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
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
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.props = props;
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private reloadApp = () => {
    window.location.reload();
  };

  private resetLocalAppData = () => {
    const confirmed = window.confirm(
      'This removes local GainsLab app data from this device and reloads the app. Use it only if reloading does not fix the problem. Continue?'
    );
    if (!confirmed) return;
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

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
          <h1 style={{ color: '#ef4444', fontSize: '24px', marginBottom: '16px' }}>APP ERROR</h1>
          <p style={{ opacity: 0.8, marginBottom: '8px', maxWidth: '520px' }}>
            A screen failed to render. Reload the app first; your local data will be kept.
          </p>
          <p style={{ opacity: 0.52, marginBottom: '24px', maxWidth: '520px', fontSize: '12px' }}>
            Una pantalla falló al renderizar. Primero recargá la app; tus datos locales se conservarán.
          </p>

          <button
            onClick={this.reloadApp}
            style={{
              minWidth: '240px',
              padding: '12px 24px',
              backgroundColor: '#b9ff24',
              color: '#09090b',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              marginBottom: '12px'
            }}
          >
            Reload App · Recargar
          </button>

          <button
            onClick={this.resetLocalAppData}
            style={{
              minWidth: '240px',
              padding: '10px 18px',
              backgroundColor: 'transparent',
              color: '#a1a1aa',
              border: '1px solid #3f3f46',
              borderRadius: '10px',
              fontWeight: 'bold',
              marginBottom: '32px'
            }}
          >
            Reset local data · Restablecer datos
          </button>

          <details style={{ width: '100%', maxWidth: '500px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#71717a', fontSize: '12px', marginBottom: '10px' }}>
              Error details · Detalles
            </summary>
            <div style={{ background: '#000', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
              <pre style={{ color: '#f87171', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {String(this.state.error)}
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
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error("Root element not found");
  document.body.innerHTML = '<h1 style="color:red">FATAL: #root missing</h1>';
}
