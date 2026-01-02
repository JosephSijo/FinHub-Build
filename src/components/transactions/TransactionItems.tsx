import React from 'react';
import { Card } from '../ui/card';
import { SwipeableItem } from '../ui/SwipeableItem';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, RefreshCw, Users, ChevronRight } from 'lucide-react';
import { Expense, Income, Debt } from '../../types';
import { getCategoryIcon, getIncomeIcon } from './utils';
import { formatCurrency } from '../../utils/numberFormat';

// Shared formatDate helper
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

interface ExpenseItemProps {
    expense: Expense;
    currency: string;
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    isPendingDelete?: boolean;
}

export const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, currency, onEdit, onDelete, isPendingDelete }) => {
    // Check if transaction is goal-related
    const isGoalRelated = (expense.tags && Array.isArray(expense.tags) && expense.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
        (expense.description && expense.description.toLowerCase().includes('goal')) ||
        (expense.description && expense.description.toLowerCase().includes('saving'));

    // Check if emergency fund related
    const isEmergencyRelated = expense.category === 'Healthcare' ||
        (expense.description && expense.description.toLowerCase().includes('insurance')) ||
        (expense.description && expense.description.toLowerCase().includes('medical')) ||
        (expense.description && expense.description.toLowerCase().includes('emergency'));

    return (
        <SwipeableItem
            onDelete={() => onDelete(expense.id)}
            onEdit={() => onEdit(expense)}
            isPendingDelete={isPendingDelete}
        >
            <Card className={`p-5 hover:shadow-md transition-shadow border-none rounded-none bg-transparent ${isGoalRelated ? 'border-l-4 border-l-purple-500' : ''
                } ${isEmergencyRelated ? 'border-l-4 border-l-blue-500' : ''}`}>
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/20 flex items-center justify-center text-[#FF453A] flex-shrink-0">
                        {getCategoryIcon(expense.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="truncate font-bold text-slate-100">{expense.description}</h4>
                            {expense.isRecurring && (
                                <RefreshCw className="w-3 h-3 text-[#0A84FF] flex-shrink-0" />
                            )}
                            {isGoalRelated && (
                                <Badge variant="outline" className="text-[10px] bg-[#BF5AF2]/10 border-[#BF5AF2]/20 text-[#BF5AF2] font-black uppercase">
                                    🎯 Goal
                                </Badge>
                            )}
                            {isEmergencyRelated && (
                                <Badge variant="outline" className="text-[10px] bg-[#0A84FF]/10 border-[#0A84FF]/20 text-[#0A84FF] font-black uppercase">
                                    🛡️ Emergency
                                </Badge>
                            )}
                            {expense.isIncomeGenerating && (
                                <Badge variant="outline" className="text-[10px] bg-[#30D158]/10 border-[#30D158]/20 text-[#30D158] font-black uppercase">
                                    🚀 Strategic
                                </Badge>
                            )}
                        </div>
                        <p className="text-label text-[10px]">
                            {expense.category} • {formatDate(expense.date)}
                        </p>
                        {expense.tags && Array.isArray(expense.tags) && expense.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {expense.tags.map((tag, idx) => (
                                    <Badge key={`${tag}-${idx}`} variant="outline" className="text-[9px] bg-white/5 border-white/5 text-[#8E8E93] font-bold">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-balance text-sm text-[#FF453A] whitespace-nowrap">
                            -{formatCurrency(expense.amount, currency)}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    </div>
                </div>
            </Card>
        </SwipeableItem>
    );
};

interface IncomeItemProps {
    income: Income;
    currency: string;
    onEdit: (income: Income) => void;
    onDelete: (id: string) => void;
    isPendingDelete?: boolean;
}

export const IncomeItem: React.FC<IncomeItemProps> = ({ income, currency, onEdit, onDelete, isPendingDelete }) => {
    // Check if transaction is goal-related
    const isGoalRelated = (income.tags && Array.isArray(income.tags) && income.tags.some((tag: string) => tag?.toLowerCase().includes('goal'))) ||
        (income.source && income.source.toLowerCase().includes('goal')) ||
        (income.source && income.source.toLowerCase().includes('saving'));

    return (
        <SwipeableItem
            onDelete={() => onDelete(income.id)}
            onEdit={() => onEdit(income)}
            isPendingDelete={isPendingDelete}
        >
            <Card className={`p-5 hover:shadow-md transition-shadow border-none rounded-none bg-transparent ${isGoalRelated ? 'border-l-4 border-l-purple-500' : ''
                }`}>
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 flex items-center justify-center text-[#30D158] flex-shrink-0">
                        {getIncomeIcon(income.source)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="truncate font-bold text-slate-100">{income.source}</h4>
                            {income.isRecurring && (
                                <RefreshCw className="w-3 h-3 text-[#0A84FF] flex-shrink-0" />
                            )}
                            {isGoalRelated && (
                                <Badge variant="outline" className="text-[10px] bg-[#BF5AF2]/10 border-[#BF5AF2]/20 text-[#BF5AF2] font-black uppercase">
                                    🎯 Goal
                                </Badge>
                            )}
                        </div>
                        <p className="text-label text-[10px]">
                            Capital Injection • {formatDate(income.date)}
                        </p>
                        {income.tags && Array.isArray(income.tags) && income.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {income.tags.map((tag, idx) => (
                                    <Badge key={`${tag}-${idx}`} variant="outline" className="text-[9px] bg-white/5 border-white/5 text-[#8E8E93] font-bold">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-balance text-sm text-[#30D158] whitespace-nowrap">
                            +{formatCurrency(income.amount, currency)}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    </div>
                </div>
            </Card>
        </SwipeableItem>
    );
};

interface DebtItemProps {
    debt: Debt;
    currency: string;
    onEdit: (debt: Debt) => void;
    onDelete: (id: string) => void;
    onSettle: (id: string) => void;
    isPendingDelete?: boolean;
}

export const DebtItem: React.FC<DebtItemProps> = ({ debt, currency, onEdit, onDelete, onSettle, isPendingDelete }) => {
    return (
        <SwipeableItem
            onDelete={() => onDelete(debt.id)}
            onEdit={() => onEdit(debt)}
            isPendingDelete={isPendingDelete}
        >
            <Card className="p-5 hover:shadow-md transition-shadow border-none rounded-none bg-transparent">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${debt.type === 'lent'
                        ? 'bg-[#0A84FF]/10 border border-[#0A84FF]/20 text-[#0A84FF]'
                        : 'bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-[#FF9F0A]'
                        }`}>
                        <Users className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h4 className="truncate font-bold text-slate-100">{debt.personName}</h4>
                        <p className="text-label text-[10px]">
                            {debt.type === 'lent' ? 'Capital Displaced' : 'Capital Sourced'} • {formatDate(debt.date)}
                        </p>
                        {debt.status === 'settled' && (
                            <Badge variant="outline" className="text-[10px] mt-1 bg-[#30D158]/10 border-[#30D158]/20 text-[#30D158] font-black uppercase">
                                ✓ Settled
                            </Badge>
                        )}
                        {debt.tags && Array.isArray(debt.tags) && debt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {debt.tags.map((tag, idx) => (
                                    <Badge key={`${tag}-${idx}`} variant="outline" className="text-[9px] bg-white/5 border-white/5 text-[#8E8E93] font-bold">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <p className={`text-balance text-sm whitespace-nowrap ${debt.type === 'lent' ? 'text-[#0A84FF]' : 'text-[#FF9F0A]'}`}>
                            {formatCurrency(debt.amount, currency)}
                        </p>
                        <div className="flex items-center gap-1">
                            {debt.status === 'pending' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onSettle(debt.id)}
                                    className="w-8 h-8 p-0 text-[#30D158] hover:bg-[#30D158]/10"
                                    title="Mark as Settled"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        </div>
                    </div>
                </div>
            </Card>
        </SwipeableItem>
    );
};
