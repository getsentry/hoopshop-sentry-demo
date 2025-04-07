import * as Sentry from "@sentry/react";

export type FeatureFlags = {
  STORE_CHECKOUT_ENABLED: boolean; // Legacy flag, maintained for compatibility but not used functionally
  MAIN_STORE: boolean; // Legacy flag, maintained for compatibility but not used functionally
  SITE_RELAUNCH: boolean; // Neo-brutalism basketball theme
  BACKEND_V2: boolean; // Required for checkout to work with SITE_RELAUNCH
  [key: string]: boolean;
};

export type FlagValue = string | number | boolean;
export type FlagMap = Record<string, FlagValue>;

// This will hold the defaults fetched from the server
let serverDefaultFlags: FeatureFlags = {} as FeatureFlags;

// Flags for the Sentry Toolbar - only need to fetch once on initial load
let initialFlagsForToolbar: FlagMap | null = null;

// --- Simplified function to fetch defaults from server ---
export async function fetchServerDefaults(): Promise<FeatureFlags> {
  // Only log on localhost for development
  const isLocalhost = window.location.hostname === 'localhost';
  
  // Only fetch if we don't have defaults yet
  if (Object.keys(serverDefaultFlags).length > 0) {
    if (isLocalhost) console.log("Using already fetched server default flags");
    return serverDefaultFlags;
  }
  
  try {
    if (isLocalhost) console.log("Fetching initial defaults from /api/flags...");
    const response = await fetch('http://localhost:3001/api/flags');
    if (!response.ok) {
      throw new Error(`Failed to fetch flags: ${response.statusText}`);
    }
    serverDefaultFlags = await response.json();
    if (isLocalhost) console.log("Fetched server default flags:", serverDefaultFlags);
    return serverDefaultFlags;
  } catch (error) {
    console.error("Error fetching server default flags, returning last known or empty:", error);
    return serverDefaultFlags;
  }
}

const LOCALSTORAGE_KEY = 'feature-flag-overrides';

export function getLocalStorage(): FlagMap {
  try {
    return JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function setLocalStorage(overrides: FlagMap) {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(overrides));
  } catch {
    return;
  }
}

export function clearLocalStorage() {
  localStorage.setItem(LOCALSTORAGE_KEY, '{}');
}

// --- Function to send notifications to the backend proxy ---
// This function is now only relevant for the adapter if we re-enable notifications later
// async function notifyBackendProxy(...) { ... }
// We can comment it out or keep it if desired, but it won't be called by the adapter.
// -----------------------------------------------------------

export const getFlagsIntegration = () => {
  return Sentry.getClient()?.getIntegrationByName<Sentry.FeatureFlagsIntegration>(
    "FeatureFlags"
  );
};

// --- Simplified setFeatureFlag: Only updates Sentry context ---
export const setFeatureFlag = (flagName: string, value: boolean) => {
  const flagsIntegration = getFlagsIntegration();
  if (flagsIntegration) {
    flagsIntegration.addFeatureFlag(flagName, value);
  } else {
    console.warn("Feature flags integration not available");
  }
  // NO notification logic here anymore
};
// -------------------------------------------------------------

// --- Get current feature flags map (NOW ASYNC) ---
// Needs to be async to ensure defaults are fetched before calculating current map
export async function getCurrentFlagMap(): Promise<FlagMap> {
  // Only log on localhost for development
  const isLocalhost = window.location.hostname === 'localhost';
  
  if (isLocalhost) console.log("🔍 getCurrentFlagMap called");
  
  // Use already fetched defaults if available instead of calling fetchServerDefaults again
  let defaults: FeatureFlags;
  if (Object.keys(serverDefaultFlags).length > 0) {
    defaults = serverDefaultFlags;
    if (isLocalhost) console.log("🔍 getCurrentFlagMap - using cached defaults");
  } else {
    defaults = await fetchServerDefaults();
    if (isLocalhost) console.log("🔍 getCurrentFlagMap - defaults freshly fetched");
  }
  
  const overrides = getLocalStorage();
  if (isLocalhost) console.log("🔍 getCurrentFlagMap - overrides:", overrides);
  
  const mergedFlags = {
    ...defaults,
    ...overrides,
  };
  
  // Store the initial flags for the toolbar
  if (!initialFlagsForToolbar) {
    initialFlagsForToolbar = { ...mergedFlags };
    if (isLocalhost) console.log("🔍 Stored initial flags for toolbar");
  }
  
  if (isLocalhost) console.log("🔍 getCurrentFlagMap - returning merged flags:", mergedFlags);
  return mergedFlags;
}
// -----------------------------------------------

