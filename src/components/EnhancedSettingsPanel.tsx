import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Sun, Moon, Monitor, DollarSign, User, Camera, ArrowLeftRight, Trophy, Upload } from 'lucide-react';
import { UserSettings, CURRENCY_SYMBOLS } from '../types';
import { getAllAchievements } from '../utils/achievements';

interface EnhancedSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
  onAchievementClick?: (achievementId: string) => void;
}

export const EnhancedSettingsPanel: React.FC<EnhancedSettingsPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onAchievementClick
}) => {
  const [name, setName] = useState(settings.name || '');
  const [photoURL, setPhotoURL] = useState(settings.photoURL || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  // Currency Converter State
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<string>('100');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'] as const;
  const toCurrency = settings.currency;

  useEffect(() => {
    setName(settings.name || '');
    setPhotoURL(settings.photoURL || '');
  }, [settings]);

  // Load exchange rates
  useEffect(() => {
    if (isOpen) {
      loadExchangeRates();
    }
  }, [isOpen, fromCurrency]);

  const loadExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      setExchangeRates(data.rates || {});
      convertCurrency(amount, data.rates);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const convertCurrency = (value: string, rates?: Record<string, number>) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const ratesToUse = rates || exchangeRates;
      const rate = ratesToUse[toCurrency] || 1;
      setConvertedAmount(numValue * rate);
    } else {
      setConvertedAmount(null);
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    convertCurrency(value);
  };

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

  const handleSaveProfile = () => {
    onUpdateSettings({ name, photoURL });
    setIsEditingProfile(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Get all achievements
  const allAchievements = getAllAchievements();
  const unlockedIds = new Set(settings.unlockedAchievements);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto px-6">
        <SheetHeader>
          <SheetTitle>Settings & Profile</SheetTitle>
          <SheetDescription>
            Customize your FinHub experience
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                {photoURL ? (
                  <img 
                    src={photoURL} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                {isEditingProfile && (
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
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
                {isEditingProfile ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Your Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <Button size="sm" onClick={handleSaveProfile} className="w-full">
                      Save Profile
                    </Button>
                  </div>
                ) : (
                  <>
                    <h4>{name || 'Guest User'}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      demo-user-001
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

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

          <Separator />

          {/* Currency Settings */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Base Currency
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

          <Separator />

          {/* Quick Currency Converter */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              Quick Currency Converter
            </Label>
            
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400">From</Label>
                  <Select value={fromCurrency} onValueChange={(value) => {
                    setFromCurrency(value);
                  }}>
                    <SelectTrigger className="mt-1">
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
                
                <div>
                  <Label className="text-xs text-gray-600 dark:text-gray-400">To (Your Currency)</Label>
                  <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-center">
                      {CURRENCY_SYMBOLS[toCurrency]} {toCurrency}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 dark:text-gray-400">Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="mt-1"
                />
              </div>

              {convertedAmount !== null && (
                <div className="p-3 bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Converted Amount</p>
                  <p className="text-green-600">
                    {CURRENCY_SYMBOLS[fromCurrency]}{amount} = {CURRENCY_SYMBOLS[toCurrency]}{convertedAmount.toFixed(2)}
                  </p>
                  {exchangeRates[toCurrency] && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Rate: 1 {fromCurrency} = {exchangeRates[toCurrency].toFixed(4)} {toCurrency}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Achievements */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Achievements ({settings.unlockedAchievements.length}/{allAchievements.length})
            </Label>
            
            <div className="grid grid-cols-4 gap-3">
              {allAchievements.map((achievement) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                return (
                  <button
                    key={achievement.id}
                    onClick={() => {
                      if (isUnlocked && onAchievementClick) {
                        onAchievementClick(achievement.id);
                      }
                    }}
                    disabled={!isUnlocked}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isUnlocked
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 hover:scale-110 hover:shadow-lg cursor-pointer'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-50 grayscale cursor-not-allowed'
                    }`}
                    title={isUnlocked ? `${achievement.name}: ${achievement.description}` : `Locked: ${achievement.name}`}
                  >
                    <div className="text-2xl text-center">{achievement.icon}</div>
                  </button>
                );
              })}
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              {settings.unlockedAchievements.length > 0 ? 'Click unlocked achievements to view details!' : 'Keep using FinHub to unlock more achievements!'}
            </p>
          </div>

          <Separator />

          {/* Copyright */}
          <div className="text-center py-4 space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Created By: <span className="font-medium">Sijo Joseph</span>
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              📞 9447147230 | 📅 Oct 2025
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              FinHub v3.2
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
