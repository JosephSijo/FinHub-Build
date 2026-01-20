import React from 'react';
import { useFinance } from "../../context/FinanceContext";
import { TransactionOverview } from "../transactions/TransactionOverview";
import { isFeatureEnabled, getFeatureComponent } from "../../features/registry";

export const Dashboard = () => {
    const {
        expenses,
        incomes,
        debts,
        accounts,
        currency
    } = useFinance();

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTransactions = {
        expenses: expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }),
        incomes: incomes.filter(i => {
            const d = new Date(i.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
    };

    const recentTransactions = [
        ...expenses,
        ...incomes,
        ...debts
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const totalLiquidity = accounts.reduce((sum, acc) => sum + (acc.type !== 'credit_card' ? acc.balance : 0), 0);

    return (
        <div className="min-h-screen bg-transparent p-4">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">Insights Active</p>
                </div>
            </header>

            <div className="space-y-6">
                {isFeatureEnabled('BALANCE_BOARD') && (
                    <div className="h-full">
                        {React.createElement(getFeatureComponent('BALANCE_BOARD') as React.ComponentType)}
                    </div>
                )}

                <TransactionOverview
                    currentMonthTransactions={currentMonthTransactions}
                    recentTransactions={recentTransactions}
                    totalLiquidity={totalLiquidity}
                    currency={currency}
                />
            </div>
        </div>
    );
};
