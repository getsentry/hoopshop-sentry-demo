# KidsHoops Feature Flag Demo

This project demonstrates how feature flag changes can impact an application's functionality and appearance. The demo shows how enabling a new feature (SITE_RELAUNCH) can lead to errors if dependent features (BACKEND_V2) aren't enabled together.

## Setup Instructions

1. Start the backend server:
   ```
   cd server-node
   npm install
   node server.js
   ```

2. In a new terminal, start the frontend application:
   ```
   npm install
   npm run dev
   ```

## Demo Workflow

### Step 1: Initial State (Default Configuration)
- All flags are reset to their default state
- Regular basketball theme UI design is visible
- Checkout flow works normally with the legacy API

### Step 2: Enable SITE_RELAUNCH Flag
- Run the following command in a new terminal:
  ```
  cd server-node
  node enable-site-relaunch.js
  ```
- Refresh the browser to see the neo-brutalism basketball theme applied
- Try to add products to cart and check out - you'll encounter an error about "Unable to connect to API. The relaunch requires BACKEND_V2 to be enabled."
- The error is sent to Sentry with detailed tags

### Step 3: Use Sentry Toolbar to Override
- Open the Sentry toolbar by clicking the Sentry icon in the browser
- Find the SITE_RELAUNCH flag and disable it
- Checkout flow now works again as you've disabled the problematic flag

### Step 4: Enable Both Flags
- Run the following command in a new terminal:
  ```
  cd server-node
  node enable-both-flags.js
  ```
- Refresh the browser
- The neo-brutalism basketball theme is applied again
- Checkout flow works correctly now that both flags are enabled

### Reset Demo
- To reset the demo to the initial state, run:
  ```
  cd server-node
  node reset-for-demo.js
  ```

## Feature Flags

| Flag Name | Description |
|-----------|-------------|
| SITE_RELAUNCH | Enables neo-brutalism basketball theme throughout the application |
| BACKEND_V2 | Required for checkout to work with SITE_RELAUNCH enabled |
| STORE_CHECKOUT_ENABLED | Legacy flag maintained for compatibility |
| MAIN_STORE | Legacy flag maintained for compatibility |

We've cleaned up the feature flags to focus on just the ones relevant to the demo scenario.

## Command Bar

You can also manage feature flags from within the application:
- Press CMD+K (or CTRL+K) to open the Command Bar
- Toggle flags directly in the UI