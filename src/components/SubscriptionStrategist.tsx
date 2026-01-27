import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RecurringTransaction } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { Shield, Zap, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface SubscriptionStrategistProps {
    recurring: RecurringTransaction[];
    currency: string;
    totalMonthlyIncome: number;
    onDelete: (id: string, description: string) => void;
}

type SubscriptionCategory = 'Essential' | 'Personal' | 'Unused' | 'Investment';

export const SubscriptionStrategist: React.FC<SubscriptionStrategistProps> = ({
    recurring,
    currency,
    totalMonthlyIncome,
    onDelete
}) => {

    // 1. Pattern Recognition & Tagging
    const analyzedSubscriptions = useMemo(() => {
        return recurring
            .filter(r => r.type === 'expense') // Only expenses
            .map(sub => {
                let category: SubscriptionCategory = 'Personal'; // Default
                const desc = sub.description?.toLowerCase() || '';
                const cat = sub.category?.toLowerCase() || '';

                // Essential keywords
                if (sub.investmentId) {
                    category = 'Investment';
                } else if (
                    desc.includes('insurance') ||
                    desc.includes('cloud') ||
                    desc.includes('drive') ||
                    desc.includes('icloud') ||
                    desc.includes('adobe') ||
                    cat.includes('insurance') ||
                    cat.includes('emi') // Loans are essential obligations usually
                ) {
                    category = 'Essential';
                }

                return { ...sub, strategyCategory: category };
            });
    }, [recurring]);

    // Refined Unused Detection
    const processedList = useMemo(() => {
        const music = ['spotify', 'apple music', 'youtube music', 'amazon music', 'tidal'];
        const video = ['netflix', 'prime video', 'hulu', 'disney', 'hbo', 'hotstar'];

        const musicSubs = analyzedSubscriptions.filter(s => music.some(k => s.description?.toLowerCase().includes(k)));
        const videoSubs = analyzedSubscriptions.filter(s => video.some(k => s.description?.toLowerCase().includes(k)));

        return analyzedSubscriptions.map(sub => {
            let cat = sub.strategyCategory as SubscriptionCategory;
            const desc = sub.description?.toLowerCase() || '';

            if (musicSubs.length > 1 && musicSubs.includes(sub)) {
                const mostExpensive = musicSubs.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                if (sub.id !== mostExpensive.id) cat = 'Unused';
            }

            if (videoSubs.length > 2 && videoSubs.includes(sub)) {
                const sorted = [...videoSubs].sort((a, b) => b.amount - a.amount);
                if (sorted.indexOf(sub) >= 2) cat = 'Unused';
            }

            if (desc.includes('trial')) cat = 'Unused';

            return { ...sub, strategyCategory: cat };
        });
    }, [analyzedSubscriptions]);


    // Calculations
    const totalMonthlyCost = processedList.reduce((sum, s) => {
        let amt = s.amount;
        if (s.frequency === 'yearly') amt = s.amount / 12;
        if (s.frequency === 'weekly') amt = s.amount * 4;
        if (s.frequency === 'custom' && s.customIntervalDays) amt = s.amount * (30 / s.customIntervalDays);
        return sum + amt;
    }, 0);

    const dailySpendingLimit = totalMonthlyIncome > 0 ? totalMonthlyIncome / 30 : 1;
    const totalBurnDays = totalMonthlyCost / dailySpendingLimit;

    const unusedMonthlyTotal = processedList
        .filter(s => s.strategyCategory === 'Unused')
        .reduce((sum, s) => {
            let amt = s.amount;
            if (s.frequency === 'yearly') amt = s.amount / 12;
            if (s.frequency === 'weekly') amt = s.amount * 4;
            return sum + amt;
        }, 0);

    const rate = 0.01;
    const n = 60;
    const futureValue = unusedMonthlyTotal * (Math.pow(1 + rate, n) - 1) / rate;

    const getBurnDays = (amount: number, freq: string) => {
        let monthly = amount;
        if (freq === 'yearly') monthly = amount / 12;
        if (freq === 'weekly') monthly = amount * 4;
        if (freq === 'custom') monthly = amount * (30 / 28);
        return (monthly / dailySpendingLimit).toFixed(1);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-slate-900/60 border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Subscription Burn</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-rose-400">{totalBurnDays.toFixed(1)}</span>
                        <span className="text-lg font-bold text-slate-500 mb-1">Days/Month</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Work days used each month to pay for these services.
                    </p>
                </Card>

                <Card className="p-6 bg-indigo-900/20 border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-4">Savings Potential</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-indigo-300">{formatCurrency(futureValue, currency)}</span>
                        <span className="text-lg font-bold text-indigo-500/60 mb-1">in 5 Years</span>
                    </div>
                    <p className="text-xs text-indigo-400/80">
                        If you cancel "Unused" items and invest the savings.
                    </p>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    Assistant Analysis
                </h3>

                <div className="grid gap-3">
                    {processedList.map((sub) => {
                        const burnDays = getBurnDays(sub.amount, sub.frequency);
                        const isUnused = sub.strategyCategory === 'Unused';
                        const isEssential = sub.strategyCategory === 'Essential';
                        const isInvestment = sub.strategyCategory === 'Investment';

                        return (
                            <Card
                                key={sub.id}
                                className={`p-4 border flex items-center justify-between group transition-all overflow-hidden relative ${isUnused ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' :
                                    isEssential ? 'bg-emerald-500/5 border-emerald-500/20' :
                                        isInvestment ? 'bg-teal-500/5 border-teal-500/20' :
                                            'bg-slate-800/40 border-slate-700/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isUnused ? 'bg-rose-500/10 text-rose-400' :
                                        isEssential ? 'bg-emerald-500/10 text-emerald-400' :
                                            isInvestment ? 'bg-teal-500/10 text-teal-400' :
                                                'bg-slate-800 text-slate-400'
                                        }`}>
                                        {isUnused ? <AlertTriangle className="w-5 h-5" /> :
                                            isEssential ? <Shield className="w-5 h-5" /> :
                                                isInvestment ? <TrendingUp className="w-5 h-5" /> :
                                                    <Zap className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-200">{sub.description || sub.source}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${isUnused ? 'bg-rose-500 text-black' :
                                                isEssential ? 'bg-emerald-500/20 text-emerald-400' :
                                                    isInvestment ? 'bg-teal-500/20 text-teal-400' :
                                                        'bg-slate-700 text-slate-400'
                                                }`}>
                                                {sub.strategyCategory}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                Cost: {burnDays} work days
                                            </span>
                                            {sub.kind === 'subscription' && (
                                                <span className="text-[10px] text-indigo-400/60 font-black uppercase">
                                                    • ROI Aware
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold text-slate-200">{formatCurrency(sub.amount, currency)}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{sub.frequency}</p>
                                    </div>
                                    {isUnused && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onDelete(sub.id, sub.description || 'Subscription')}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
