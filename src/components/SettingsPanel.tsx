import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Settings, Sun, Moon, Monitor, DollarSign, Bell, Download, X, User as UserIcon, Camera } from 'lucide-react';
import { UserSettings, CURRENCY_SYMBOLS } from '../types';
import { AchievementsPanel } from './AchievementsPanel';
import { CurrencyConverter } from './CurrencyConverter';
import { toast } from 'sonner@2.0.3';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onExportData: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onExportData
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(settings.name || '');
  const [profilePhoto, setProfilePhoto] = useState(settings.photoURL || '');

  if (!isOpen) return null;

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

  const handleNotificationToggle = (enabled: boolean) => {
    if (enabled && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          onUpdateSettings({ notificationsEnabled: true });
          new Notification('Notifications Enabled!', {
            body: 'You\'ll now receive important financial updates.',
            icon: '/icon.png'
          });
        }
      });
    } else {
      onUpdateSettings({ notificationsEnabled: enabled });
    }
  };

  const handleSaveProfile = () => {
    onUpdateSettings({ name: profileName, photoURL: profilePhoto });
    setEditingProfile(false);
    toast.success('Profile updated successfully!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'] as const;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-end">
        <div
          className="w-full max-w-md bg-white dark:bg-gray-900 min-h-screen shadow-2xl transform transition-transform duration-300 overflow-y-auto"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Settings className="w-6 h-6" />
              <h2>Settings & Profile</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Settings */}
            <Card className="p-4">
              <h3 className="mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5" />
                Profile
              </h3>
              
              <div className="space-y-4">
                {/* Profile Photo */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt="Profile" 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-white" />
                      </div>
                    )}
                    {editingProfile && (
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1">
                    {editingProfile ? (
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Enter your name"
                        />
                      </div>
                    ) : (
                      <div>
                        <h4>{settings.name || 'Demo User'}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          demo-user-001
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit/Save Button */}
                <div className="flex gap-2">
                  {editingProfile ? (
                    <>
                      <Button 
                        onClick={handleSaveProfile} 
                        className="flex-1"
                      >
                        Save Profile
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingProfile(false);
                          setProfileName(settings.name || '');
                          setProfilePhoto(settings.photoURL || '');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingProfile(true)}
                      className="w-full"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Theme Settings */}
            <Card className="p-4">
              <h3 className="mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Appearance
              </h3>
              
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'light'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Sun className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">Light</span>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'dark'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Moon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">Dark</span>
                  </button>
                  
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'system'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">System</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Currency Settings */}
            <Card className="p-4">
              <h3 className="mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Currency
              </h3>
              
              <div className="space-y-3">
                <Label>Select Currency</Label>
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

            </Card>

            {/* Currency Converter Tool */}
            <CurrencyConverter />

            {/* Notifications */}
            <Card className="p-4">
              <h3 className="mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Enable Notifications</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Get alerts for bills and goals
                  </p>
                </div>
                <Switch
                  checked={settings.notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </Card>

            {/* Data Export */}
            <Card className="p-4">
              <h3 className="mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </h3>
              
              <Button onClick={onExportData} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export All Data (JSON)
              </Button>
            </Card>

            {/* Achievements */}
            <AchievementsPanel unlockedAchievements={settings.unlockedAchievements} />

            {/* App Info */}
            <Card className="p-4 text-center">
              <h3 className="text-2xl mb-2">💰 Financial Hub</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Version 3.2.0</p>
              <p className="text-xs text-gray-500 mt-2">
                Your AI-powered personal finance companion
              </p>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
