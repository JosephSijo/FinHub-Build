import React, { useState } from 'react';
import { AdvancedInsights } from './dashboard/AdvancedInsights'; // Reusing the existing component logic
import { Expense, Income, Account, Liability, Goal, Debt } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

export interface AnalyticsViewProps {
    expenses: Expense[];
    incomes: Income[];
    currency: string;
    accounts: Account[];
    liabilities: Liability[];
    goals: Goal[];
    debts: Debt[];
    savingsRate: number;
    dtiRatio: number;
    outflowRatio: number;
    healthScore: number;
    onBack: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
    expenses,
    incomes,
    currency,
    accounts,
    liabilities,
    goals,
    debts,
    savingsRate,
    dtiRatio,
    outflowRatio,
    healthScore,
    onBack
}) => {

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 sm:px-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white/10">
                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Deep Analytics</h1>
                    <p className="text-sm text-slate-400 font-medium">Detailed breakdown of your financial engine.</p>
                </div>
            </div>

            {/* Content - Reusing the complex charts component */}
            <AdvancedInsights
                expenses={expenses}
                incomes={incomes}
                currency={currency}
                accounts={accounts}
                goals={goals}
                liabilities={liabilities}
                debts={debts}
                savingsRate={savingsRate}
                dtiRatio={dtiRatio}
                outflowRatio={outflowRatio}
                healthScore={healthScore}
            />
        </div>
    );
};
