import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NumberInput } from './ui/number-input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { X, Loader2, Sparkles } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, Account } from '../types';
import { api } from '../utils/api';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'expense' | 'income' | 'debt';
  onSubmit: (data: any) => void;
  initialData?: any;
  userId: string;
  accounts: Account[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  type,
  onSubmit,
  initialData,
  userId,
  accounts
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
    endDate: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [isCategorizing, setIsCategorizing] = useState(false);
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
        endDate: initialData.endDate || ''
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
    
    if (text.length > 3 && !initialData) {
      const timer = setTimeout(async () => {
        setIsCategorizing(true);
        try {
          const response = await api.categorize(text);
          if (response.success && response.suggestion) {
            setSuggestedCategory(response.suggestion.category);
            setSuggestedTags(response.suggestion.tags || []);
          }
        } catch (error) {
          console.error('Categorization error:', error);
        } finally {
          setIsCategorizing(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
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
      endDate: formData.endDate || undefined
    };

    if (type === 'expense') {
      data = {
        ...data,
        description: formData.description,
        category: formData.category
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
        type: formData.debtType
      };
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
      endDate: ''
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

  const quickAmounts = [100, 500, 1000, 5000];

  // Amount suggestion handlers
  const appendZeros = (count: number) => {
    const currentAmount = formData.amount || '0';
    const newAmount = currentAmount + '0'.repeat(count);
    setFormData({ ...formData, amount: newAmount });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Add'}{' '}
            {type === 'expense' ? 'Money Out' : type === 'income' ? 'Money In' : 'Personal IOU'}
          </DialogTitle>
          <DialogDescription>
            {type === 'debt' ? (
              <span>
                Track money borrowed from or lent to friends/family. 
                <strong className="block mt-1">For institutional loans with EMIs, use the Liability tab.</strong>
              </span>
            ) : (
              <>Fill in the form below to {initialData ? 'edit' : 'add'} your{' '}
              {type === 'expense' ? 'money out' : type === 'income' ? 'money in' : 'personal IOU'}.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selection */}
          {accounts.length > 0 ? (
            <div>
              <Label>Account</Label>
              <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.icon}</span>
                        <span>{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-900 dark:text-yellow-100">
              ⚠️ Please add an account first before creating transactions
            </div>
          )}

          {/* Description/Source/Person */}
          <div>
            <Label>
              {type === 'expense' ? 'Description' : type === 'income' ? 'Source' : 'Person Name'}
            </Label>
            <Input
              value={type === 'debt' ? formData.personName : formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [type === 'debt' ? 'personName' : 'description']: e.target.value
                })
              }
              placeholder={
                type === 'expense'
                  ? 'e.g., Coffee at Starbucks'
                  : type === 'income'
                  ? 'e.g., Monthly Salary'
                  : 'e.g., John Doe'
              }
              required
            />
            
            {/* AI Suggestion */}
            {(suggestedCategory || isCategorizing) && (
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-start gap-2">
                {isCategorizing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      AI is analyzing...
                    </p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        {type === 'expense' && `Suggested: `}
                        {type === 'expense' && suggestedCategory && <strong>{suggestedCategory}</strong>}
                        {type === 'income' && `Suggested source detected`}
                        {type === 'debt' && `Transaction analyzed`}
                        {suggestedTags.length > 0 && (
                          <> {type === 'expense' ? 'with' : 'Suggested'} tags: {suggestedTags.join(', ')}</>
                        )}
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={applySuggestion}
                        className="mt-2"
                      >
                        Apply {type === 'expense' ? 'Suggestion' : 'Tags'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <Label>Amount</Label>
            <div className="flex gap-2">
              <NumberInput
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                step="any"
                min="0"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendZeros(2)}
                className="px-3"
                title="Add 00"
              >
                +00
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendZeros(3)}
                className="px-3"
                title="Add 000"
              >
                +000
              </Button>
            </div>
            <div className="flex gap-2 mt-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Category (for expenses) */}
          {type === 'expense' && (
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Debt Type - Segmented Control */}
          {type === 'debt' && (
            <div>
              <Label>Transaction Type</Label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, debtType: 'lent' })}
                  className={`flex-1 py-2 px-4 rounded-md transition-all ${
                    formData.debtType === 'lent'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  ✅ I Lent
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, debtType: 'borrowed' })}
                  className={`flex-1 py-2 px-4 rounded-md transition-all ${
                    formData.debtType === 'borrowed'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  ⚠️ I Borrowed
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {formData.debtType === 'lent' 
                  ? '💚 You gave money to someone' 
                  : '💔 You received money from someone'}
              </p>
            </div>
          )}

          {/* Date */}
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => handleTagInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tags (use comma to add multiple)..."
              />
              <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              ��� Tip: Use commas to add multiple tags at once (e.g., "urgent, important")
            </p>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="w-4 h-4"
            />
            <Label htmlFor="recurring" className="cursor-pointer">
              Recurring transaction
            </Label>
          </div>

          {formData.isRecurring && (
            <>
              <div>
                <Label>Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>End Date (optional)</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={accounts.length === 0}>
              {initialData ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};