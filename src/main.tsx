import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from "react-router-dom";
import App from './App.tsx';
import './index.css';
import { useEffect } from "react";
import { defaultFlags, setFeatureFlag } from './utils/featureFlags';
import { faker } from '@faker-js/faker';

// Set random user on load
const userEmail = faker.internet.email();
Sentry.setUser({ email: userEmail });
console.log(`Setting Sentry user: ${userEmail}`);

// Initialize Sentry with Toolbar and Feature Flag Adapter
Sentry.init({
  dsn: 'https://02735a9ae1b7e3c2fc703f9bee1f6b23@o4508130833793024.ingest.us.sentry.io/4509059750821888',
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

  _experiments: {
    enableLogs: true,
  },
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
