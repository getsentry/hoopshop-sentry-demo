import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { FeatureFlags } from '../utils/featureFlags';
import { useFeatureFlags } from '../context/FeatureFlagsContext';
import './CommandBar.css';

export function CommandBar() {
  const [open, setOpen] = useState(false);
  const { flags, toggleFlag } = useFeatureFlags();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Feature Flags Control"
      className="command-dialog"
    >
      <Command.Input placeholder="Search features..." />
      <Command.List>
        <Command.Group heading="Feature Flags">
          {Object.entries(flags).map(([flag, value]) => (
            <Command.Item
              key={flag}
              onSelect={() => toggleFlag(flag as keyof FeatureFlags)}
              className="command-item"
            >
              <div className="feature-flag-item">
                <span>{flag}</span>
                <span className={`status ${value ? 'enabled' : 'disabled'}`}>
                  {value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
} 