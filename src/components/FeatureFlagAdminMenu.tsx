import React, { useState, useEffect, useCallback } from 'react';
import { Command } from 'cmdk';
import { FeatureFlags } from '../utils/featureFlags'; // Assuming FeatureFlags type is still exported
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from './ui/dialog';
import { Switch } from './ui/switch';

export function FeatureFlagAdminMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [flagsToEdit, setFlagsToEdit] = useState<FeatureFlags | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingFlags, setUpdatingFlags] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        setSuccessMessage(null);
        try {
          const response = await fetch('http://localhost:3001/api/flags');
          if (!response.ok) {
            throw new Error(`Failed to fetch defaults: ${response.statusText}`);
          }
          const data = await response.json();
          setFlagsToEdit(data);
        } catch (err) {
          console.error("Error fetching flag defaults:", err);
          setError(err instanceof Error ? err.message : "Unknown error fetching defaults");
          setFlagsToEdit(null); // Clear flags on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDefaults();
    }
  }, [isOpen]);
  // ---------------------------------------------

  // --- Handle local toggle with improved UI feedback ---
  const handleToggle = useCallback((flagName: keyof FeatureFlags) => {
    // First update UI immediately
    setFlagsToEdit((prevFlags) => {
      if (!prevFlags) return null;
      return {
        ...prevFlags,
        [flagName]: !prevFlags[flagName],
      };
    });
    
    // Show updating indicator without blocking UI
    setUpdatingFlags(prev => {
      const newSet = new Set(prev);
      newSet.add(flagName as string);
      return newSet;
    });
    
    // Clear indicator after a short delay (simulating fast response)
    setTimeout(() => {
      setUpdatingFlags(prev => {
        const newSet = new Set(prev);
        newSet.delete(flagName as string);
        return newSet;
      });
    }, 300);
  }, []);
  // -------------------------------------------

  // --- Handle saving updated defaults ---
  const handleSave = async () => {
    if (!flagsToEdit) return;
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    
    // Start with optimistic success message
    setSuccessMessage('Saving default flags...');
    
    try {
      const response = await fetch('http://localhost:3001/api/flags/defaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flagsToEdit),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save defaults: ${response.statusText}`);
      }
      setSuccessMessage('Default flags saved successfully!');
      // Optionally close the menu on success after a delay
      // setTimeout(() => setIsOpen(false), 1500);
    } catch (err) {
      console.error("Error saving flag defaults:", err);
      setError(err instanceof Error ? err.message : "Unknown error saving defaults");
      setSuccessMessage(null);
    } finally {
      setIsSaving(false);
    }
  };
  // --------------------------------------

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Set Default Feature Flags
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <Command className="rounded-lg border shadow-md">
            <Command.Input 
              placeholder="Search flags..." 
              className="w-full px-4 py-4 text-lg border-b border-gray-200 focus:outline-none" 
            />
            <Command.List className="max-h-[400px] overflow-y-auto p-3">
              <Command.Empty>No flags found.</Command.Empty>
              {isLoading && <Command.Item disabled className="p-3 text-center text-gray-500">Loading defaults...</Command.Item>}
              {error && <Command.Item disabled className="p-3 text-red-600 text-center">Error: {error}</Command.Item>}
              {successMessage && <Command.Item disabled className="p-3 text-green-600 text-center">{successMessage}</Command.Item>}

              {flagsToEdit && !isLoading && !error && Object.entries(flagsToEdit).map(([name, value]) => (
                <Command.Item 
                  key={name} 
                  value={name}
                  className="flex justify-between items-center w-full p-4 rounded-md hover:bg-gray-50"
                >
                  <span className="font-medium text-brand-navy text-sm">{name}</span>
                  <div className="flex items-center gap-2">
                    {updatingFlags.has(name) && (
                      <span className="text-xs text-orange-500 animate-pulse">
                        Updated
                      </span>
                    )}
                    <Switch 
                      id={`switch-${name}`}
                      checked={Boolean(value)}
                      onCheckedChange={() => handleToggle(name as keyof FeatureFlags)}
                    />
                  </div>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
        
        <DialogFooter className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !flagsToEdit}
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand-orange px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Default Values'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 