import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Search, ListFilter, TrendingDown, TrendingUp, Users, Repeat, CreditCard, Shield, Target } from 'lucide-react';
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filter: 'all' | 'expenses' | 'income' | 'debts' | 'subs' | 'emis' | 'emergency' | 'goals';
    setFilter: (filter: 'all' | 'expenses' | 'income' | 'debts' | 'subs' | 'emis' | 'emergency' | 'goals') => void;
}

export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
    searchTerm,
    setSearchTerm,
    filter,
    setFilter
}) => {
    return (
        <div className="space-y-4">
            {/* Search */}
            <Card className="p-4 bg-white/5 border-white/5 rounded-[24px]">
                <div className="relative group">
                    <Label htmlFor="transaction-search" className="sr-only">Search transactions</Label>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <Input
                        id="transaction-search"
                        name="search"
                        placeholder="Search transactions, tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 bg-white/5 border-white/5 focus:border-indigo-500/50 rounded-2xl h-12 text-white placeholder:text-slate-600 transition-all font-bold"
                        autoComplete="off"
                    />
                </div>
            </Card>

            <div className="flex gap-2.5 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
                <Button
                    variant="ghost"
                    onClick={() => setFilter("all")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "all"
                            ? "bg-slate-100 text-slate-900 border-none shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                >
                    <ListFilter className="w-3.5 h-3.5" />
                    All
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("expenses")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "expenses"
                            ? "bg-rose-500 text-white border-none shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                    )}
                >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Expenses
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("income")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "income"
                            ? "bg-emerald-500 text-white border-none shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                    )}
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Income
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("debts")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "debts"
                            ? "bg-amber-500 text-white border-none shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                    )}
                >
                    <Users className="w-3.5 h-3.5" />
                    IOUs
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("subs")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "subs"
                            ? "bg-purple-500 text-white border-none shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                    )}
                >
                    <Repeat className="w-3.5 h-3.5" />
                    Subs
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("emis")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "emis"
                            ? "bg-sky-500 text-white border-none shadow-[0_0_20px_rgba(14,165,233,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                    )}
                >
                    <CreditCard className="w-3.5 h-3.5" />
                    EMIs
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("emergency")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "emergency"
                            ? "bg-blue-600 text-white border-none shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-600/10"
                    )}
                >
                    <Shield className="w-3.5 h-3.5" />
                    Emergency
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setFilter("goals")}
                    className={cn(
                        "gap-2 px-5 h-11 rounded-xl transition-all font-bold uppercase text-[10px] tracking-widest border border-white/5",
                        filter === "goals"
                            ? "bg-[#BF5AF2] text-white border-none shadow-[0_0_20px_rgba(191,90,242,0.3)]"
                            : "bg-white/5 text-slate-400 hover:text-[#BF5AF2] hover:bg-[#BF5AF2]/10"
                    )}
                >
                    <Target className="w-3.5 h-3.5" />
                    Goals
                </Button>
            </div>

            {/* Info Banner for EMI Filter */}
            {filter === "emis" && (
                <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <div className="flex gap-3">
                        <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-orange-900 dark:text-orange-100">EMI Payments</h4>
                            <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                                These are loan EMI payment transactions. Manage your loans in the <strong>Liability tab</strong>.
                            </p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
