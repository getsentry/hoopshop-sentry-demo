# KidsHoops

A React application with feature flags implementation using Sentry for error monitoring and feature flag management.

## Getting Started

1. Clone the repository
2. Install dependencies for the frontend:
   ```bash
   npm install
   ```
3. Install dependencies for the backend:
   ```bash
   cd server-node
   npm install
   ```
4. Start the backend server:
   ```bash
   cd server-node
   node server.js
   ```
5. In a new terminal, start the frontend application:
   ```bash
   npm run dev
   ```

## Environment Variables

### Frontend (.env in project root)
```
VITE_SENTRY_DSN='<your-sentry-dsn>'
```

### Backend (.env in server-node directory)
```
FEATURE_FLAG_WEBHOOK_SECRET='<your-webhook-secret>'
SENTRY_WEBHOOK_URL='<your-sentry-webhook>'
```

The server uses dotenv to load these environment variables:
```javascript
// In server.js
require('dotenv').config();
const SENTRY_WEBHOOK_URL = process.env.SENTRY_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.FEATURE_FLAG_WEBHOOK_SECRET;
```

## Feature Development Toolbar

This project utilizes the Sentry Toolbar for feature flag management in development. Additionally, you can access the built-in Feature Flag Admin Menu in several ways:

1. **Keyboard Shortcut**: Press `CMD+K` (Mac) or `CTRL+K` (Windows/Linux) to open the Command Bar
2. **Sentry Toolbar**: Click the Sentry icon in your browser to access the Sentry toolbar which includes feature flag controls

## Feature Flags

This project implements a generic feature flag system that works with Sentry's feature flag capabilities.

You can change these flags at the `/flags` route in the browser, or using the command menu discussed earlier. 

 The available feature flags include:

| Flag Name | Description |
|-----------|-------------|
| SITE_RELAUNCH | Enables neo-brutalism basketball theme throughout the application |
| BACKEND_V2 | Required for checkout to work with SITE_RELAUNCH enabled |
| STORE_CHECKOUT_ENABLED | Legacy flag maintained for compatibility |
| MAIN_STORE | Legacy flag maintained for compatibility |

Feature flags can be managed in several ways:
- Through local storage overrides (via the Command Bar)
- Using the Sentry toolbar
- Via the backend server (for default values)

The backend server provides several endpoints for managing feature flags:
- `GET /api/flags`: Get current default flag values
- `POST /api/flags/defaults`: Update multiple default flag values
- `PATCH /api/flags/defaults/:flagName`: Update a single default flag value
- `POST /api/notify-flag-change`: Notify Sentry of local flag overrides

## Playwright Tests

The project includes Playwright tests for end-to-end testing. To run the tests:

```bash
# Run a specific test (checkout stress test)
npm run test:checkout

# Run a specific test with UI
npm run test:checkout:ui



Playwright is configured to run tests against Chrome by default, with other browsers commented out in the configuration. Tests run against a local development server at http://localhost:5173.