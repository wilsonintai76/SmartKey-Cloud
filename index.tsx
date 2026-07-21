import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './AppRoot';

// Patch console methods to prevent preview environment's logger bridge from crashing on circular structures (like React Fiber nodes)
const originalConsoleLog = console.log;
console.log = (...args) => {
  const safeArgs = args.map(arg => {
    try {
      JSON.stringify(arg);
      return arg;
    } catch(e) {
      if (arg instanceof Error) return arg.message;
      return typeof arg === 'object' ? `[Unserializable Object: ${arg?.constructor?.name}]` : String(arg);
    }
  });
  originalConsoleLog(...safeArgs);
};

const originalConsoleError = console.error;
console.error = (...args) => {
  const safeArgs = args.map(arg => {
    try {
      JSON.stringify(arg);
      return arg;
    } catch(e) {
      if (arg instanceof Error) return arg.message;
      return typeof arg === 'object' ? `[Unserializable Object: ${arg?.constructor?.name}]` : String(arg);
    }
  });
  originalConsoleError(...safeArgs);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const safeArgs = args.map(arg => {
    try {
      JSON.stringify(arg);
      return arg;
    } catch(e) {
      if (arg instanceof Error) return arg.message;
      return typeof arg === 'object' ? `[Unserializable Object: ${arg?.constructor?.name}]` : String(arg);
    }
  });
  originalConsoleWarn(...safeArgs);
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '20px', backgroundColor: '#fef2f2', color: '#991b1b', fontFamily: 'monospace'}}>
          <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>Application Render Error</h1>
          <p>The application encountered a critical error while rendering.</p>
          <pre style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', overflowX: 'auto'}}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const PwaPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showPrompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '20px', left: '20px', right: '20px', 
      backgroundColor: 'white', padding: '16px', borderRadius: '8px', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 9999,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <span style={{color: 'black', fontWeight: 'bold'}}>Install this app on your device for quick access!</span>
      <div>
        <button 
          onClick={() => setShowPrompt(false)} 
          style={{padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#666', marginRight: '8px'}}
        >
          Not now
        </button>
        <button 
          onClick={() => {
            if (deferredPrompt) {
              deferredPrompt.prompt();
              deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt');
                } else {
                  console.log('User dismissed the install prompt');
                }
                setDeferredPrompt(null);
                setShowPrompt(false);
              });
            }
          }}
          style={{padding: '8px 16px', border: 'none', background: '#2563eb', color: 'white', borderRadius: '4px', cursor: 'pointer'}}
        >
          Install
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (!container) throw new Error("Root not found");
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <PwaPrompt />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}
