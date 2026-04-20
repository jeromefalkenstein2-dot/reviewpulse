import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider as AppBridgeProvider, useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge/utilities';
import { Toaster } from 'react-hot-toast';

import { setSessionTokenProvider } from './api/client';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

function getAppBridgeConfig() {
  const params = new URLSearchParams(window.location.search || window.top?.location?.search);
  return {
    apiKey: import.meta.env.VITE_SHOPIFY_API_KEY || '',
    host: params.get('host') || '',
    forceRedirect: true,
  };
}

function SessionBridge({ children }) {
  const app = useAppBridge();
  useEffect(() => {
    setSessionTokenProvider(() => getSessionToken(app));
  }, [app]);
  return children;
}

export default function App() {
  const config = getAppBridgeConfig();

  // Dev mode or no host param: skip App Bridge
  const skipBridge = import.meta.env.DEV === true;

  const inner = (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'Inter', sans-serif",
            fontSize: '13.5px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
            border: '1px solid rgba(0,0,0,0.06)',
          },
          success: {
            iconTheme: { primary: '#1a5c38', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing"  element={<Billing />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );

  if (skipBridge) return inner;

  return (
    <AppBridgeProvider config={config}>
      <SessionBridge>{inner}</SessionBridge>
    </AppBridgeProvider>
  );
}
