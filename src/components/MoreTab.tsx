import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Shield, 
  User, 
  Landmark,
  ChevronRight,
  Settings,
  Bell,
  HelpCircle,
  FileText
} from 'lucide-react';

interface MoreTabProps {
  onNavigate: (view: 'emergency' | 'accounts') => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  emergencyFundAmount: number;
  accountsCount: number;
  currency: string;
  currencySymbol: string;
}

export function MoreTab({
  onNavigate,
  onOpenSettings,
  onOpenNotifications,
  emergencyFundAmount,
  accountsCount,
  currency,
  currencySymbol
}: MoreTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2>More Options</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Additional features and settings
        </p>
      </div>

      {/* Primary Features */}
      <div className="space-y-3">
        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('emergency')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3>Emergency Fund</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currencySymbol}{emergencyFundAmount.toLocaleString()}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card 
          className="p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('accounts')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Landmark className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3>Accounts & Cards</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {accountsCount} {accountsCount === 1 ? 'account' : 'accounts'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Settings & Actions */}
      <div>
        <h3 className="mb-3">Settings & Support</h3>
        <div className="space-y-2">
          <Card 
            className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onOpenSettings}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </Card>

          <Card 
            className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onOpenNotifications}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>Notifications</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </Card>

          <Card className="p-3 cursor-pointer hover:shadow-sm transition-shadow opacity-70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>Help & Support</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </Card>

          <Card className="p-3 cursor-pointer hover:shadow-sm transition-shadow opacity-70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>About FinHub</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </Card>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
        <p>FinHub v3.2</p>
        <p className="text-xs mt-1">Your Personal Finance Guru</p>
      </div>
    </div>
  );
}
