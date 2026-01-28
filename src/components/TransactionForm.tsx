import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { X, Sparkles, TrendingUp, Users, Landmark } from 'lucide-react';
import { EXPENSE_CATEGORIES, Account, Liability } from '../types';
import { isTransfer } from '../utils/isTransfer';
import { Checkbox } from './ui/checkbox';
import { autoCategorize } from '../utils/autoCategorize';
import { formatCurrency } from '../utils/numberFormat';
import { calculateLoanDetails, calculateInvestmentDetails } from '../utils/financeCalculations';
import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';
import { COPY } from '../content';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'expense' | 'income' | 'debt';
  onSubmit: (data: any) => void;
  initialData?: any;
  accounts: Account[];
  liabilities: Liability[];
  currency: string;
  roundUpEnabled?: boolean;
  defaultAccountId?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  type,
  onSubmit,
  initialData,
  accounts,
  liabilities,
  currency,
  roundUpEnabled = true,
  defaultAccountId
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
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    endDate: '',
    isIncomeGenerating: false,
    justification: '',
    debtDueDate: '',
    principal: '',
    interestRate: '',
    tenure: '',
    tenureUnit: 'months' as 'months' | 'years',
    liabilityId: '',
    investmentId: '',
    registerAsLiability: false,
    liabilityType: 'personal_loan' as Liability['type'],
  });

  const [tagInput, setTagInput] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [suggestedAmount, setSuggestedAmount] = useState<number | undefined>(undefined);
  const [suggestedDescription, setSuggestedDescription] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      queueMicrotask(() => {
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
          debtDueDate: initialData.dueDate || '',
          principal: initialData.principal?.toString() || '',
          interestRate: initialData.interestRate?.toString() || '',
          tenure: initialData.tenure?.toString() || '',
          tenureUnit: initialData.tenureUnit || 'months',
          liabilityId: initialData.liabilityId || '',
          investmentId: initialData.investmentId || '',
          registerAsLiability: initialData.registerAsLiability || false,
          liabilityType: initialData.type || 'personal_loan',
        });
      });
    } else if (accounts.length > 0 && !formData.accountId) {
      queueMicrotask(() => {
        const initialAccountId = (type === 'expense' && defaultAccountId)
          ? defaultAccountId
          : accounts[0].id;
        setFormData(prev => ({ ...prev, accountId: initialAccountId }));
      });
    }
  }, [isOpen, initialData, accounts, formData.accountId, defaultAccountId, type]);

  useEffect(() => {
    const text = type === 'expense' ? formData.description :
      type === 'income' ? formData.description :
        formData.personName;

    const suggestion = (text.length > 2 && !initialData) ? autoCategorize(text) : null;

    if (text.length > 2 && !initialData) {
      const matchedLiability = liabilities.find(l =>
        l.name.toLowerCase() === text.toLowerCase() ||
        text.toLowerCase() === `emi: ${l.name.toLowerCase()}` ||
        text.toLowerCase().includes(l.name.toLowerCase())
      );

      if (matchedLiability) {
        queueMicrotask(() => {
          setSuggestedCategory('EMI');
          setSuggestedTags(['emi', 'liability', matchedLiability.name.toLowerCase()]);
          setSuggestedAmount(matchedLiability.emiAmount);
          setSuggestedDescription(`EMI: ${matchedLiability.name}`);
        });

        const lStart = new Date(matchedLiability.startDate);
        const currentMonth = new Date();
        currentMonth.setDate(lStart.getDate());
        const suggestedDateStr = currentMonth.toISOString().split('T')[0];
        queueMicrotask(() => {
          setFormData(prev => ({ ...prev, suggestedDate: suggestedDateStr, liabilityId: matchedLiability.id } as any));
        });
      }
    }

    if (suggestion) {
      queueMicrotask(() => {
        setSuggestedCategory(suggestion.category);
        setSuggestedTags(suggestion.tags);
        setSuggestedAmount(suggestion.suggestedAmount);
        setSuggestedDescription(suggestion.suggestedDescription);
      });
    } else if (!text.length || initialData) {
      queueMicrotask(() => {
        setSuggestedCategory(null);
        setSuggestedTags([]);
        setSuggestedAmount(undefined);
        setSuggestedDescription(undefined);
      });
    }
  }, [formData.description, formData.personName, type, initialData, liabilities]);

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
      customIntervalDays: (formData as any).customIntervalDays, // Pass custom interval
      startDate: formData.date, // For recurring transactions
      endDate: formData.endDate || undefined,
      isIncomeGenerating: formData.isIncomeGenerating,
      justification: formData.justification,
      liabilityId: formData.liabilityId === 'new' ? undefined : (formData.liabilityId || undefined),
      investmentId: formData.investmentId,
      registerAsLiability: formData.registerAsLiability,
      principal: formData.principal ? parseFloat(formData.principal) : undefined,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      tenure: formData.tenure ? parseInt(formData.tenure) : undefined,
      tenureUnit: formData.tenureUnit,
      liabilityType: formData.liabilityType
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
      debtDueDate: '',
      principal: '',
      interestRate: '',
      tenure: '',
      tenureUnit: 'months',
      liabilityId: '',
      investmentId: '',
      registerAsLiability: false,
      liabilityType: 'personal_loan',
    });
    setTagInput('');
    setSuggestedCategory(null);
    setSuggestedTags([]);
    setSuggestedAmount(undefined);
    setSuggestedDescription(undefined);
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
      setFormData(prev => ({
        ...prev,
        category: suggestedCategory,
        tags: [...new Set([...prev.tags, ...suggestedTags])],
        amount: (suggestedAmount && !prev.amount) ? suggestedAmount.toString() : prev.amount,
        description: suggestedDescription || prev.description,
        // Auto-enable recurring for Subscription suggestions
        isRecurring: (suggestedCategory === 'Subscription') ? true : prev.isRecurring,
        frequency: (suggestedCategory === 'Subscription') ? 'monthly' : prev.frequency
      }));
      setSuggestedCategory(null);
      setSuggestedTags([]);
      setSuggestedAmount(undefined);
      setSuggestedDescription(undefined);
    }
  };

  const handlePickContact = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const permission = await Contacts.requestPermissions();
        if (permission.contacts !== 'granted') {
          alert('Contacts permission is required to select a contact.');
          return;
        }

        const result = await Contacts.pickContact({
          projection: {
            name: true,
            phones: true
          }
        });
        if (result && result.contact) {
          const contact = result.contact;
          const contactName = contact.name?.display ||
            (contact.name?.given ? `${contact.name.given} ${contact.name.family || ''}` : '') ||
            contact.phones?.[0]?.number ||
            'Unknown Contact';

          setFormData(prev => ({ ...prev, personName: contactName.trim() }));
          if (window.navigator.vibrate) window.navigator.vibrate(20);
        }
      } catch (err) {
        console.error('Capacitor contact picker error:', err);
        alert('Failed to pick contact. Please try again or type manually.');
      }
    } else if ('contacts' in navigator && 'ContactsManager' in window) {
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
        console.error('Web contact picker error:', err);
      }
    } else {
      alert('Contact Selection is only available on supported mobile browsers or the native app.');
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
              {initialData ? COPY.common.actions.update : COPY.common.actions.add}{' '}
              {type === 'expense' ? COPY.transactions.expenseLabel : type === 'income' ? COPY.transactions.incomeLabel : COPY.transactions.debtLabel}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
              {type === 'debt' ? (
                "Manage personal debts and loans"
              ) : (
                `Recording ${type === 'expense' ? 'an expense' : 'an income'}`
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Selection */}
            {accounts.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="transaction-account" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{COPY.transactions.account}</Label>
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
                            {formatCurrency(account.cachedBalance, currency)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 sq-md text-[10px] font-black uppercase tracking-widest text-amber-400">
                ⚠️ {COPY.transactions.noAccounts}
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
                    <div className="text-xs text-slate-400 mt-1 font-bold">
                      {type === 'expense' && (
                        <div className="flex flex-col gap-1">
                          <div>Category: <span className="text-slate-100 uppercase">{suggestedCategory}</span></div>
                          {suggestedAmount && (
                            <div>Detected Amount: <span className="text-emerald-400">{formatCurrency(suggestedAmount, currency)}</span></div>
                          )}
                        </div>
                      )}
                      {suggestedTags.length > 0 && (
                        <div className="mt-1">Tags: <span className="text-slate-100">{suggestedTags.join(', ')}</span></div>
                      )}
                    </div>
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
              <Label htmlFor="transaction-amount" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{COPY.common.amount}</Label>
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
                <Label htmlFor="transaction-category" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{COPY.transactions.category}</Label>
                <Select value={formData.category} onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    category: value,
                    // Auto-enable recurring for manual Subscription selection
                    isRecurring: (value === 'Subscription') ? true : prev.isRecurring,
                    frequency: (value === 'Subscription') ? 'monthly' : prev.frequency
                  }));
                }}>
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

            {/* Liability Linking (for EMIs) */}
            {type === 'expense' && formData.category === 'EMI' && (
              <div className="space-y-4 p-4 bg-rose-500/5 border border-rose-500/10 sq-md animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-rose-400">Liability Link</Label>
                  <Landmark className="w-4 h-4 text-rose-400" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transaction-liability" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Liability</Label>
                  <Select
                    value={formData.liabilityId}
                    onValueChange={(val) => setFormData(prev => ({
                      ...prev,
                      liabilityId: val,
                      registerAsLiability: val === 'new'
                    }))}
                  >
                    <SelectTrigger id="transaction-liability" name="liabilityId" className="h-10 bg-black border-white/5 sq-md text-slate-200 font-bold text-xs">
                      <SelectValue placeholder="Select or Create Liability" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/5">
                      <SelectItem value="none" className="font-bold">No formal link</SelectItem>
                      <SelectItem value="new" className="text-emerald-400 font-black italic">+ Register as New Loan</SelectItem>
                      {liabilities.map(l => (
                        <SelectItem key={l.id} value={l.id} className="font-bold">
                          {l.name} (₹{l.outstanding.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.liabilityId === 'new' && (
                  <div className="space-y-4 animate-in zoom-in-95 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="transaction-liability-type" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Loan Category</Label>
                      <Select
                        value={formData.liabilityType}
                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, liabilityType: val }))}
                      >
                        <SelectTrigger id="transaction-liability-type" className="h-10 bg-black border-white/5 sq-md text-slate-200 font-bold text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/5">
                          <SelectItem value="home_loan">🏠 Home Loan</SelectItem>
                          <SelectItem value="car_loan">🚗 Car Loan</SelectItem>
                          <SelectItem value="personal_loan">💳 Personal Loan</SelectItem>
                          <SelectItem value="education_loan">🎓 Education Loan</SelectItem>
                          <SelectItem value="other">📋 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                      <p className="text-[9px] font-black text-emerald-400 uppercase leading-relaxed">
                        This will create a new formal liability in your "Bills" tab.
                      </p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase leading-relaxed">
                        Ensure principal and interest are set in the Matrix below.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Credit Card Specific Logic */}
            {(() => {
              const selectedAccount = accounts.find(a => a.id === formData.accountId);
              if (selectedAccount?.type !== 'credit_card' || type !== 'expense') return null;

              const creditLimit = selectedAccount.creditLimit || 0;
              const safeLimit = (creditLimit * (selectedAccount.safeLimitPercentage || 30)) / 100;
              const currentSpent = Math.abs(selectedAccount.cachedBalance);
              const amount = parseFloat(formData.amount || '0');
              const projectedSpent = currentSpent + amount;
              const isBreaching = projectedSpent > safeLimit && creditLimit > 0;

              return (
                <div className="space-y-4 p-4 bg-black border border-white/5 sq-md animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Credit Card</Label>
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
                      <Label htmlFor="justification" className="text-[9px] font-black uppercase tracking-widest text-rose-400">{COPY.transactions.justificationRequired}</Label>
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
                        Strategic credit use is prohibited beyond the safe threshold unless it manifests fund growth.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Debt Type - Segmented Control */}
            {type === 'debt' && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Transaction Type</Label>
                <div className="flex gap-2 p-1.5 bg-black border border-white/5 sq-md">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, debtType: 'lent' })}
                    className={`flex-1 py-3 px-4 sq-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.debtType === 'lent'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                      } `}
                  >
                    {COPY.transactions.lentMoney}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, debtType: 'borrowed' })}
                    className={`flex-1 py-3 px-4 sq-md text-[10px] font-black uppercase tracking-widest transition-all ${formData.debtType === 'borrowed'
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                      } `}
                  >
                    {COPY.transactions.borrowedMoney}
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
              <Label htmlFor="transaction-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{COPY.common.date}</Label>
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
              <Label htmlFor="transaction-tags" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{COPY.common.tags}</Label>
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
            <div className="flex items-center gap-3 p-4 bg-black border border-white/5 sq-md group">
              <Checkbox
                id="recurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: !!checked })}
                className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
              />
              <Label htmlFor="recurring" className="text-[10px] font-black uppercase tracking-widest text-slate-100 cursor-pointer">
                {COPY.transactions.recurringDescription}
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-6 mt-4 p-4 bg-slate-900/40 border border-white/5 sq-md animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{COPY.transactions.loanInvestmentDetails}</Label>
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">{COPY.transactions.principalCapital}</Label>
                    <NumberInput
                      value={formData.principal}
                      onChange={(val) => setFormData({ ...formData, principal: val })}
                      placeholder="e.g. 100000"
                      className="bg-black border-white/5 h-11 sq-md text-slate-300 font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Rate (% p.a)</Label>
                    <NumberInput
                      value={formData.interestRate}
                      onChange={(val) => setFormData({ ...formData, interestRate: val })}
                      placeholder="e.g. 12"
                      className="bg-black border-white/5 h-11 sq-md text-slate-300 font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Tenure</Label>
                    <NumberInput
                      value={formData.tenure}
                      onChange={(val) => setFormData({ ...formData, tenure: val })}
                      placeholder="e.g. 12"
                      className="bg-black border-white/5 h-11 sq-md text-slate-300 font-bold text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-600 ml-1">Unit</Label>
                    <Select value={formData.tenureUnit} onValueChange={(val: any) => setFormData({ ...formData, tenureUnit: val })}>
                      <SelectTrigger className="bg-black border-white/5 h-11 sq-md text-slate-300 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/5">
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(() => {
                  const p = parseFloat(formData.principal);
                  const r = parseFloat(formData.interestRate);
                  let t = parseInt(formData.tenure);
                  if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0) return null;

                  if (formData.tenureUnit === 'years') t *= 12;

                  if (type === 'expense') {
                    const details = calculateLoanDetails(p, r, t);
                    return (
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Calculated EMI</span>
                          <span className="text-sm font-black text-rose-400">{formatCurrency(details.emi, currency)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Extra Interest</span>
                          <span className="text-xs font-bold text-slate-400">{formatCurrency(details.totalInterest, currency)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const startDate = new Date(formData.date);
                            const tVal = t; // t is already in months from line 791
                            startDate.setMonth(startDate.getMonth() + tVal);
                            const calculatedEndDate = startDate.toISOString().split('T')[0];

                            setFormData({
                              ...formData,
                              amount: details.emi.toString(),
                              endDate: calculatedEndDate
                            });
                          }}
                          className="w-full h-9 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[10px] font-black uppercase tracking-widest sq-md"
                        >
                          Sync EMI to Transaction
                        </Button>
                      </div>
                    );
                  } else if (type === 'income') {
                    const details = calculateInvestmentDetails(p, r, t);
                    return (
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly Yield</span>
                          <span className="text-sm font-black text-emerald-400">{formatCurrency(details.monthlyYield, currency)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Capital Gains</span>
                          <span className="text-xs font-bold text-slate-400">{formatCurrency(details.totalReturns, currency)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            const startDate = new Date(formData.date);
                            const tVal = t; // t is already in months from line 791
                            startDate.setMonth(startDate.getMonth() + tVal);
                            const calculatedEndDate = startDate.toISOString().split('T')[0];

                            setFormData({
                              ...formData,
                              amount: details.monthlyYield.toString(),
                              endDate: calculatedEndDate
                            });
                          }}
                          className="w-full h-9 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-[10px] font-black uppercase tracking-widest sq-md"
                        >
                          Sync Yield to Transaction
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
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
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.frequency === 'custom' ? (
                    <div className="space-y-2">
                      <Label htmlFor="transaction-interval" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Days Interval</Label>
                      <NumberInput
                        id="transaction-interval"
                        name="customIntervalDays"
                        value={(formData as any).customIntervalDays || ''}
                        onChange={(value) => setFormData({ ...formData, customIntervalDays: parseInt(value) } as any)}
                        placeholder="e.g. 45"
                        min="1"
                        className="bg-black border-white/5 h-12 sq-md text-slate-200 font-bold"
                      />
                    </div>
                  ) : (
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
                  )}
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
                {COPY.common.actions.abort}
              </Button>
              <Button
                type="submit"
                className={`flex-1 h-14 sq-md text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all ${type === 'expense' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' :
                  type === 'income' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' :
                    'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/20'
                  }`}
                disabled={accounts.length === 0}
              >
                {initialData ? COPY.common.actions.update : COPY.common.actions.record}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent >
    </Dialog >
  );
};
