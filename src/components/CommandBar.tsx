import React, { useState, useEffect } from 'react';
import * as Sentry from "@sentry/react";
import { Command } from 'cmdk';
import { FeatureFlags } from '../utils/featureFlags';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import { setFeatureFlag, clearLocalStorage } from '../utils/featureFlags';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Switch } from './ui/switch';

// Renamed function to match filename
export function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const { flags, refreshFlagsFromSource, updateLocalFlag } = useFeatureFlags();
  const [flagsToEdit, setFlagsToEdit] = useState<FeatureFlags>({} as FeatureFlags);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingFlag, setUpdatingFlag] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Keyboard Listener for Cmd+K ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);
  // -----------------------------------

  // --- Fetch current defaults when menu opens ---
  useEffect(() => {
    if (isOpen) {
      const fetchCurrentDefaults = async () => {
        setIsLoading(true);
        setError(null);
        setFlagsToEdit({ ...flags }); // Clear previous state
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
          // setFlagsToEdit(null); // Already cleared above
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDefaults();
    }
  }, [isOpen]); // Remove flags from dependency array to prevent infinite loops
  // ---------------------------------------------

  // Add a function to clear overrides for specific flag
  const clearOverrideForFlag = (flagName: string) => {
    console.log(`🧹 CommandBar - Clearing any local override for ${flagName}`);
    const overrides = JSON.parse(localStorage.getItem('feature-flag-overrides') || '{}');
    
    if (flagName in overrides) {
      // Only if there was an override for this flag
      const updatedOverrides = { ...overrides };
      delete updatedOverrides[flagName];
      
      localStorage.setItem('feature-flag-overrides', JSON.stringify(updatedOverrides));
      console.log(`✅ CommandBar - Removed local override for ${flagName}`);
      
      // Trigger storage event to update context
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'feature-flag-overrides',
        newValue: JSON.stringify(updatedOverrides),
        oldValue: JSON.stringify(overrides)
      }));
    }
  };

  // --- Handle Toggling and Immediate Update ---
  const handleToggle = async (flagName: keyof FeatureFlags) => {
    // Get the new value - opposite of current value in flagsToEdit
    const newValue = !flagsToEdit[flagName];
    
    // Clear previous errors
    setError(null);
    
    // Track which flag is being updated, but don't disable the UI yet
    setUpdatingFlag(flagName as string);
    
    // 1. Make immediate UI updates first
    // Update local state immediately - most important for responsive UI
    setFlagsToEdit(prev => ({
      ...prev,
      [flagName]: newValue
    }));
    
    // Update context for immediate app-wide response - THIS IS CRITICAL
    // This directly updates the flag in the FeatureFlagsContext for reactivity
    updateLocalFlag(flagName as string, newValue);
    
    // Also dispatch a custom event for any components that may be listening
    const event = new CustomEvent('flag-value-changed', {
      detail: { flagName, value: newValue }
    });
    window.dispatchEvent(event);
    
    // Update Sentry context 
    setFeatureFlag(flagName as string, newValue);
    
    // Handle local storage override
    const overrides = JSON.parse(localStorage.getItem('feature-flag-overrides') || '{}');
    const updatedOverrides = { ...overrides };
    
    if (newValue !== flagsToEdit[flagName]) {
      // Only update localStorage if we're overriding the default
      updatedOverrides[flagName] = newValue;
    } else {
      // If setting back to default, remove the override
      delete updatedOverrides[flagName];
    }
    
    // Save the updated overrides
    localStorage.setItem('feature-flag-overrides', JSON.stringify(updatedOverrides));
    
    // 2. Now handle the backend operations asynchronously
    // Use a timeout to ensure UI updates are completed first
    setTimeout(async () => {
      try {
        // Make the API request to update server default
        const response = await fetch(`http://localhost:3001/api/flags/defaults/${flagName}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ value: newValue })
        });
        
        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        
        console.log(`✅ Flag ${flagName} saved to database`);
      } catch (error) {
        console.error('❌ Error toggling flag:', error);
        
        // Revert UI updates
        setFlagsToEdit(prev => ({
          ...prev,
          [flagName]: !newValue
        }));
        
        // Revert context updates
        updateLocalFlag(flagName as string, !newValue);
        setFeatureFlag(flagName as string, !newValue);
        
        // Also dispatch revert event
        const revertEvent = new CustomEvent('flag-value-changed', {
          detail: { flagName, value: !newValue }
        });
        window.dispatchEvent(revertEvent);
        
        // Revert localStorage updates
        const currentOverrides = JSON.parse(localStorage.getItem('feature-flag-overrides') || '{}');
        if (!newValue === flagsToEdit[flagName]) {
          delete currentOverrides[flagName];
        } else {
          currentOverrides[flagName] = !newValue;
        }
        localStorage.setItem('feature-flag-overrides', JSON.stringify(currentOverrides));
        
        setError(`Failed to update ${flagName}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        // Clear updating flag state
        setUpdatingFlag(null);
      }
    }, 0);
  };
  // -------------------------------------------

  // Add a function to clear all overrides
  const clearAllOverrides = () => {
    console.log('🧹 CommandBar - Clearing all local overrides');
    
    // Get current overrides before clearing
    const overrides = JSON.parse(localStorage.getItem('feature-flag-overrides') || '{}');
    
    // Clear localStorage
    clearLocalStorage();
    
    // Directly refresh flags without relying on storage event
    refreshFlagsFromSource().then(() => {
      // For each flag that was previously overridden, fire a reactive update event
      Object.keys(overrides).forEach(flagName => {
        const defaultValue = flagsToEdit[flagName as keyof FeatureFlags];
        
        // Dispatch event to ensure all components update
        const event = new CustomEvent('flag-value-changed', {
          detail: { flagName, value: defaultValue }
        });
        window.dispatchEvent(event);
      });
    });
    
    console.log('✅ CommandBar - All local overrides cleared');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Feature Flags
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <Command className="rounded-lg border shadow-md">
            <Command.Input 
              placeholder="Search flags or actions..." 
              className="w-full px-4 py-4 text-lg border-b border-gray-200 focus:outline-none" 
            />
            <Command.List className="max-h-[400px] overflow-y-auto p-3">
              <Command.Empty>No results found.</Command.Empty>
              {isLoading && <Command.Item disabled className="p-3 text-center text-gray-500">Loading defaults...</Command.Item>}
              {error && <Command.Item disabled className="p-3 text-red-600 text-center">Error: {error}</Command.Item>}

              {!isLoading && !error && (
                <>
                  <Command.Group heading="Default Flags" className="text-xs font-medium text-gray-500 px-2 py-2">
                    {flagsToEdit && Object.entries(flagsToEdit).map(([name, value]) => (
                      <Command.Item 
                        key={name} 
                        value={name}
                        className="flex justify-between items-center w-full p-4 rounded-md hover:bg-gray-50"
                      >
                        <span className="font-medium text-brand-navy text-sm">{name}</span>
                        <div className="flex items-center gap-2">
                          {updatingFlag === name && (
                            <span className="text-xs text-orange-500 animate-pulse">Saving...</span>
                          )}
                          <Switch 
                            id={`switch-${name}`}
                            checked={Boolean(value)}
                            onCheckedChange={() => handleToggle(name as keyof FeatureFlags)}
                            // Don't disable the switch - allow immediate visual feedback
                          />
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                </>
              )}
            </Command.List>
          </Command>
        </div>
        
        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={clearAllOverrides}
            className="inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear Local Overrides
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 