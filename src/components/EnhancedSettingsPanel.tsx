import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Separator } from './ui/separator';
import {
  User, Camera, TrendingUp, ArrowRightLeft, Trophy, Bot, X,
  Loader2, CheckCircle2, Trash2, ChevronDown, Settings2, LogOut, AlertOctagon
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import { UserSettings, CURRENCY_SYMBOLS } from '../types';
import { getAllAchievements } from '../utils/achievements';
import { resolveApiKey, validateApiKey } from '../services/ai';
import { toast } from 'sonner';
import { useFinance } from '../context/FinanceContext';

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
  const { logout, scheduleAccountDeletion } = useFinance();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Currency Converter State
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<string>('100');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

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
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      setExchangeRates(data.rates || {});
      if (amount) {
        convertCurrency(amount, data.rates);
      }
    } catch (error) {
      console.error('Error loading exchange rates:', error);
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

  const { setTheme } = useTheme();

  // Force dark theme if not already set, since light mode is being removed
  useEffect(() => {
    if (settings.theme !== 'dark') {
      setTheme('dark');
      onUpdateSettings({ theme: 'dark' });
    }
  }, []);


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

  // AI Configuration State
  const selectedProvider = settings.aiProvider || 'openai';

  const aiProviders = [
    { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
    { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
    { id: 'gemini', label: 'Gemini', placeholder: 'AIza...' },
    { id: 'deepseek', label: 'Deepseek', placeholder: 'sk-...' },
    { id: 'perplexity', label: 'Perplexity', placeholder: 'pplx-...' },
  ];

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInputChange = useCallback((key: keyof UserSettings, value: any) => {
    onUpdateSettings({ [key]: value });
  }, [onUpdateSettings]);

  const handleTestConnection = async () => {
    const key = resolveApiKey(selectedProvider, settings);
    if (!key) {
      toast.error('No API key found in Settings or System Environment');
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const response = await validateApiKey(selectedProvider, key);
      if (response.error) {
        setTestResult({ success: false, message: response.error });
        toast.error(`Connection failed: ${response.error}`);
      } else {
        setTestResult({ success: true, message: 'Neural link established.' });
        toast.success('Connection successful!');
      }
    } catch (error: any) {
      const msg = error.message || 'Unknown protocol error';
      setTestResult({ success: false, message: msg });
      toast.error(`Protocol breach: ${msg}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:max-w-lg overflow-y-auto px-0 bg-slate-950 border-white/5 text-slate-100 h-dvh">
        <SheetTitle className="sr-only">Settings</SheetTitle>
        <SheetDescription className="sr-only">Customize your FinHub core experience.</SheetDescription>
        <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-500 px-8 pt-12 pb-10 text-white relative">
          {/* Close Button Area */}
          <div className="absolute top-4 right-4 z-20">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <h2 className="text-3xl font-black text-slate-100 tracking-tight leading-none text-white">System Config</h2>
            </div>
            <p className="text-slate-500 font-bold ml-4 text-sm">
              Customize your FinHub core experience.
            </p>
          </div>

          <div className="space-y-10">
            {/* Profile Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  User Identity
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-white/5"
                >
                  {isEditingProfile ? 'Abort' : 'Refine'}
                </Button>
              </div>

              <div className="flex items-center gap-8 bg-slate-900/40 p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 blur-3xl opacity-5 -mr-12 -mt-12" />
                <div className="relative">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center shadow-2xl">
                      <User className="w-12 h-12 text-white/90" />
                    </div>
                  )}
                  {isEditingProfile && (
                    <label className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-500 shadow-lg border-4 border-slate-900 transition-transform active:scale-90">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        aria-label="Upload profile picture"
                      />
                    </label>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="settings-profile-name" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Alias</Label>
                        <Input
                          id="settings-profile-name"
                          name="name"
                          placeholder="e.g. Maverick"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-white/5 border-white/5 rounded-xl h-12 text-white placeholder:text-slate-700 font-bold"
                          autoComplete="name"
                        />
                      </div>
                      <Button size="sm" onClick={handleSaveProfile} className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl">
                        Commit Identity
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-2xl font-black text-slate-100 tracking-tight">{name || 'Guest User'}</h4>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                        FinHub Node // 0x50.3
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>


            <div className="h-px bg-white/5" />

            {/* Virtual Round Up Settings */}
            <div className="space-y-4">
              <button
                onClick={() => onUpdateSettings({ roundUpEnabled: !settings.roundUpEnabled })}
                className={`w-full flex items-center justify-between p-6 rounded-[32px] border transition-all relative overflow-hidden group ${settings.roundUpEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                  : 'bg-slate-900/40 border-white/5 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                  }`}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 -mr-12 -mt-12 transition-colors ${settings.roundUpEnabled ? 'bg-emerald-500' : 'bg-slate-500'
                  }`} />

                <div className="space-y-1 relative z-10 flex-1 pr-4 text-left">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-100 uppercase tracking-tight">
                    <TrendingUp className={`w-4 h-4 ${settings.roundUpEnabled ? 'text-emerald-500' : 'text-slate-500'}`} />
                    Virtual Round-Ups
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                    Build your fortress automatically via expense spillover.
                  </p>
                </div>

                <div className={`relative z-10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${settings.roundUpEnabled
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500'
                  }`}>
                  {settings.roundUpEnabled ? 'Active' : 'Offline'}
                </div>
              </button>
            </div>

            <div className="h-px bg-white/5" />

            <div className="space-y-4">
              <Label htmlFor="settings-currency" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Standard Denomination
              </Label>
              <div className="bg-slate-900/40 p-6 rounded-[32px] border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 blur-3xl opacity-5 -mr-12 -mt-12" />
                <div className="space-y-2 relative z-10">
                  <Select
                    value={settings.currency}
                    onValueChange={(value: any) => onUpdateSettings({ currency: value })}
                  >
                    <SelectTrigger id="settings-currency" name="currency" className="bg-white/5 border-white/5 rounded-2xl h-14 font-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                      <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                      <SelectItem value="AED">AED (د.إ) - UAE Dirham</SelectItem>
                      <SelectItem value="SAR">SAR (﷼) - Saudi Riyal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* Quick Currency Converter */}
            <div className="space-y-6">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5" />
                Foreign Exchange Probe
              </Label>

              <div className="space-y-6 p-6 bg-slate-900/40 rounded-[32px] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 blur-3xl opacity-5 -mr-12 -mt-12" />

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="space-y-1.5">
                    <Label htmlFor="converter-from-currency" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Source</Label>
                    <Select value={fromCurrency} onValueChange={(value: string) => {
                      setFromCurrency(value);
                    }}>
                      <SelectTrigger id="converter-from-currency" name="fromCurrency" className="bg-white/5 border-white/5 rounded-2xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        {currencies.map(curr => (
                          <SelectItem key={curr} value={curr}>
                            {CURRENCY_SYMBOLS[curr]} {curr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Target</Label>
                    <div className="h-12 flex items-center justify-center bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs font-black text-indigo-400">
                      {CURRENCY_SYMBOLS[toCurrency]} {toCurrency}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 relative z-10">
                  <Label htmlFor="converter-amount" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Capital Amount</Label>
                  <Input
                    id="converter-amount"
                    name="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (parseFloat(val) < 0) return;
                      handleAmountChange(val);
                    }}
                    min="0"
                    className="bg-white/5 border-white/5 rounded-2xl h-14 font-black text-lg"
                    autoComplete="off"
                  />
                </div>

                {convertedAmount !== null && (
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-2 relative z-10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Calculated Projection</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-emerald-400 tabular-nums">
                        {CURRENCY_SYMBOLS[toCurrency]}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        ESTIMATED VALUATION
                      </p>
                    </div>
                    {exchangeRates[toCurrency] && (
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-700">Protocol Rate</span>
                        <span className="text-[10px] font-black text-slate-500 tabular-nums">
                          1 {fromCurrency} = {exchangeRates[toCurrency].toFixed(4)} {toCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* AI Configuration */}
            <div className="space-y-6">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                AI Assistant Config
              </Label>

              <div className="space-y-6 bg-slate-900/40 p-6 rounded-[32px] border border-white/5 relative overflow-hidden group">
                <div className="space-y-1.5 relative z-10">
                  <Label htmlFor="ai-provider-select" className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-1">Preferred Provider</Label>
                  <Select
                    value={selectedProvider}
                    onValueChange={(value: string) => onUpdateSettings({ aiProvider: value })}
                  >
                    <SelectTrigger id="ai-provider-select" name="aiProvider" className="bg-slate-900 border-white/5 rounded-xl h-11 text-[10px] font-bold uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      {aiProviders.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold uppercase tracking-widest">{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 pt-2 relative z-10">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Credential</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-bold text-indigo-400/70 uppercase tracking-tighter">
                        {aiProviders.find(p => p.id === selectedProvider)?.label}
                      </span>
                    </div>
                  </div>

                  {aiProviders.filter(p => p.id === selectedProvider).map((provider) => {
                    const settingKey = settings.apiKeys?.[provider.id as keyof typeof settings.apiKeys];
                    const envKeyName = `VITE_${provider.id.toUpperCase()}_API_KEY`;
                    const hasEnvKey = !!import.meta.env[envKeyName];

                    return (
                      <div key={provider.id} className="flex items-center gap-3 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 group/active transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="relative group/input">
                            <Input
                              type="password"
                              value={settingKey || ''}
                              onChange={(e) => handleInputChange('apiKeys', { ...settings.apiKeys, [provider.id]: e.target.value })}
                              placeholder={hasEnvKey ? 'Using System Environment Key' : `Enter ${provider.label} Key`}
                              className={`bg-transparent border-none p-0 h-auto text-sm font-bold text-white placeholder:text-slate-700 focus-visible:ring-0 shadow-none ${hasEnvKey && !settingKey ? 'opacity-40 italic font-medium' : ''}`}
                              disabled={hasEnvKey && !settingKey}
                            />
                            {hasEnvKey && !settingKey && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1 py-0.5 rounded">
                                  System Linked
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        {settingKey && (
                          <button
                            onClick={() => handleInputChange('apiKeys', { ...settings.apiKeys, [provider.id]: '' })}
                            className="text-slate-600 hover:text-rose-500 transition-colors p-1"
                            title="Clear saved key"
                            aria-label={`Clear saved key for ${provider.label}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <Button
                    onClick={handleTestConnection}
                    disabled={isTestingConnection || !resolveApiKey(selectedProvider, settings)}
                    className={`w-full h-11 transition-all font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl ${testResult?.success
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : testResult?.success === false
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      }`}
                  >
                    {isTestingConnection ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </div>
                    ) : testResult?.success ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Link Stable
                      </div>
                    ) : (
                      'Validate Connection'
                    )}
                  </Button>
                </div>

                <Collapsible className="relative z-10">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full h-8 hover:bg-white/5 text-slate-500 hover:text-slate-300 text-[8px] font-bold uppercase tracking-widest group/trigger flex items-center justify-between px-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings2 className="w-3 h-3 text-slate-600 group-hover/trigger:text-slate-400" />
                        Alternative Nodes
                      </div>
                      <ChevronDown className="w-3 h-3 transition-transform duration-300 group-data-[state=open]/trigger:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid gap-2">
                      {aiProviders.filter(p => p.id !== selectedProvider).map((provider) => {
                        const settingKey = settings.apiKeys?.[provider.id as keyof typeof settings.apiKeys];
                        const envKeyName = `VITE_${provider.id.toUpperCase()}_API_KEY`;
                        const hasEnvKey = !!import.meta.env[envKeyName];

                        return (
                          <div key={provider.id} className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                                  {provider.label}
                                </span>
                                {hasEnvKey && !settingKey && (
                                  <span className="text-[7px] font-bold text-emerald-500/50 uppercase tracking-tighter">
                                    System
                                  </span>
                                )}
                              </div>
                              <Input
                                type="password"
                                value={settingKey || ''}
                                onChange={(e) => handleInputChange('apiKeys', { ...settings.apiKeys, [provider.id]: e.target.value })}
                                placeholder={hasEnvKey ? 'Using System Default' : 'Key not found'}
                                className="bg-transparent border-none p-0 h-auto text-[10px] text-slate-400 placeholder:text-slate-800 focus-visible:ring-0 shadow-none italic font-medium cursor-not-allowed"
                                disabled={hasEnvKey && !settingKey}
                              />
                            </div>
                            {settingKey && (
                              <button
                                onClick={() => handleInputChange('apiKeys', { ...settings.apiKeys, [provider.id]: '' })}
                                className="text-slate-800 hover:text-rose-500 transition-colors p-1"
                                title="Clear saved key"
                                aria-label={`Clear saved key for ${provider.label}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Achievements */}
          <div className="space-y-6">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Reputation Rank ({settings.unlockedAchievements.length}/{allAchievements.length})
            </Label>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
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
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center text-xl transition-all ${isUnlocked
                      ? 'border-amber-500/50 bg-amber-500/10 grayscale-0 hover:scale-110 hover:shadow-lg hover:shadow-amber-500/20 active:scale-95'
                      : 'border-white/5 bg-white/5 grayscale opacity-20 cursor-not-allowed'
                      }`}
                  >
                    {achievement.icon}
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-500 font-bold text-center leading-relaxed">
              {settings.unlockedAchievements.length > 0 ? 'Select a sigil to view the record of your triumph.' : 'Initiate financial protocols to manifest higher ranks.'}
            </p>
          </div>

          <Separator className="bg-white/5" />

          {/* Copyright System Footer */}
          <div className="text-center pt-8 space-y-2 opacity-40 hover:opacity-100 transition-opacity duration-700 pb-10">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-100">Obsidian System Node</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
              Architect: Sijo Joseph // BUILD 50.3.0 // QUANTUM CORE
            </p>
            <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest mt-4">
              © 2025 NEURAL FINBASE FABRIC
            </p>
          </div>

          <div className="px-2 pb-10">
            <Button
              variant="outline"
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full h-14 bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/60 hover:text-white font-black uppercase tracking-widest gap-3 rounded-[24px] transition-all group mb-4"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Terminate Session
            </Button>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-14 bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40 text-rose-500 font-black uppercase tracking-widest gap-3 rounded-[24px] transition-all group"
                >
                  <AlertOctagon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Delete Account & Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-950 border-white/10 text-white rounded-[32px] p-8">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-full bg-rose-500/20 text-rose-500">
                      <AlertOctagon className="w-6 h-6" />
                    </div>
                    Irreversible Action?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-400 font-medium leading-relaxed mt-4">
                    Your account will be <span className="text-white font-bold italic">deactivated immediately</span> and scheduled for permanent deletion in <span className="text-white font-bold">30 days</span>.
                    <br /><br />
                    Log in anytime before then to cancel this request and restore your data node.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-8 gap-3">
                  <AlertDialogCancel className="h-14 flex-1 rounded-2xl bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white font-black uppercase tracking-widest transition-all">
                    Abort
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await scheduleAccountDeletion();
                      onClose();
                    }}
                    className="h-14 flex-1 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                  >
                    Confirm Purge
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
