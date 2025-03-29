import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from "react-router-dom";
import App from './App.tsx';
import './index.css';
import { useEffect } from "react";
import { defaultFlags, setFeatureFlag } from './utils/featureFlags';

// Initialize Sentry with Toolbar and Feature Flag Adapter
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
    Sentry.featureFlagsIntegration()
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample rate for all sessions (10%)
  replaysOnErrorSampleRate: 1.0,
});

// Initialize default feature flags
Object.entries(defaultFlags).forEach(([flag, value]) => {
  setFeatureFlag(flag, value);
});

createRoot(document.getElementById('root')!).render(
  <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
    <App />
  </Sentry.ErrorBoundary>
);
