import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Trash2, Edit, CreditCard, Building2 } from 'lucide-react';
import { Account, ACCOUNT_COLORS, ACCOUNT_ICONS, CURRENCY_SYMBOLS } from '../types';
import { toast } from 'sonner@2.0.3';

interface AccountsManagerProps {
  accounts: Account[];
  currency: string;
  onCreateAccount: (data: Omit<Account, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateAccount: (accountId: string, data: Partial<Account>) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
}

export function AccountsManager({
  accounts,
  currency,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount
}: AccountsManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'bank' as 'bank' | 'credit_card',
    balance: 0,
    color: ACCOUNT_COLORS[0],
    icon: ACCOUNT_ICONS[0].value
  });

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        color: account.color,
        icon: account.icon
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'bank',
        balance: 0,
        color: ACCOUNT_COLORS[0],
        icon: ACCOUNT_ICONS[0].value
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    try {
      if (editingAccount) {
        await onUpdateAccount(editingAccount.id, formData);
      } else {
        await onCreateAccount(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      try {
        await onDeleteAccount(accountId);
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2>Accounts & Cards</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your bank accounts and credit cards
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: account.color + '20' }}
                >
                  {account.icon}
                </div>
                <div>
                  <h3 className="text-base">{account.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    {account.type === 'bank' ? (
                      <>
                        <Building2 className="w-3 h-3" />
                        Bank Account
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3 h-3" />
                        Credit Card
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDialog(account)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(account.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="mt-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Balance</div>
              <div className="text-xl" style={{ color: account.color }}>
                {currencySymbol}{account.balance.toLocaleString()}
              </div>
            </div>
          </Card>
        ))}

        {accounts.length === 0 && (
          <Card className="p-8 col-span-full text-center">
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="mb-2">No accounts yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add your first bank account or credit card to start tracking transactions
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Account
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Edit your account details including name, type, balance, and appearance' : 'Create a new account by providing a name, type, initial balance, and customizing its appearance'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Chase Checking"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Account Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'bank' | 'credit_card') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Bank Account
                    </div>
                  </SelectItem>
                  <SelectItem value="credit_card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="balance">Current Balance</Label>
              <NumberInput
                id="balance"
                step="0.01"
                value={formData.balance}
                onChange={(value) => setFormData({ ...formData, balance: value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-2">
                {ACCOUNT_ICONS.map((iconOption) => (
                  <button
                    key={iconOption.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl border-2 transition-all ${
                      formData.icon === iconOption.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {iconOption.value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingAccount ? 'Update' : 'Create'} Account
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}