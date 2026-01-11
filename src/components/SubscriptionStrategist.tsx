import React, { useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { RecurringTransaction } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { Ghost, Shield, Zap, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface SubscriptionStrategistProps {
    recurring: RecurringTransaction[];
    currency: string;
    totalMonthlyIncome: number;
    onDelete: (id: string, description: string) => void;
}

type SubscriptionCategory = 'Vital' | 'Lifestyle' | 'Ghost';

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
                let category: SubscriptionCategory = 'Lifestyle'; // Default
                const desc = sub.description?.toLowerCase() || '';
                const cat = sub.category?.toLowerCase() || '';

                // Vital keywords
                if (
                    desc.includes('insurance') ||
                    desc.includes('cloud') ||
                    desc.includes('drive') ||
                    desc.includes('icloud') ||
                    desc.includes('adobe') ||
                    cat.includes('insurance') ||
                    cat.includes('emi') // Loans are vital obligations usually
                ) {
                    category = 'Vital';
                }

                // Ghost keywords (Potential duplicates or low value)
                // In a real app, we'd check for true duplicates. Here we flag potential "Ghost" candidates.
                if (
                    desc.includes('trial') ||
                    (desc.includes('premium') && Math.random() > 0.7) // Simulating "random" check for demonstration if strictly strictly regex isn't enough, but let's stick to logic.
                ) {
                    // Refined Ghost Logic: logic for "Ghost" is hard without usage data. 
                    // Let's assume duplicate providers are ghosts for this exercise.
                }

                return { ...sub, strategyCategory: category };
            });
    }, [recurring]);

    // Refined Ghost Detection: Check for duplicates strictly
    const processedList = useMemo(() => {
        const music = ['spotify', 'apple music', 'youtube music', 'amazon music', 'tidal'];
        const video = ['netflix', 'prime video', 'hulu', 'disney', 'hbo', 'hotstar'];

        const musicSubs = analyzedSubscriptions.filter(s => music.some(k => s.description?.toLowerCase().includes(k)));
        const videoSubs = analyzedSubscriptions.filter(s => video.some(k => s.description?.toLowerCase().includes(k)));

        return analyzedSubscriptions.map(sub => {
            let cat = sub.strategyCategory as SubscriptionCategory;
            const desc = sub.description?.toLowerCase() || '';

            // If user has multiple music apps, flag all but the most expensive (or random) as Ghost? 
            // Let's flag the cheaper ones as Ghost candidates if count > 1.
            if (musicSubs.length > 1 && musicSubs.includes(sub)) {
                // Keep the most expensive one as 'Lifestyle', others 'Ghost'
                const mostExpensive = musicSubs.reduce((prev, current) => (prev.amount > current.amount) ? prev : current);
                if (sub.id !== mostExpensive.id) cat = 'Ghost';
            }

            if (videoSubs.length > 2 && videoSubs.includes(sub)) {
                // If more than 2 video subs, flag the cheapest ones as Ghost
                const sorted = [...videoSubs].sort((a, b) => b.amount - a.amount);
                if (sorted.indexOf(sub) >= 2) cat = 'Ghost'; // Keep top 2
            }

            // Explicit trial flagging
            if (desc.includes('trial')) cat = 'Ghost';

            return { ...sub, strategyCategory: cat };
        });
    }, [analyzedSubscriptions]);


    // Calculations
    const totalMonthlyCost = processedList.reduce((sum, s) => {
        // Normalized monthly cost
        let amt = s.amount;
        if (s.frequency === 'yearly') amt = s.amount / 12;
        if (s.frequency === 'weekly') amt = s.amount * 4;
        return sum + amt;
    }, 0);

    // Daily Spending Limit (Proxy: Income / 30)
    const dailySpendingLimit = totalMonthlyIncome > 0 ? totalMonthlyIncome / 30 : 1; // Avoid div/0

    // Freedom Cost: Days of freedom consumed per month
    const totalFreedomDays = totalMonthlyCost / dailySpendingLimit;

    // Growth Swap Calculation
    const ghostSubs = processedList.filter(s => s.strategyCategory === 'Ghost');
    const ghostMonthlyTotal = ghostSubs.reduce((sum, s) => {
        let amt = s.amount;
        if (s.frequency === 'yearly') amt = s.amount / 12;
        if (s.frequency === 'weekly') amt = s.amount * 4;
        return sum + amt;
    }, 0);

    // FV = P * ((1 + r)^n - 1) / r
    // r = 12% annual = 0.01 monthly
    // n = 5 years = 60 months
    const rate = 0.01;
    const n = 60;
    const futureValue = ghostMonthlyTotal * (Math.pow(1 + rate, n) - 1) / rate;


    const getFreedomCost = (amount: number, freq: string) => {
        let monthly = amount;
        if (freq === 'yearly') monthly = amount / 12;
        if (freq === 'weekly') monthly = amount * 4;
        return (monthly / dailySpendingLimit).toFixed(1);
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
            {/* Header Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 bg-slate-900/60 border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Clock className="w-24 h-24" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Active Stack Impact</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-white">{totalFreedomDays.toFixed(1)}</span>
                        <span className="text-lg font-bold text-slate-500 mb-1">Days/Month</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        You work <span className="text-white font-bold">{totalFreedomDays.toFixed(1)} days</span> just to pay for these subscriptions.
                    </p>
                </Card>

                <Card className="p-6 bg-indigo-900/20 border-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="w-24 h-24 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-4">Growth Pivot Potential</h3>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-indigo-300">{formatCurrency(futureValue, currency)}</span>
                        <span className="text-lg font-bold text-indigo-500/60 mb-1">in 5 Years</span>
                    </div>
                    <p className="text-xs text-indigo-400/80">
                        If you cancel "Ghost" items and invest the savings at 12%.
                    </p>
                </Card>
            </div>

            {/* The Kill List & Vital Assets */}
            <div className="space-y-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Ghost className="w-5 h-5 text-rose-400" />
                    Strategist Analysis
                </h3>

                <div className="grid gap-3">
                    {processedList.map((sub) => {
                        const freedomCost = getFreedomCost(sub.amount, sub.frequency);
                        const isGhost = sub.strategyCategory === 'Ghost';
                        const isVital = sub.strategyCategory === 'Vital';

                        return (
                            <Card
                                key={sub.id}
                                className={`p-4 border flex items-center justify-between group transition-all ${isGhost ? 'bg-rose-950/20 border-rose-500/20 hover:bg-rose-900/20' :
                                    isVital ? 'bg-emerald-950/20 border-emerald-500/20' :
                                        'bg-slate-900/40 border-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isGhost ? 'bg-rose-500/10 text-rose-400' :
                                        isVital ? 'bg-emerald-500/10 text-emerald-400' :
                                            'bg-slate-800 text-slate-400'
                                        }`}>
                                        {isGhost ? <AlertTriangle className="w-5 h-5" /> :
                                            isVital ? <Shield className="w-5 h-5" /> :
                                                <Zap className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-200">{sub.description || sub.source}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${isGhost ? 'bg-rose-500 text-black' :
                                                isVital ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-slate-700 text-slate-400'
                                                }`}>
                                                {sub.strategyCategory}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                Costs {freedomCost} freedom days/mo
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold text-slate-200">{formatCurrency(sub.amount, currency)}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">{sub.frequency}</p>
                                    </div>
                                    {isGhost && (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => onDelete(sub.id, sub.description || 'Subscription')}
                                        >
                                            Kill
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
