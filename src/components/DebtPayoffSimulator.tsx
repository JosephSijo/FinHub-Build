import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Sparkles, Percent } from 'lucide-react';
import { formatCurrency, formatDuration } from '../utils/numberFormat';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { DebtPayoffChart } from './liabilities/DebtPayoffChart';

interface Liability {
    id: string;
    name: string;
    principal: number;
    outstanding: number;
    interestRate: number;
    emiAmount: number;
}

interface DebtPayoffSimulatorProps {
    liabilities: Liability[];
    currency: string;
}

export const DebtPayoffSimulator = React.memo(({ liabilities, currency }: DebtPayoffSimulatorProps) => {
    const [surpriseIncome, setSurpriseIncome] = useState(5000);
    const [monthlyExtra, setMonthlyExtra] = useState(1000);
    const [refinanceReduction, setRefinanceReduction] = useState(0);
    const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

    // Constants
    const MAX_SLIDER = 50000;

    const simulation = useMemo(() => {
        if (!liabilities.length) return null;

        const chartData: any[] = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const startDate = new Date();

        // 1. Calculate Baseline (No extra payment)
        let totalBaselineInterest = 0;
        let maxBaselineMonths = 0;
        const baselineLoans = liabilities.map(l => ({ ...l, balance: l.outstanding }));

        let baselineTotalBalance = baselineLoans.reduce((sum, l) => sum + l.balance, 0);

        // 2. Calculate New Scenario
        const sortedLoans = [...liabilities].sort((a, b) =>
            strategy === 'avalanche' ? b.interestRate - a.interestRate : a.outstanding - b.outstanding
        );

        let remainingSurprise = surpriseIncome;
        const simLoans = sortedLoans.map(l => ({
            ...l,
            balance: l.outstanding,
            months: 0,
            interest: 0,
            rate: Math.max(0, l.interestRate - refinanceReduction)
        }));

        // First apply surprise income
        simLoans.forEach(l => {
            if (remainingSurprise > 0) {
                const deduction = Math.min(l.balance, remainingSurprise);
                l.balance -= deduction;
                remainingSurprise -= deduction;
            }
        });

        let optimizedTotalBalance = simLoans.reduce((sum, l) => sum + l.balance, 0);

        // Add Month 0
        chartData.push({
            month: 0,
            monthName: 'Today',
            currentBalance: baselineTotalBalance,
            optimizedBalance: optimizedTotalBalance
        });

        let currentMonth = 0;
        while ((baselineTotalBalance > 0 || optimizedTotalBalance > 0) && currentMonth < 360) {
            currentMonth++;
            let extraRemainingForThisMonth = monthlyExtra;

            // Baseline Update
            baselineLoans.forEach(l => {
                if (l.balance <= 0) return;
                const r = l.interestRate / 12 / 100;
                const interestPayment = l.balance * r;
                const principalPayment = Math.min(l.balance, l.emiAmount - interestPayment);
                totalBaselineInterest += interestPayment;
                l.balance -= principalPayment;
            });

            // Optimized Update
            simLoans.forEach(l => {
                if (l.balance <= 0) return;
                const r = l.rate / 12 / 100;
                const interestPayment = l.balance * r;
                const standardPrincipal = Math.min(l.balance, l.emiAmount - interestPayment);

                l.interest += interestPayment;
                l.balance -= standardPrincipal;

                if (l.balance > 0 && extraRemainingForThisMonth > 0) {
                    const extraDeduction = Math.min(l.balance, extraRemainingForThisMonth);
                    l.balance -= extraDeduction;
                    extraRemainingForThisMonth -= extraDeduction;
                }

                if (l.balance <= 0 && l.months === 0) {
                    l.months = currentMonth;
                }
            });

            baselineTotalBalance = Math.max(0, baselineLoans.reduce((sum, l) => sum + l.balance, 0));
            optimizedTotalBalance = Math.max(0, simLoans.reduce((sum, l) => sum + l.balance, 0));

            if (baselineTotalBalance > 0) maxBaselineMonths = currentMonth;

            // Sample data every 6 months or if finished
            if (currentMonth % 6 === 0 || (baselineTotalBalance === 0 && optimizedTotalBalance === 0)) {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + currentMonth);
                chartData.push({
                    month: currentMonth,
                    monthName: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
                    currentBalance: Math.round(baselineTotalBalance),
                    optimizedBalance: Math.round(optimizedTotalBalance)
                });
            }
        }

        return {
            baselineMonths: maxBaselineMonths,
            newMonths: Math.max(...simLoans.map(l => l.months)),
            baselineInterest: totalBaselineInterest,
            newInterest: simLoans.reduce((sum, l) => sum + l.interest, 0),
            monthsSaved: maxBaselineMonths - Math.max(...simLoans.map(l => l.months)),
            interestSaved: totalBaselineInterest - simLoans.reduce((sum, l) => sum + l.interest, 0),
            totalDebt: liabilities.reduce((sum, l) => sum + l.outstanding, 0),
            chartData
        };
    }, [liabilities, surpriseIncome, monthlyExtra, strategy, refinanceReduction]);

    if (!liabilities.length || !simulation) return null;

    const baselineDate = new Date();
    baselineDate.setMonth(baselineDate.getMonth() + simulation.baselineMonths);

    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + simulation.newMonths);

    return (
        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900 shadow-sm">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Debt Destroyer Simulator</h3>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                        Compare payoff strategies and test how extra payments accelerate your freedom.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium uppercase tracking-wider">Potential Savings</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(Math.round(simulation.interestSaved), currency)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Controls Area */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="payoff-strategy" className="text-xs font-semibold text-indigo-900 dark:text-indigo-100 uppercase tracking-tighter">Payoff Strategy</Label>
                        <ToggleGroup
                            id="payoff-strategy"
                            type="single"
                            value={strategy}
                            onValueChange={(val) => val && setStrategy(val as 'avalanche' | 'snowball')}
                            className="justify-start gap-2"
                        >
                            <ToggleGroupItem
                                value="avalanche"
                                className="px-3 py-2 text-xs border border-indigo-200 dark:border-indigo-800 data-[state=on]:bg-indigo-600 data-[state=on]:text-white"
                            >
                                Avalanche
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="snowball"
                                className="px-3 py-2 text-xs border border-indigo-200 dark:border-indigo-800 data-[state=on]:bg-indigo-600 data-[state=on]:text-white"
                            >
                                Snowball
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label htmlFor="monthly-extra-slider" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Monthly Extra</Label>
                            <span className="text-sm font-bold text-indigo-600">{formatCurrency(monthlyExtra, currency)}</span>
                        </div>
                        <Slider
                            id="monthly-extra-slider"
                            value={[monthlyExtra]}
                            min={0}
                            max={Math.min(100000, simulation.totalDebt / 10)}
                            step={100}
                            onValueChange={(val: number[]) => setMonthlyExtra(val[0])}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label htmlFor="lump-sum-slider" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Lump Sum</Label>
                            <span className="text-sm font-bold text-indigo-600">{formatCurrency(surpriseIncome, currency)}</span>
                        </div>
                        <Slider
                            id="lump-sum-slider"
                            value={[surpriseIncome]}
                            min={0}
                            max={Math.min(MAX_SLIDER, simulation.totalDebt)}
                            step={500}
                            onValueChange={(val: number[]) => setSurpriseIncome(val[0])}
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-1">
                                <Label htmlFor="refinance-slider" className="text-[11px] font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Refinance Help</Label>
                                <Percent className="w-3 h-3 text-gray-400" />
                            </div>
                            <span className="text-sm font-bold text-blue-600">-{refinanceReduction}% Rate</span>
                        </div>
                        <Slider
                            id="refinance-slider"
                            value={[refinanceReduction]}
                            min={0}
                            max={5}
                            step={0.1}
                            onValueChange={(val: number[]) => setRefinanceReduction(val[0])}
                        />
                    </div>
                </div>

                {/* Visualization Area */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/50 dark:border-gray-800">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Payoff Timeline</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span className="text-[10px] text-gray-500">Normal</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] text-gray-500">Optimized</span>
                                </div>
                            </div>
                        </div>
                        <DebtPayoffChart data={simulation.chartData} currency={currency} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Debt-Free Date</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-base font-bold ${simulation.monthsSaved > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700'}`}>
                                    {newDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </span>
                                {simulation.monthsSaved > 0 && (
                                    <span className="text-[10px] font-bold text-green-600">
                                        (-{formatDuration(simulation.monthsSaved)})
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Interest Savings</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-base font-bold ${simulation.interestSaved > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                    {formatCurrency(Math.round(simulation.interestSaved), currency)}
                                </span>
                                {simulation.interestSaved > 0 && (
                                    <span className="text-[10px] font-bold text-green-600">
                                        Saved!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-center text-gray-400 mt-6 uppercase tracking-widest font-medium">
                *Simulated projections based on continuous monthly contributions and strategy focus.
            </p>
        </Card>
    );
});

