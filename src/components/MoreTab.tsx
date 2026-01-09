import { Card } from './ui/card';
import {
  Shield,
  Landmark,
  ChevronRight,
  Settings,
  Bell,
  HelpCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../utils/numberFormat';

interface MoreTabProps {
  onNavigate: (view: 'emergency' | 'accounts' | 'recurring') => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  emergencyFundAmount: number;
  bankAccountsCount: number;
  cardsCount: number;
  currency: string;
  onOpenAbout: () => void;
}

export function MoreTab({
  onNavigate,
  onOpenSettings,
  onOpenNotifications,
  emergencyFundAmount,
  bankAccountsCount,
  cardsCount,
  currency,
  onOpenAbout
}: MoreTabProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-20">
      {/* Page Signature */}
      <div>
        <h2 className="text-3xl font-black text-slate-100 tracking-tight leading-none mb-3">Settings & Assets</h2>
        <p className="text-slate-500 font-bold max-w-md">
          Configure your financial universe and manage core system components.
        </p>
      </div>

      {/* Primary Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="p-8 cursor-pointer bg-black border-white/5 sq-2xl border hover:bg-white/5 transition-all duration-300 group relative overflow-hidden"
          onClick={() => onNavigate('emergency')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 blur-3xl opacity-5 -mr-12 -mt-12 transition-opacity group-hover:opacity-20" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 sq-md flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100">Emergency Fund</h3>
              <p className="text-2xl font-black tabular-nums text-blue-400">
                {formatCurrency(emergencyFundAmount, currency)}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-widest">Financial Safety Net</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Card>

        <Card
          className="p-8 cursor-pointer bg-black border-white/5 sq-2xl border hover:bg-white/5 transition-all duration-300 group relative overflow-hidden"
          onClick={() => onNavigate('accounts')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500 blur-3xl opacity-5 -mr-12 -mt-12 transition-opacity group-hover:opacity-20" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 sq-md flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform duration-500">
              <Landmark className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100">Accounts & Cards</h3>
              <div className="flex items-center gap-4">
                <div className="space-y-0.5">
                  <p className="text-2xl font-black tabular-nums text-emerald-400">{bankAccountsCount}</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Banks</p>
                </div>
                <div className="w-px h-8 bg-white/5 self-center mt-2" />
                <div className="space-y-0.5">
                  <p className="text-2xl font-black tabular-nums text-emerald-400">{cardsCount}</p>
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Cards</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-widest">Manage Liquidity</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Card>

        <Card
          className="p-8 cursor-pointer bg-black border-white/5 sq-2xl border hover:bg-white/5 transition-all duration-300 group relative overflow-hidden"
          onClick={() => onNavigate('recurring')}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500 blur-3xl opacity-5 -mr-12 -mt-12 transition-opacity group-hover:opacity-20" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 sq-md flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform duration-500">
              <RefreshCw className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-100">Recurring Flow</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">
                Subscriptions & EMIs
              </p>
            </div>

            <div className="mt-11 flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-widest">Active Commitments</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Card>
      </div>

      {/* Settings & Support Grid */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-6 bg-slate-700 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-600">System Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className="p-6 cursor-pointer bg-black border-white/5 sq-xl border hover:bg-white/5 transition-all group"
            onClick={onOpenSettings}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 sq-md flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-200 uppercase tracking-tight">App Settings</p>
                  <p className="text-[10px] text-slate-600 font-bold">Preferences & Display</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer bg-black border-white/5 sq-xl border hover:bg-white/5 transition-all group"
            onClick={onOpenNotifications}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 sq-md flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-200 uppercase tracking-tight">Alert Center</p>
                  <p className="text-[10px] text-slate-600 font-bold">System Notifications</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-400 transition-colors" />
            </div>
          </Card>

          <Card className="p-6 cursor-pointer bg-black border-white/5 sq-xl border hover:bg-white/5 transition-all group opacity-60 hover:opacity-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 sq-md flex items-center justify-center text-slate-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-200 uppercase tracking-tight">Support</p>
                  <p className="text-[10px] text-slate-600 font-bold">Documentation & Help</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 transition-colors" />
            </div>
          </Card>

          <Card
            className="p-6 cursor-pointer bg-black border-white/5 sq-xl border hover:bg-white/5 transition-all group opacity-60 hover:opacity-100"
            onClick={onOpenAbout}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 sq-md flex items-center justify-center text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-200 uppercase tracking-tight">About</p>
                  <p className="text-[10px] text-slate-600 font-bold">Version 5.0 Stable Release</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 transition-colors" />
            </div>
          </Card>
        </div>
      </div>

      {/* App Info Footer */}
      <div className="text-center pt-8 border-t border-white/5">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700 mb-1">Finbase Obsidian System</p>
        <p className="text-[9px] font-bold text-slate-800">BUILD 50.3.0 // QUANTUM CORE</p>
      </div>
    </div>
  );
}