// --- Create Sentry Toolbar Feature Flag Adapter (Simplified) ---
export function FeatureFlagAdapter() {
  return {
    // Only get flags once on first call, then reuse that data
    async getFlagMap(): Promise<FlagMap> {
      // If we don't have initial flags yet, get them once
      if (!initialFlagsForToolbar) {
        initialFlagsForToolbar = await getCurrentFlagMap();
        return initialFlagsForToolbar;
      }
      
      // On subsequent calls, just return the stored flags + any new overrides
      const overrides = getLocalStorage();
      return {
        ...initialFlagsForToolbar,
        ...overrides
      };
    },
    
    getOverrides(): Promise<FlagMap> {
      return Promise.resolve(getLocalStorage());
    },
    
    // setOverride: ONLY UPDATES LOCALLY, NOT DATABASE
    async setOverride(name: string, override: FlagValue | undefined) {
      const isLocalhost = window.location.hostname === 'localhost';
      if (isLocalhost) console.log(`🏷️ DEV TOOLBAR: Setting local-only override for ${name}=${override}`);
      
      // Get current overrides from localStorage
      const overridesPrev = getLocalStorage();
      
      // Update localStorage with new override
      const updatedOverrides: FlagMap = { ...overridesPrev };
      const newBooleanValue = Boolean(override);

      if (override !== undefined) {
        updatedOverrides[name] = newBooleanValue;
      } else {
        // If override is undefined, it means we are clearing this specific override
        delete updatedOverrides[name];
      }
      
      // Save to localStorage
      setLocalStorage(updatedOverrides);

      // Update Sentry context for the toolbar UI
      setFeatureFlag(name, newBooleanValue);
      
      // Dispatch storage event for the FeatureFlagsContext to detect
      window.dispatchEvent(new StorageEvent('storage', {
        key: LOCALSTORAGE_KEY,
        newValue: JSON.stringify(updatedOverrides),
        oldValue: JSON.stringify(overridesPrev)
      }));
      
      // Also dispatch our custom event for immediate response
      window.dispatchEvent(new CustomEvent('flag-value-changed', {
        detail: { flagName: name, value: newBooleanValue }
      }));
      
      // Update any stored flags if they exist
      if (initialFlagsForToolbar) {
        initialFlagsForToolbar[name] = newBooleanValue;
      }
    },
    
    // Clear all overrides
    async clearOverrides() {
      // Get current overrides before clearing
      const overridesPrev = getLocalStorage();
      
      // Clear localStorage
      clearLocalStorage();
      
      // Reset Sentry context flags to their defaults
      const defaults = await fetchServerDefaults(); 
      Object.entries(defaults).forEach(([flag, value]) => {
        setFeatureFlag(flag, Boolean(value));
        
        // Dispatch individual flag-changed events to notify components
        window.dispatchEvent(new CustomEvent('flag-value-changed', {
          detail: { flagName: flag, value: Boolean(value) }
        }));
      });
      
      // Dispatch storage event for context to detect
      window.dispatchEvent(new StorageEvent('storage', {
        key: LOCALSTORAGE_KEY,
        newValue: '{}',
        oldValue: JSON.stringify(overridesPrev)
      }));
      
      // Reset initial flags back to server defaults
      if (initialFlagsForToolbar) {
        initialFlagsForToolbar = { ...defaults };
      }
    },
  };
}