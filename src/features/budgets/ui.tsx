import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { EXPENSE_CATEGORIES } from '../../types';
import { budgetsLogic } from './logic';
import { useShadowWallet } from '../../hooks/useShadowWallet';
import { Progress } from '../../components/ui/progress';
import { cn } from '../../components/ui/utils';

export const BudgetsScreen: React.FC = () => {
    const { expenses, incomes, liabilities, goals, accounts, emergencyFundAmount, currency } = useFinance();

    const { availableToSpend } = useShadowWallet({
        accounts: accounts as any,
        goals,
        liabilities,
        expenses: expenses as any,
        emergencyFundAmount
    });

    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const getStartOfMonth = (monthsAgo: number) => {
            const d = new Date(currentYear, currentMonth - monthsAgo, 1);
            return d;
        };

        const threeMonthsAgo = getStartOfMonth(2);

        // Calculate MI, FO, SR, NSP
        const last3Incomes = incomes.filter(i => new Date(i.date) >= threeMonthsAgo);
        const mi = last3Incomes.reduce((sum, i) => sum + i.amount, 0) / 3;
        const fo = liabilities.reduce((sum, l) => sum + (l.emiAmount || 0), 0);

        const totalSafetyGoal = goals
            .filter(g => g.type === 'stability' || g.type === 'protection' || g.name.toLowerCase().includes('emergency'))
            .reduce((sum, g) => sum + (g.monthly_contribution || 0), 0);
        const sr = totalSafetyGoal > 0 ? totalSafetyGoal : 0.10 * mi;

        const nsp = mi - fo - sr;
        const stressFactor = budgetsLogic.calculateStressFactor(fo, mi);
        const ssr = budgetsLogic.calculateSSR(availableToSpend, mi, fo, sr);

        const last3Expenses = expenses.filter(e => new Date(e.date) >= threeMonthsAgo);
        const avgVarSpend = last3Expenses.reduce((sum, e) => sum + e.amount, 0) / 3;

        const calculatedLimits: Record<string, number> = {};
        EXPENSE_CATEGORIES.forEach(cat => {
            const catExpenses3m = last3Expenses.filter(e => e.category === cat.value);
            const avgSpend_c = catExpenses3m.reduce((sum, e) => sum + e.amount, 0) / 3;
            const habitShare = budgetsLogic.calculateHabitShare(avgSpend_c, avgVarSpend);

            const baseLimit = budgetsLogic.calculateBaseLimit(nsp, habitShare, stressFactor);
            const isDiscretionary = budgetsLogic.isDiscretionary(cat.value);

            calculatedLimits[cat.value] = isDiscretionary
                ? baseLimit * Math.min(Math.max(ssr, 0.60), 1.00)
                : baseLimit;
        });

        return { limits: calculatedLimits };
    }, [expenses, incomes, liabilities, goals, availableToSpend]);

    const { limits } = stats;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency || 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <header className="px-1">
                <h2 className="text-2xl font-black text-white tracking-tight">Financial Guardrails</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Hybrid Budget Engine v1.1</p>
            </header>

            <div className="grid gap-4">
                {EXPENSE_CATEGORIES.map(cat => {
                    const limit = limits[cat.value] || 0;
                    const spent = expenses
                        .filter(e => {
                            const d = new Date(e.date);
                            return e.category === cat.value && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
                        })
                        .reduce((sum, e) => sum + e.amount, 0);
                    const percent = limit > 0 ? (spent / limit) * 100 : 0;

                    return (
                        <div key={cat.value} className="rounded-3xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl" role="img" aria-label={cat.value}>{cat.emoji}</span>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{cat.value}</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Category Limit</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-white">{formatCurrency(limit)}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Monthly</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                    <span className="text-slate-400">Spent: {formatCurrency(spent)}</span>
                                    <span className={cn(
                                        percent > 90 ? 'text-red-400' : 'text-emerald-400'
                                    )}>
                                        {Math.round(percent)}%
                                    </span>
                                </div>
                                <Progress
                                    value={percent}
                                    className="h-1.5"
                                    indicatorClassName={cn(
                                        percent > 100 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                            percent > 80 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                                'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                                    )}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
