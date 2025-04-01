import * as Sentry from "@sentry/react";

export type FeatureFlags = {
  NEW_STORE_API: boolean;
  STORE_CHECKOUT_ENABLED: boolean;
  NEW_REGISTRATION_FLOW: boolean;
  BASKETBALL_DRILLS_VIDEO: boolean;
  PARENT_DASHBOARD_V2: boolean;
  MAIN_STORE: boolean;
  PURCHASING_API: boolean;
  [key: string]: boolean;
};

export type FlagValue = string | number | boolean;
export type FlagMap = Record<string, FlagValue>;

export const defaultFlags: FeatureFlags = {
  NEW_STORE_API: false,
  STORE_CHECKOUT_ENABLED: true,
  NEW_REGISTRATION_FLOW: false,
  BASKETBALL_DRILLS_VIDEO: false,
  PARENT_DASHBOARD_V2: false,
  MAIN_STORE: false,
  PURCHASING_API: false,
};

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

export const getFlagsIntegration = () => {
  return Sentry.getClient()?.getIntegrationByName<Sentry.FeatureFlagsIntegration>(
    "FeatureFlags"
  );
};

export const setFeatureFlag = (flagName: string, value: boolean) => {
  const flagsIntegration = getFlagsIntegration();
  if (flagsIntegration) {
    flagsIntegration.addFeatureFlag(flagName, value);
  } else {
    console.warn("Feature flags integration not available");
  }
};

// Get current feature flags map
export const getCurrentFlagMap = (): FlagMap => {
  const overrides = getLocalStorage();
  return {
    ...defaultFlags,
    ...overrides,
  };
};

// Create Sentry Toolbar Feature Flag Adapter
export function FeatureFlagAdapter() {
  return {
    getFlagMap(): Promise<FlagMap> {
      return Promise.resolve(getCurrentFlagMap());
    },
    getOverrides(): Promise<FlagMap> {
      return Promise.resolve(getLocalStorage());
    },
    setOverride(name: string, override: FlagValue | undefined) {
      const prev = getLocalStorage();
      const updated: FlagMap = { ...prev, [name]: override ?? false };
      setLocalStorage(updated);
      
      setFeatureFlag(name, Boolean(override));
      
      // Dispatch storage event to trigger context updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: LOCALSTORAGE_KEY,
        newValue: JSON.stringify(updated),
        oldValue: JSON.stringify(prev)
      }));
    },
    clearOverrides() {
      clearLocalStorage();
      
      // Reset all flags to defaults
      Object.entries(defaultFlags).forEach(([flag, value]) => {
        setFeatureFlag(flag, value);
      });
      
      // Trigger a page reload to ensure all components pick up the new flag values
      window.location.reload();
    },
    urlTemplate: (name: string) => {
      const searchParams = new URLSearchParams({
        q: `repo:codyde/kidshoops ${name}`,
        type: 'code',
      });
      return new URL('/search?' + searchParams.toString(), 'https://github.com');
    },
  };
} 