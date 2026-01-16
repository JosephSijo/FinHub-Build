
import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Edit, Building2, CreditCard, Wallet, TrendingUp } from 'lucide-react';
import { Account, ACCOUNT_COLORS, ACCOUNT_ICONS } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/numberFormat';
import { Sparkles } from 'lucide-react';

const BANK_SUGGESTIONS = [
  { name: 'HDFC Bank', icon: '🏦', color: '#1d4ed8', type: 'bank' },
  { name: 'ICICI Bank', icon: '🏦', color: '#ea580c', type: 'bank' },
  { name: 'State Bank of India', icon: '🏦', color: '#2563eb', type: 'bank' },
  { name: 'Axis Bank', icon: '🏦', color: '#9d174d', type: 'bank' },
  { name: 'Kotak Mahindra Bank', icon: '🏦', color: '#dc2626', type: 'bank' },
  { name: 'Bank of America', icon: '🏦', color: '#0033aa', type: 'bank' },
  { name: 'Chase Bank', icon: '🏦', color: '#117aca', type: 'bank' },
  { name: 'Wells Fargo', icon: '🏦', color: '#d71e28', type: 'bank' },
  { name: 'HSBC', icon: '🏦', color: '#db0011', type: 'bank' },
  { name: 'Barclays', icon: '🏦', color: '#00aeef', type: 'bank' },
  { name: 'Standard Chartered', icon: '🏦', color: '#00945e', type: 'bank' },
  { name: 'Citibank', icon: '🏦', color: '#003b70', type: 'bank' },
  { name: 'DBS Bank', icon: '🏦', color: '#ff0000', type: 'bank' },
  { name: 'Federal Bank', icon: '🏦', color: '#0b5a91', type: 'bank' },
  { name: 'American Express', icon: '💳', color: '#006fcf', type: 'credit_card' },
  { name: 'Discover', icon: '💳', color: '#ff6600', type: 'credit_card' },
  { name: 'Capital One', icon: '💳', color: '#d22e2e', type: 'credit_card' },
  { name: 'Goldman Sachs', icon: '🏦', color: '#725a34', type: 'bank' },
  { name: 'Morgan Stanley', icon: '🏦', color: '#000033', type: 'bank' },
  { name: 'Apple Card', icon: '💳', color: '#000000', type: 'credit_card' },
  { name: 'PayPal', icon: '💳', color: '#003087', type: 'credit_card' },
  { name: 'Revolut', icon: '💳', color: '#000000', type: 'credit_card' },
  { name: 'Monzo', icon: '💳', color: '#ff4d4f', type: 'credit_card' },
];

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
    type: 'bank' as 'bank' | 'credit_card' | 'cash' | 'investment',
    balance: 0,
    color: ACCOUNT_COLORS[0],
    icon: ACCOUNT_ICONS[0].value,
    creditLimit: 0,
    safeLimitPercentage: 30,
    serviceChargePercentage: 0,
    statementDate: 1
  });
  const [suggestions, setSuggestions] = useState<typeof BANK_SUGGESTIONS>([]);

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance,
        color: account.color,
        icon: account.icon,
        creditLimit: account.creditLimit || 0,
        safeLimitPercentage: account.safeLimitPercentage || 30,
        serviceChargePercentage: account.serviceChargePercentage || 0,
        statementDate: account.statementDate || 1
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '',
        type: 'bank',
        balance: 0,
        color: ACCOUNT_COLORS[0],
        icon: ACCOUNT_ICONS[0].value,
        creditLimit: 0,
        safeLimitPercentage: 30,
        serviceChargePercentage: 0,
        statementDate: 1
      });
    }
    setSuggestions([]);
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (name.length > 1) {
      const filtered = BANK_SUGGESTIONS.filter(bank =>
        bank.name.toLowerCase().includes(name.toLowerCase())
      ).slice(0, 4);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (bank: typeof BANK_SUGGESTIONS[0]) => {
    setFormData({
      ...formData,
      name: bank.name,
      type: bank.type as 'bank' | 'credit_card' | 'cash',
      icon: bank.icon,
      color: bank.color
    });
    setSuggestions([]);
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 pb-24">
      {/* Page Header - Standardized Layout */}
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-3xl font-black text-slate-100 tracking-tight leading-none mb-3 truncate">Accounts & Cards</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 whitespace-nowrap">
              {accounts.filter(a => a.type === 'bank').length} Banks
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 whitespace-nowrap">
              {accounts.filter(a => a.type === 'credit_card').length} Credit
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 whitespace-nowrap">
              {accounts.filter(a => a.type === 'cash').length} Cash
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20 whitespace-nowrap">
              {accounts.filter(a => a.type === 'investment').length} Holding
            </span>
          </div>
          <p className="text-slate-500 font-bold max-w-md text-[10px] truncate">
            Monitor liquidity across core reservoirs and credit pools.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 h-12 font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Account</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Group: Liquidity Reservoirs (Banks) */}
      <div className="space-y-6">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-600 flex items-center gap-2 ml-2">
          <Building2 className="w-3.5 h-3.5" />
          Bank Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.filter(a => a.type === 'bank').map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          {accounts.filter(a => a.type === 'bank').length === 0 && (
            <EmptyState message="No bank accounts detected." />
          )}
        </div>
      </div>

      {/* Group: Credit Pools (Cards) */}
      <div className="space-y-6">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-600 flex items-center gap-2 ml-2">
          <CreditCard className="w-3.5 h-3.5" />
          Credit Cards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.filter(a => a.type === 'credit_card').map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          {accounts.filter(a => a.type === 'credit_card').length === 0 && (
            <EmptyState message="No credit pools detected." />
          )}
        </div>
      </div>

      {/* Group: Cold Storage (Cash) */}
      <div className="space-y-6">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-600 flex items-center gap-2 ml-2">
          <Wallet className="w-3.5 h-3.5" />
          Cash in Hand
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.filter(a => a.type === 'cash').map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          {accounts.filter(a => a.type === 'cash').length === 0 && (
            <EmptyState message="No physical liquid reservoirs detected." />
          )}
        </div>
      </div>

      {/* Group: Investment Holdings */}
      <div className="space-y-6">
        <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-600 flex items-center gap-2 ml-2">
          <TrendingUp className="w-3.5 h-3.5" />
          Investment Holding Nodes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.filter(a => a.type === 'investment').map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          {accounts.filter(a => a.type === 'investment').length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 p-8 border border-dashed border-white/5 squircle-22 flex items-center justify-center text-slate-600 font-bold text-xs">
              No investment nodes detected. Link them to track growth separately.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-slate-950 border-white/10 text-white squircle-22 p-8 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tight text-white mb-2">
              {editingAccount ? 'Refine Account' : 'New Liquidity Reservoir'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold mb-6">
              Establish a new liquidity pool in the Obsidian system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Account Identity</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Mercury Checking"
                  required
                  className="bg-white/5 border-white/5 squircle-12 h-14 text-white focus:ring-emerald-500/50"
                  autoComplete="off"
                />

                {suggestions.length > 0 && (
                  <div className="mt-3 p-4 bg-indigo-500/5 border border-indigo-500/10 squircle-12 flex items-start gap-4 animate-in fade-in zoom-in-95 duration-300">
                    <Sparkles className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-3 opacity-60">Intelligence Suggested</p>
                      <div className="grid grid-cols-1 gap-2">
                        {suggestions.map((bank) => (
                          <button
                            key={bank.name}
                            type="button"
                            onClick={() => applySuggestion(bank)}
                            className="flex items-center gap-3 p-2.5 squircle-12 bg-white/5 hover:bg-white/10 transition-all group border border-white/5"
                          >
                            <span className="text-lg group-hover:scale-110 transition-transform">{bank.icon}</span>
                            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{bank.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div
                  className={`p-4 squircle-12 border-2 cursor-pointer transition-all ${formData.type === 'bank' ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                  onClick={() => setFormData({ ...formData, type: 'bank' })}
                >
                  <div className="w-10 h-10 squircle-12 bg-emerald-500/20 flex items-center justify-center text-xl mb-2">🏦</div>
                  <p className="text-[9px] font-black uppercase text-white leading-tight">Bank Account</p>
                </div>
                <div
                  className={`p-4 squircle-12 border-2 cursor-pointer transition-all ${formData.type === 'credit_card' ? 'border-rose-500 bg-rose-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                  onClick={() => setFormData({ ...formData, type: 'credit_card' })}
                >
                  <div className="w-10 h-10 squircle-12 bg-rose-500/20 flex items-center justify-center text-xl mb-2">💳</div>
                  <p className="text-[9px] font-black uppercase text-white leading-tight">Credit Card</p>
                </div>
                <div
                  className={`p-4 squircle-12 border-2 cursor-pointer transition-all ${formData.type === 'cash' ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                  onClick={() => setFormData({ ...formData, type: 'cash' })}
                >
                  <div className="w-10 h-10 squircle-12 bg-amber-500/20 flex items-center justify-center text-xl mb-2">💵</div>
                  <p className="text-[9px] font-black uppercase text-white leading-tight">Cash in Hand</p>
                </div>
                <div
                  className={`p-4 squircle-12 border-2 cursor-pointer transition-all ${formData.type === 'investment' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'}`}
                  onClick={() => setFormData({ ...formData, type: 'investment' })}
                >
                  <div className="w-10 h-10 squircle-12 bg-blue-500/20 flex items-center justify-center text-xl mb-2">📈</div>
                  <p className="text-[9px] font-black uppercase text-white leading-tight">Investment</p>
                </div>
              </div>

              <div>
                <Label htmlFor="balance" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">
                  {formData.type === 'bank' || formData.type === 'cash' || formData.type === 'investment' ? 'Current Balance' : 'Amount Owed'}
                </Label>
                <NumberInput
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={(value) => setFormData({ ...formData, balance: parseFloat(value) || 0 })}
                  placeholder="0.00"
                  className="bg-white/5 border-white/5 squircle-12 h-14 text-white"
                  autoComplete="off"
                />
              </div>

              {formData.type === 'credit_card' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="creditLimit" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Total Credit Limit</Label>
                      <NumberInput
                        id="creditLimit"
                        name="creditLimit"
                        value={formData.creditLimit}
                        onChange={(value) => setFormData({ ...formData, creditLimit: parseFloat(value) || 0 })}
                        placeholder="e.g. 100000"
                        className="bg-white/5 border-white/5 squircle-12 h-14 text-white"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="safeLimit" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Safe Limit (%)</Label>
                      <NumberInput
                        id="safeLimit"
                        name="safeLimitPercentage"
                        value={formData.safeLimitPercentage}
                        onChange={(value) => setFormData({ ...formData, safeLimitPercentage: parseFloat(value) || 30 })}
                        placeholder="30"
                        className="bg-white/5 border-white/5 squircle-12 h-14 text-white"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceCharge" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Service Fee (%)</Label>
                      <NumberInput
                        id="serviceCharge"
                        name="serviceChargePercentage"
                        value={formData.serviceChargePercentage}
                        onChange={(value) => setFormData({ ...formData, serviceChargePercentage: parseFloat(value) || 0 })}
                        placeholder="0.0"
                        className="bg-white/5 border-white/5 squircle-12 h-14 text-white"
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <Label htmlFor="statementDate" className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Statement Date</Label>
                      <Select value={formData.statementDate.toString()} onValueChange={(v) => setFormData({ ...formData, statementDate: parseInt(v) })}>
                        <SelectTrigger id="statementDate" name="statementDate" className="bg-white/5 border-white/5 squircle-12 h-14 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white">
                          {[...Array(31)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">System Icon</Label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                  {ACCOUNT_ICONS.map((iconOption) => (
                    <button
                      key={iconOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconOption.value })}
                      className={`w-10 h-10 squircle-12 flex items-center justify-center text-lg border-2 transition-all ${formData.icon === iconOption.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                        }`}
                    >
                      {iconOption.value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Brand Color</Label>
                <div className="flex flex-wrap gap-3">
                  {ACCOUNT_COLORS.map((color) => {
                    const buttonProps = {
                      style: { '--btn-color': color } as React.CSSProperties
                    };
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        aria-label={`Select color ${color}`}
                        className={`w-8 h-8 rounded-full border-4 transition-all bg-[length:100%_100%] bg-[var(--btn-color)] ${formData.color === color
                          ? 'border-white scale-110 shadow-lg shadow-white/20'
                          : 'border-transparent hover:scale-105'
                          }`}
                        {...buttonProps}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 h-14 squircle-12 font-bold text-slate-500 hover:text-white"
              >
                Abort
              </Button>
              <Button type="submit" className="flex-1 h-14 squircle-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/20">
                {editingAccount ? 'Update Account' : 'Ignite Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  );

  function AccountCard({ account }: { account: Account }) {
    const isCC = account.type === 'credit_card';
    const safeLimit = isCC ? (account.creditLimit || 0) * (account.safeLimitPercentage || 30) / 100 : 0;
    const usagePercent = isCC && account.creditLimit ? (Math.abs(account.balance) / account.creditLimit) * 100 : 0;
    const isSafe = isCC && usagePercent <= (account.safeLimitPercentage || 30);

    return (
      <Card className="p-6 bg-slate-900/40 border-white/5 squircle-22 border hover:bg-slate-900/60 transition-all duration-300 group relative overflow-hidden">
        {(() => {
          const glowProps = {
            style: { '--card-glow': account.color } as React.CSSProperties
          };
          return (
            <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-5 -mr-12 -mt-12 transition-opacity group-hover:opacity-20 bg-[var(--card-glow)]" {...glowProps} />
          );
        })()}

        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            {(() => {
              const iconProps = {
                style: { '--icon-bg': account.color + '15' } as React.CSSProperties
              };
              return (
                <div
                  className="w-16 h-16 squircle-12 flex items-center justify-center text-3xl shadow-inner border border-white/5 group-hover:scale-105 transition-transform bg-[var(--icon-bg)]"
                  {...iconProps}
                >
                  {account.icon}
                </div>
              );
            })()}
            <div className="min-w-0">
              <h3 className="text-xl font-black text-slate-100 truncate">{account.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${!isCC ? 'bg-emerald-500' : isSafe ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">
                  {!isCC ? 'Bank Account' : 'Credit Card'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              title="Edit Account"
              size="sm"
              onClick={() => handleOpenDialog(account)}
              className="w-8 h-8 p-0 squircle-12 hover:bg-white/5 text-slate-600 hover:text-white transition-all"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              title="Delete Account"
              size="sm"
              onClick={() => handleDelete(account.id)}
              className="w-8 h-8 p-0 squircle-12 hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 relative z-10">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">
                {isCC ? 'Current Obligation' : 'Available Liquidity'}
              </p>
              {(() => {
                const balanceProps = {
                  style: { '--balance-color': account.color } as React.CSSProperties
                };
                return (
                  <h4 className="text-2xl font-black tabular-nums tracking-tight text-[var(--balance-color)]" {...balanceProps}>
                    {formatCurrency(account.balance, currency)}
                  </h4>
                );
              })()}
            </div>
            {isCC && account.creditLimit ? (
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Limit Use</p>
                <p className={`text-xs font-black tabular-nums ${isSafe ? 'text-indigo-400' : 'text-rose-400'}`}>
                  {usagePercent.toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/5">
                Synced
              </div>
            )}
          </div>

          {isCC && account.creditLimit && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-700 uppercase">Safe Threshold</p>
                <p className="text-[10px] font-black text-slate-500">
                  {formatCurrency(safeLimit, currency)}
                </p>
              </div>
              {account.serviceChargePercentage ? (
                <div className="text-right space-y-1">
                  <p className="text-[8px] font-black text-slate-700 uppercase">Svc Charge</p>
                  <p className="text-[10px] font-black text-slate-500">
                    {account.serviceChargePercentage}%
                  </p>
                </div>
              ) : null}
              {isCC && account.statementDate && (
                <div className="text-right space-y-1 ml-auto">
                  <p className="text-[8px] font-black text-slate-700 uppercase">Statement</p>
                  <p className="text-[10px] font-black text-slate-500">
                    Day {account.statementDate}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  function EmptyState({ message }: { message: string }) {
    return (
      <div className="py-12 text-center bg-slate-800/20 squircle-22 border border-dashed border-white/10 col-span-full">
        <p className="text-sm text-slate-500 font-bold">{message}</p>
      </div>
    );
  }
}
