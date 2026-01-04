import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { X, Sparkles, TrendingUp, Users } from 'lucide-react';
import { EXPENSE_CATEGORIES, Account } from '../types';
import { isTransfer } from '../utils/isTransfer';
import { Checkbox } from './ui/checkbox';
import { autoCategorize } from '../utils/autoCategorize';
import { formatCurrency } from '../utils/numberFormat';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'expense' | 'income' | 'debt';
  onSubmit: (data: any) => void;
  initialData?: any;
  accounts: Account[];
  currency: string;
  roundUpEnabled?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  type,
  onSubmit,
  initialData,
  accounts,
  currency,
  roundUpEnabled = true // Default to true if not provided
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    source: '',
    personName: '',
    debtType: 'borrowed',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    tags: [] as string[],
    isRecurring: false,
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    endDate: '',
    isIncomeGenerating: false,
    justification: '',
    debtDueDate: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        description: initialData.description || '',
        amount: initialData.amount?.toString() || '',
        category: initialData.category || '',
        source: initialData.source || '',
        personName: initialData.personName || '',
        debtType: initialData.type || 'borrowed',
        accountId: initialData.accountId || '',
        date: initialData.date || new Date().toISOString().split('T')[0],
        tags: initialData.tags || [],
        isRecurring: initialData.isRecurring || false,
        frequency: initialData.frequency || 'monthly',
        endDate: initialData.endDate || '',
        isIncomeGenerating: initialData.isIncomeGenerating || false,
        justification: initialData.justification || '',
        debtDueDate: initialData.dueDate || ''
      });
    } else if (accounts.length > 0 && !formData.accountId) {
      // Auto-select first account for new transactions
      setFormData(prev => ({ ...prev, accountId: accounts[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  useEffect(() => {
    const text = type === 'expense' ? formData.description :
      type === 'income' ? formData.description :
        formData.personName;

    if (text.length > 2 && !initialData) {
      // Use local categorization for instant feedback
      const suggestion = autoCategorize(text);

      if (suggestion) {
        setSuggestedCategory(suggestion.category);
        setSuggestedTags(suggestion.tags);
      } else {
        // Clear if no match found
        setSuggestedCategory(null);
        setSuggestedTags([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.description, formData.personName, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountId && accounts.length > 0) {
      alert('Please select an account');
      return;
    }

    let data: any = {
      amount: parseFloat(formData.amount),
      date: formData.date,
      tags: formData.tags,
      accountId: formData.accountId || (accounts.length > 0 ? accounts[0].id : ''),
      isRecurring: formData.isRecurring,
      frequency: formData.frequency,
      startDate: formData.date, // For recurring transactions
      endDate: formData.endDate || undefined,
      isIncomeGenerating: formData.isIncomeGenerating,
      justification: formData.justification
    };

    if (type === 'expense') {
      data = {
        ...data,
        description: formData.description,
        category: formData.category,
        roundUpAmount: (formData as any).roundUpAmount
      };
    } else if (type === 'income') {
      data = {
        ...data,
        source: formData.description
      };
    } else if (type === 'debt') {
      data = {
        ...data,
        personName: formData.personName,
        type: formData.debtType,
        dueDate: formData.debtDueDate || undefined
      };
    }

    const selectedAccount = accounts.find(a => a.id === formData.accountId);
    if (type === 'expense' && selectedAccount?.type === 'credit_card') {
      // If user is paying INTO a credit card (Expense from somewhere else or just recording the repayment)
      // Actually, an "Expense" from a bank account to a CC should be a Transfer.
      // If they are in the context of the CC account adding an expense, it's a normal spend.
      // BUT if they are adding a "Credit Card Bill" payment, it should be a transfer.
      if (isTransfer({ description: formData.description, category: formData.category })) {
        data.category = 'Transfer';
      }
    }

    onSubmit(data);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      description: '',
      amount: '',
      category: '',
      source: '',
      personName: '',
      debtType: 'borrowed',
      accountId: accounts.length > 0 ? accounts[0].id : '',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      isRecurring: false,
      frequency: 'monthly',
      endDate: '',
      isIncomeGenerating: false,
      justification: '',
      debtDueDate: ''
    });
    setTagInput('');
    setSuggestedCategory(null);
    setSuggestedTags([]);
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleTagInputChange = (value: string) => {
    // Check if comma is entered
    if (value.includes(',')) {
      const newTags = value
        .split(',')
        .map(t => t.trim())
        .filter(t => t && !formData.tags.includes(t));

      if (newTags.length > 0) {
        setFormData({ ...formData, tags: [...formData.tags, ...newTags] });
        setTagInput('');
      }
    } else {
      setTagInput(value);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const applySuggestion = () => {
    if (suggestedCategory) {
      setFormData({ ...formData, category: suggestedCategory, tags: [...new Set([...formData.tags, ...suggestedTags])] });
      setSuggestedCategory(null);
      setSuggestedTags([]);
    }
  };

  const handlePickContact = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name'];
        const opts = { multiple: false };
        const contacts = await (navigator as any).contacts.select(props, opts);

        if (contacts.length > 0 && contacts[0].name?.length > 0) {
          const contactName = contacts[0].name[0];
          setFormData(prev => ({ ...prev, personName: contactName }));
          if (window.navigator.vibrate) window.navigator.vibrate(20);
        }
      } catch (err) {
        console.error('Contact picker error:', err);
        // Fallback or silent fail
      }
    } else {
      alert('Contact Selection is only available on supported mobile browsers.');
    }
  };

  const quickAmounts = [100, 500, 1000, 5000];

  // Amount suggestion handlers
  const appendZeros = (count: number) => {
    const currentAmount = formData.amount || '0';
    const newAmount = currentAmount + '0'.repeat(count);
    setFormData({ ...formData, amount: newAmount });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black border-white/5 p-0 shadow-2xl custom-scrollbar sq-2xl">
        <div className={`px-8 pt-10 pb-8 border-b border-white/5 relative overflow-hidden ${type === 'expense' ? 'bg-rose-500/5' :
          type === 'income' ? 'bg-emerald-500/5' :
            'bg-yellow-500/5'
          }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -mr-16 -mt-16 ${type === 'expense' ? 'bg-rose-500' :
            type === 'income' ? 'bg-emerald-500' :
              'bg-yellow-500'
            }`} />

          <DialogHeader className="relative z-10">
            <DialogTitle className="text-2xl font-black tracking-tighter text-slate-100">
              {initialData ? 'Update' : 'Add'}{' '}
              {type === 'expense' ? 'Money Out' : type === 'income' ? 'Money In' : 'Personal IOU'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
              {type === 'debt' ? (
                "Protocol for personal liquidity exchange"
              ) : (
                `Recording ${type === 'expense' ? 'capital depletion' : 'capital injection'} event`
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Selection */}
            {accounts.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="transaction-account" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Account Reservoir</Label>
                <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                  <SelectTrigger id="transaction-account" name="accountId" className="h-12 bg-black border-white/5 sq-md focus:ring-1 focus:ring-white/10 text-slate-200 font-bold">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/5">
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id} className="focus:bg-white/5 focus:text-white">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold">{account.name}</span>
                          <span className="text-[10px] text-slate-500 ml-4 font-mono">
                            {formatCurrency(account.balance, currency)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 sq-md text-[10px] font-black uppercase tracking-widest text-amber-400">
                ⚠️ Protocol Failure: No accounts detected
              </div>
            )}

            {/* Description/Source/Person */}
            <div className="space-y-2">
              <Label htmlFor="transaction-description" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                {type === 'expense' ? 'Description' : type === 'income' ? 'Source' : 'Person Name'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="transaction-description"
                  name="description"
                  value={type === 'debt' ? formData.personName : formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [type === 'debt' ? 'personName' : 'description']: e.target.value
                    })
                  }
                  placeholder={
                    type === 'expense'
                      ? 'Starbucks Coffee, Netflix...'
                      : type === 'income'
                        ? 'Salary, Freelance...'
                        : 'John Doe'
                  }
                  required
                  className="h-12 bg-black border-white/5 sq-md focus:border-white/10 text-slate-200 font-bold placeholder:text-slate-600 flex-1"
                  autoComplete="off"
                />
                {type === 'debt' && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handlePickContact}
                    className="h-12 w-12 bg-white/5 border border-white/5 sq-md flex items-center justify-center p-0 text-slate-400 hover:text-white"
                    title="Select from Contacts"
                  >
                    <Users className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* AI Suggestion */}
              {suggestedCategory && (
                <div className="mt-3 p-4 bg-indigo-500/5 border border-indigo-500/10 sq-md flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 leading-tight">
                      Intelligence Suggested
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-bold">
                      {type === 'expense' && (
                        <>Category: <span className="text-slate-100 uppercase">{suggestedCategory}</span></>
                      )}
                      {suggestedTags.length > 0 && (
                        <> • Tags: <span className="text-slate-100">{suggestedTags.join(', ')}</span></>
                      )}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={applySuggestion}
                      className="mt-3 h-8 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 sq-sm text-[10px] font-black uppercase tracking-widest w-full"
                    >
                      Auto-Configure Form
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="transaction-amount" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Capital Value</Label>
              <div className="flex gap-2">
                <NumberInput
                  id="transaction-amount"
                  name="amount"
                  value={formData.amount}
                  onChange={(value) => setFormData({ ...formData, amount: value })}
                  placeholder="0.00"
                  step="any"
                  min="0"
                  required
                  className="flex-1 h-14 bg-black border-white/5 sq-md focus:border-white/10 text-xl font-black text-slate-100 placeholder:text-slate-800"
                  autoComplete="off"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => appendZeros(2)}
                    className="px-3 h-[25px] bg-white/5 text-[10px] font-black text-slate-400 hover:text-white sq-sm border border-white/5"
                    title="Add 00"
                  >
                    +00
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => appendZeros(3)}
                    className="px-3 h-[25px] bg-white/5 text-[10px] font-black text-slate-400 hover:text-white sq-sm border border-white/5"
                    title="Add 000"
                  >
                    +000
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                    className="flex-1 py-2 text-[10px] font-black bg-black border border-white/5 text-slate-500 sq-md hover:bg-white/5 hover:text-slate-200 transition-all uppercase tracking-widest"
                  >
                    {amount}
                  </button>
                ))}
              </div>

              {/* Round Up Option */}
              {roundUpEnabled && type === 'expense' && formData.amount && parseFloat(formData.amount) > 0 && (
                (() => {
                  const amount = parseFloat(formData.amount);
                  const target = amount < 100 ? Math.ceil(amount / 10) * 10 : Math.ceil(amount / 100) * 100;
                  const diff = target - amount;

                  if (diff > 0 && diff >= 1) {
                    return (
                      <div className="flex items-center space-x-3 mt-4 p-4 bg-indigo-500/5 border border-indigo-500/10 sq-md animate-in fade-in duration-500">
                        <Checkbox
                          id="roundUp"
                          name="roundUp"
                          className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({ ...prev, roundUpAmount: checked ? diff : undefined }));
                          }}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor="roundUp"
                            className="text-[10px] font-black uppercase tracking-widest text-slate-100 flex items-center gap-2 cursor-pointer"
                          >
                            <TrendingUp className="w-3 h-3 text-indigo-400" />
                            Reserve {formatCurrency(diff, currency)} to Goals
                          </Label>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                            Round up capital to nearest 100 ({formatCurrency(target, currency)})
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}
            </div>

            {/* Category (for expenses) */}
            {type === 'expense' && (
              <div className="space-y-2">
                <Label htmlFor="transaction-category" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Spending Domain</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="transaction-category" name="category" className="h-12 bg-black border-white/5 sq-md focus:ring-1 focus:ring-white/10 text-slate-200 font-bold">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-white/5 max-h-[300px]">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className="focus:bg-white/5 focus:text-white">
                        <span className="mr-2">{cat.emoji}</span>
                        <span className="font-bold">{cat.value}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Credit Card Specific Logic */}
            {(() => {
              const selectedAccount = accounts.find(a => a.id === formData.accountId);
              if (selectedAccount?.type !== 'credit_card' || type !== 'expense') return null;

              const creditLimit = selectedAccount.creditLimit || 0;
              const safeLimit = (creditLimit * (selectedAccount.safeLimitPercentage || 30)) / 100;
              const currentSpent = Math.abs(selectedAccount.balance);
              const amount = parseFloat(formData.amount || '0');
              const projectedSpent = currentSpent + amount;
              const isBreaching = projectedSpent > safeLimit && creditLimit > 0;

              return (
                <div className="space-y-4 p-4 bg-black border border-white/5 sq-md animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Credit Protocol</Label>
                    {isBreaching && (
                      <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px] font-black uppercase">
                        Limit Breach Risk
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="incomeGenerating"
                      name="isIncomeGenerating"
                      checked={formData.isIncomeGenerating}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isIncomeGenerating: !!checked }))}
                    />
                    <Label htmlFor="incomeGenerating" className="text-xs font-bold text-slate-300 cursor-pointer">
                      This expense generates additional income
                    </Label>
                  </div>

                  {isBreaching && !formData.isIncomeGenerating && (
                    <div className="space-y-3">
                      <Label htmlFor="justification" className="text-[9px] font-black uppercase tracking-widest text-rose-400">Security Justification Required</Label>
                      <Input
                        id="justification"
                        name="justification"
                        placeholder="Why is this credit use essential?"
                        value={formData.justification}
                        onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                        className="bg-white/5 border-rose-500/20 focus:border-rose-500/50 sq-md h-12 text-sm"
                        required={isBreaching}
                        autoComplete="off"
                      />
                      <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed">
                        Strategic credit use is prohibited beyond the safe threshold unless it manifests capital growth.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Debt Type - Segmented Control */}
            {type === 'debt' && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Asset Direction</Label>
                <div className="flex gap-2 p-1.5 bg-black border border-white/5 sq-md">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, debtType: 'lent' })}
                    className={`flex-1 py-3 px-4 sq-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.debtType === 'lent'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                      } `}
                  >
                    I Lent Capital
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, debtType: 'borrowed' })}
                    className={`flex-1 py-3 px-4 sq-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.debtType === 'borrowed'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                      } `}
                  >
                    I Borrowed
                  </button>
                </div>
              </div>
            )}

            {/* Debt Due Date */}
            {type === 'debt' && (
              <div className="space-y-2">
                <Label htmlFor="debt-due-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Repayment Date (Optional)</Label>
                <Input
                  id="debt-due-date"
                  name="debtDueDate"
                  type="date"
                  value={formData.debtDueDate}
                  onChange={(e) => setFormData({ ...formData, debtDueDate: e.target.value })}
                  className="h-12 bg-black border-white/5 sq-md focus:border-white/10 text-slate-200 font-bold"
                />
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="transaction-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Event Timestamp</Label>
              <Input
                id="transaction-date"
                name="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="h-12 bg-black border-white/5 sq-md focus:border-white/10 text-slate-200 font-bold"
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <Label htmlFor="transaction-tags" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Protocol Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="transaction-tags"
                  name="tags"
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="urgent, recurring, etc..."
                  autoComplete="off"
                  className="h-12 bg-black border-white/5 sq-md focus:border-white/10 text-slate-200 font-bold placeholder:text-slate-800"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="ghost"
                  size="sm"
                  className="h-12 px-6 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white sq-md border border-white/5"
                >
                  Index
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-2 bg-black border border-white/5 text-slate-300 font-bold px-3 py-1 sq-sm"
                    >
                      #{tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} aria-label={`Remove tag ${tag}`} className="hover:text-rose-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Recurring */}
            <div className="flex items-center gap-3 p-4 bg-black border border-white/5 sq-md group cursor-pointer" onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}>
              <Checkbox
                id="recurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
                className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
              />
              <Label htmlFor="recurring" className="text-[10px] font-black uppercase tracking-widest text-slate-100 cursor-pointer">
                Cyclical Routine Entry
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="transaction-frequency" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Period</Label>
                  <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger id="transaction-frequency" name="frequency" className="bg-black border-white/5 h-12 sq-md text-slate-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/5">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-end-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Termination</Label>
                  <Input
                    id="transaction-end-date"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="bg-black border-white/5 h-12 sq-md text-slate-200 font-bold"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1 h-14 sq-md text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-100 hover:bg-white/5 border border-white/5"
              >
                Abort
              </Button>
              <Button
                type="submit"
                className={`flex-1 h-14 sq-md text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' :
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' :
                    'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20'
                  }`}
                disabled={accounts.length === 0}
              >
                {initialData ? 'Update Matrix' : 'Record Transaction'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog >
  );
};
