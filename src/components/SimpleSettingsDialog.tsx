import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sun, Moon, Monitor, DollarSign } from 'lucide-react';
import { UserSettings, CURRENCY_SYMBOLS } from '../types';

interface SimpleSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export const SimpleSettingsDialog: React.FC<SimpleSettingsDialogProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ theme });
    
    // Apply theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your Financial Hub experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Theme Settings */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              Theme
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  settings.theme === 'light'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span className="text-sm">Light</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  settings.theme === 'dark'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5" />
                <span className="text-sm">Dark</span>
              </button>
              
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  settings.theme === 'system'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Monitor className="w-5 h-5" />
                <span className="text-sm">System</span>
              </button>
            </div>
          </div>

          {/* Currency Settings */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Currency
            </Label>
            <Select value={settings.currency} onValueChange={(value) => onUpdateSettings({ currency: value as any })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map(curr => (
                  <SelectItem key={curr} value={curr}>
                    {CURRENCY_SYMBOLS[curr]} {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
