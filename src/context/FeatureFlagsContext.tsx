import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { FeatureFlags, getCurrentFlagMap, fetchServerDefaults, getLocalStorage } from '../utils/featureFlags';

interface FeatureFlagsContextType {
  flags: FeatureFlags;
  refreshFlagsFromSource: () => Promise<void>;
  updateLocalFlag: (flagName: string, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({} as FeatureFlags);
  const [serverDefaults, setServerDefaults] = useState<FeatureFlags>({} as FeatureFlags);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagsToEdit, setFlagsToEdit] = useState<FeatureFlags>({} as FeatureFlags);
  
  // Use memoized callback to prevent unnecessary re-renders
  const refreshFlagsFromSource = useCallback(async () => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) console.log("🔄 Refreshing flags from source (DB defaults + localStorage)...");
    
    try {
      // This will use cached server defaults if available
      const currentFlags = await getCurrentFlagMap();
      if (isLocalhost) console.log("📊 Got flags from source:", currentFlags);
      
      // Force a new object reference to ensure state update even if values haven't changed
      setFlags({...currentFlags} as FeatureFlags);
      
      // Only fetch server defaults if not already loaded
      if (Object.keys(serverDefaults).length === 0) {
        if (isLocalhost) console.log("📊 Fetching server defaults (first time)");
        const defaults = await fetchServerDefaults();
        setServerDefaults({...defaults});
      } else if (isLocalhost) {
        console.log("📊 Using already cached server defaults");
      }
      
      if (isLocalhost) console.log("✅ Flags state updated in context");
    } catch (error) {
       console.error("❌ Failed to refresh flags from source:", error);
       setFlags({} as FeatureFlags);
    }
  }, [serverDefaults]);

  const refreshFromLocalStorage = useCallback(() => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) console.log("📱 Refreshing flags from localStorage only (no server fetch)");
    
    try {
      const overrides = getLocalStorage();
      if (isLocalhost) console.log("📊 Local overrides:", overrides);
      
      const mergedFlags = {
        ...serverDefaults,
        ...overrides
      };
      
      if (isLocalhost) console.log("✅ Updated flags from localStorage:", mergedFlags);
      
      // Force a new object reference to ensure state updates
      setFlags({...mergedFlags} as FeatureFlags);
    } catch (error) {
      console.error("❌ Failed to refresh from localStorage:", error);
    }
  }, [serverDefaults]);

  const updateLocalFlag = useCallback((flagName: string, value: boolean) => {
    const isLocalhost = window.location.hostname === 'localhost';
    
    if (isLocalhost) console.log(`🔄 Directly updating flag in context: ${flagName} = ${value}`);
    
    setFlags(current => {
      // Create a new object to ensure React detects the change
      const newFlags = {
        ...current,
        [flagName]: value
      };
      
      if (isLocalhost) console.log("✅ Updated flags in context:", newFlags);
      
      // This will trigger a re-render in components using the flags
      return newFlags;
    });
    
    // Fire a custom event in case other parts of the application need to know
    const event = new CustomEvent('flag-value-changed', { 
      detail: { flagName, value }
    });
    window.dispatchEvent(event);
  }, []);

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost';
    if (isLocalhost) console.log("🚀 FeatureFlagsProvider mounted - fetching initial flags");
    refreshFlagsFromSource();
  }, [refreshFlagsFromSource]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'feature-flag-overrides') {
        const isLocalhost = window.location.hostname === 'localhost';
        if (isLocalhost) console.log("📢 Storage change detected for 'feature-flag-overrides', refreshing flags...");
        
        // Only refresh if there's actual new data
        if (e.newValue !== e.oldValue) {
          refreshFromLocalStorage();
        } else if (isLocalhost) {
          console.log("📢 Storage event had same values, skipping refresh");
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshFromLocalStorage]);

  useEffect(() => {
    const handleFlagChange = (e: CustomEvent) => {
      const { flagName, newValue } = e.detail;
      const isLocalhost = window.location.hostname === 'localhost';
      if (isLocalhost) console.log(`📢 Custom event received: Flag ${flagName} changed to ${newValue}`);
      updateLocalFlag(flagName, newValue);
    };
    
    window.addEventListener('feature-flag-changed', handleFlagChange as EventListener);
    return () => window.removeEventListener('feature-flag-changed', handleFlagChange as EventListener);
  }, [updateLocalFlag]);

  useEffect(() => {
    if (isOpen) {
      const fetchCurrentDefaults = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fetch from GET /api/flags to get current defaults
          const response = await fetch('http://localhost:3001/api/flags');
          if (!response.ok) {
            throw new Error(`Failed to fetch defaults: ${response.statusText}`);
          }
          const data = await response.json();
          setFlagsToEdit(data);
        } catch (err) {
          console.error("Error fetching flag defaults:", err);
          setError(err instanceof Error ? err.message : "Unknown error fetching defaults");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDefaults();
    }
  }, [isOpen]);

  // Memoize the context value to prevent unnecessary renders
  const contextValue = useMemo(() => {
    return { flags, refreshFlagsFromSource, updateLocalFlag };
  }, [flags, refreshFlagsFromSource, updateLocalFlag]);

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
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