import React, { StrictMode, ReactNode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { requestBackgroundSync, requestPeriodicSync } from './services/backgroundSync';

console.log("Starting App Initialization...");

const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const swUrl = '/sw.js';
      navigator.serviceWorker.register(swUrl, { scope: '/' })
        .then((registration) => {
          console.log('ServiceWorker registration successful with scope:', registration.scope);

          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (!worker) return;

            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                worker.postMessage({ type: 'SKIP_WAITING' });
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

          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              marginBottom: '32px'
            }}
          >
            Factory Reset App
          </button>

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
} else {
  console.error("Root element not found");
  document.body.innerHTML = '<h1 style="color:red">FATAL: #root missing</h1>';
}
