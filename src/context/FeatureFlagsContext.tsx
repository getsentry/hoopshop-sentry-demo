import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { FeatureFlags, defaultFlags, setFeatureFlag, getCurrentFlagMap } from '../utils/featureFlags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  toggleFlag: (flagName: keyof FeatureFlags) => void;
  updateFromOverrides: () => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(() => getCurrentFlagMap() as FeatureFlags);

  const updateFromOverrides = () => {
    const currentFlags = getCurrentFlagMap() as FeatureFlags;
    setFlags(currentFlags);
    // Update Sentry flags
    Object.entries(currentFlags).forEach(([flag, value]) => {
      setFeatureFlag(flag, Boolean(value));
    });
  };

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'feature-flag-overrides') {
        updateFromOverrides();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleFlag = (flagName: keyof FeatureFlags) => {
    const newValue = !flags[flagName];
    setFlags(prev => ({
      ...prev,
      [flagName]: newValue
    }));
    setFeatureFlag(String(flagName), newValue);
  };

  return (
    <FeatureFlagsContext.Provider value={{ flags, toggleFlag, updateFromOverrides }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
} 