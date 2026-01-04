import React from 'react';
import { Card } from '../ui/card';
import { SwipeableItem } from '../ui/SwipeableItem';
import { Button } from '../ui/button';
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
            <Card className={`p-4 hover:shadow-2xl transition-all border-none rounded-none bg-transparent group relative ${isGoalRelated ? 'border-l-2 border-l-purple-500' : ''
                } ${isEmergencyRelated ? 'border-l-2 border-l-blue-500' : ''}`}>
                <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-cyan-500/[0.04] transition-colors pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-all">
                        {getCategoryIcon(expense.category)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 className="truncate font-bold text-slate-200 text-xs sm:text-sm uppercase tracking-tight">{expense.description}</h4>
                            {expense.isRecurring && (
                                <RefreshCw className="w-3 h-3 text-cyan-400 flex-shrink-0 animate-spin-slow" />
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                            {formatDate(expense.date)} // {expense.category}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-xs sm:text-sm font-black text-rose-500 tabular-nums font-mono">
                            -{formatCurrency(expense.amount, currency)}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0 group-hover:text-cyan-500 transition-colors" />
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
            <Card className={`p-4 hover:shadow-2xl transition-all border-none rounded-none bg-transparent group relative ${isGoalRelated ? 'border-l-2 border-l-purple-500' : ''
                }`}>
                <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-emerald-500/[0.04] transition-colors pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-all">
                        {getIncomeIcon(income.source)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h4 className="truncate font-bold text-slate-200 text-xs sm:text-sm uppercase tracking-tight">{income.source}</h4>
                            {income.isRecurring && (
                                <RefreshCw className="w-3 h-3 text-emerald-400 flex-shrink-0 animate-spin-slow" />
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                            {formatDate(income.date)} // CAPITAL INJECTION
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-xs sm:text-sm font-black text-emerald-400 tabular-nums font-mono">
                            +{formatCurrency(income.amount, currency)}
                        </p>
                        <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0 group-hover:text-emerald-500 transition-colors" />
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
            <Card className="p-4 hover:shadow-2xl transition-all border-none rounded-none bg-transparent group relative">
                <div className="absolute inset-0 bg-white/[0.02] group-hover:bg-amber-500/[0.04] transition-all pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${debt.type === 'lent'
                        ? 'bg-white/5 border border-white/10 text-slate-400 group-hover:border-cyan-500/30 group-hover:text-cyan-400'
                        : 'bg-white/5 border border-white/10 text-slate-400 group-hover:border-amber-500/30 group-hover:text-amber-400'
                        }`}>
                        <Users className="w-5 h-5 transition-transform group-hover:scale-110" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="truncate font-bold text-slate-200 text-xs sm:text-sm uppercase tracking-tight">{debt.personName}</h4>
                            {debt.status === 'settled' && (
                                <div className="p-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                    <Check className="w-2.5 h-2.5" />
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                            {formatDate(debt.date)} // {debt.type === 'lent' ? 'CAPITAL DISPLACED' : 'CAPITAL SOURCED'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className={`text-xs sm:text-sm font-black tabular-nums font-mono ${debt.type === 'lent' ? 'text-cyan-400' : 'text-amber-500'}`}>
                            {formatCurrency(debt.amount, currency)}
                        </p>
                        <div className="flex items-center gap-1">
                            {debt.status === 'pending' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onSettle(debt.id)}
                                    className="w-8 h-8 p-0 text-emerald-400 hover:bg-emerald-400/10 border border-emerald-400/20 rounded-lg"
                                    title="Mark as Settled"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
                        </div>
                    </div>
                </div>
            </Card>
        </SwipeableItem>
    );
};
