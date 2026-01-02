import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Search, ListFilter, TrendingDown, TrendingUp, Users, Repeat, CreditCard, Shield, Target } from 'lucide-react';

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

            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className="gap-1.5 whitespace-nowrap flex-shrink-0"
                >
                    <ListFilter className="w-4 h-4" />
                    All
                </Button>
                <Button
                    variant={filter === "expenses" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("expenses")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "expenses" ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20" : ""}`}
                >
                    <TrendingDown className="w-4 h-4" />
                    Expenses
                </Button>
                <Button
                    variant={filter === "income" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("income")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "income" ? "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20" : ""}`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Income
                </Button>
                <Button
                    variant={filter === "debts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("debts")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "debts" ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20" : ""}`}
                >
                    <Users className="w-4 h-4" />
                    IOUs
                </Button>
                <Button
                    variant={filter === "subs" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("subs")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "subs" ? "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20" : ""}`}
                >
                    <Repeat className="w-4 h-4" />
                    Subs
                </Button>
                <Button
                    variant={filter === "emis" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("emis")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "emis" ? "border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20" : ""}`}
                >
                    <CreditCard className="w-4 h-4" />
                    EMIs
                </Button>
                <Button
                    variant={filter === "emergency" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("emergency")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "emergency" ? "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20" : ""}`}
                >
                    <Shield className="w-4 h-4" />
                    Emergency
                </Button>
                <Button
                    variant={filter === "goals" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("goals")}
                    className={`gap-1.5 whitespace-nowrap flex-shrink-0 ${filter !== "goals" ? "border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/20" : ""}`}
                >
                    <Target className="w-4 h-4" />
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
