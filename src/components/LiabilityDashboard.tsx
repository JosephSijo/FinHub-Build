
import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import {
  TrendingDown,
  AlertTriangle,
  Target,
  Zap,
  ListFilter,
  RefreshCw,
  TrendingUp,
  Snowflake,
  Mountain,
  LayoutGrid,
  Lightbulb,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { MeshBackground } from './ui/MeshBackground';
import { formatCurrency, formatDuration, formatFinancialValue } from '../utils/numberFormat';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Slider } from "./ui/slider";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

interface LiabilityDashboardProps {
  liabilities: any[];
  debts: any[];
  currency: string;
  totalMonthlyIncome: number;
}

export const LiabilityDashboard = React.memo(({ liabilities, debts, currency, totalMonthlyIncome }: LiabilityDashboardProps) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [whatIfInterest, setWhatIfInterest] = useState<number | null>(null);
  const [selectedLiabilityIds, setSelectedLiabilityIds] = useState<string[]>([]);
  const [targetTenure, setTargetTenure] = useState<number>(60); // Default 5 years for consolidation
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize selected IDs on mount/load
  React.useEffect(() => {
    if (liabilities.length > 0 && selectedLiabilityIds.length === 0) {
      // Default: select everything except very large long-term loans (> 10 years or > 10L)
      const defaults = liabilities
        .filter(l => l.interestRate > 10 || l.tenure < 120)
        .map(l => l.id);
      setSelectedLiabilityIds(defaults.length > 0 ? defaults : liabilities.map(l => l.id));
    }
  }, [liabilities, selectedLiabilityIds]);

  const {
    totalOutstanding,
    totalPrincipal,
    totalEMI,
    averageInterestRate,
    payoffProgress,
    monthsToFreedom,
    totalEstimatedInterest,
    highestInterestLoan,
    strategies
  } = useMemo(() => {
    const borrowedDebts = debts.filter(d => d.type === 'borrowed' && d.status === 'pending');

    // Unify liabilities and pending borrowed debts
    const unifiedLiabilities = [
      ...liabilities.map(l => ({ ...l, unifiedType: 'institutional' })),
      ...borrowedDebts.map(d => ({
        id: d.id,
        name: d.personName,
        outstanding: d.amount,
        principal: d.amount, // Assume principal = current amount for IOUs
        interestRate: d.interestRate || 0,
        emiAmount: 0, // IOUs usually don't have monthly EMI in our model yet
        tenure: 0,
        unifiedType: 'personal'
      }))
    ];

    const outstanding = unifiedLiabilities.reduce((sum, l) => sum + l.outstanding, 0);
    const principal = unifiedLiabilities.reduce((sum, l) => sum + l.principal, 0);
    const emi = unifiedLiabilities.reduce((sum, l) => sum + l.emiAmount, 0);
    const weightedInterestSum = unifiedLiabilities.reduce((sum, l) => sum + (l.interestRate * l.outstanding), 0);
    const avgRate = outstanding > 0 ? weightedInterestSum / outstanding : 0;

    // Total Estimated Interest (approximate) - Using Amortization Math for institutional, 1:1 for personal
    const estimatedInterest = unifiedLiabilities.reduce((sum, l) => {
      if (l.unifiedType === 'personal') return sum; // Personal IOUs interest is usually handled differently or zero in this model

      const p = l.outstanding;
      const r = l.interestRate / 12 / 100;
      const emiVal = l.emiAmount;

      if (r === 0 || emiVal <= p * r) return sum;

      const n = Math.log(emiVal / (emiVal - p * r)) / Math.log(1 + r);
      const totalPayment = emiVal * n;
      return sum + Math.max(0, totalPayment - p);
    }, 0);

    // Months to Freedom - Max time among all loans
    const maxMonths = unifiedLiabilities.reduce((max, l) => {
      if (l.unifiedType === 'personal') return max; // IOU maturity isn't modelled in months to freedom usually

      const p = l.outstanding;
      const r = l.interestRate / 12 / 100;
      const emiVal = l.emiAmount;

      if (r === 0) return Math.max(max, emiVal > 0 ? p / emiVal : 0);
      if (emiVal <= p * r) return 360; // Safety cap if EMI doesn't cover interest

      const n = Math.log(emiVal / (emiVal - p * r)) / Math.log(1 + r);
      return Math.max(max, n);
    }, 0);

    const highest = [...unifiedLiabilities].sort((a, b) => b.interestRate - a.interestRate)[0];
    const snowballSorted = [...unifiedLiabilities].sort((a, b) => a.outstanding - b.outstanding);
    const avalancheSorted = [...unifiedLiabilities].sort((a, b) => b.interestRate - a.interestRate);

    const strategyList = [
      {
        id: 'avalanche',
        icon: Mountain,
        title: 'Avalanche Method',
        color: 'blue',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-600',
        description: 'Pay off highest interest rate loans first',
        savings: 'Saves the most money on interest',
        order: avalancheSorted.slice(0, 3),
        recommended: liabilities.length > 1 && liabilities.some(l => l.interestRate > 12),
        reason: 'High interest detected (>12%)'
      },
      {
        id: 'snowball',
        icon: Snowflake,
        title: 'Snowball Method',
        color: 'purple',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-600',
        description: 'Pay off smallest balances first',
        savings: 'Builds momentum with quick wins',
        order: snowballSorted.slice(0, 3),
        recommended: liabilities.filter(l => l.outstanding < 50000).length >= 3,
        reason: 'Significant volume of small-balance debts (>3)'
      },
      {
        id: 'consolidation',
        icon: LayoutGrid,
        title: 'Debt Consolidation',
        color: 'green',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-600',
        description: 'Combine multiple debts into one loan',
        savings: 'Simplifies payments, may lower rate',
        recommended: liabilities.length > 4,
        reason: 'Complex debt structure detected (>4 active streams)',
        consolidationRate: Math.max(6, avgRate - 2) // Potential consolidated rate
      }
    ];

    return {
      totalOutstanding: outstanding,
      totalPrincipal: principal,
      totalEMI: emi,
      averageInterestRate: avgRate,
      payoffProgress: principal > 0 ? Math.max(0, ((principal - outstanding) / principal) * 100) : 0,
      monthsToFreedom: Math.ceil(maxMonths),
      totalEstimatedInterest: estimatedInterest,
      highestInterestLoan: highest,
      strategies: strategyList
    };
  }, [liabilities, debts]);

  const displayInterestRate = whatIfInterest ?? averageInterestRate;

  // What-if calculation
  const { calculatedWhatIfEMI, emiDifference, currentSelectedEMI } = useMemo(() => {
    const includedLiabilities = liabilities.filter(l => selectedLiabilityIds.includes(l.id));
    const currentEMIForSelected = includedLiabilities.reduce((sum, l) => sum + l.emiAmount, 0);

    const whatIfEMI = includedLiabilities.reduce((sum, l) => {
      const p = l.outstanding;
      const r = (whatIfInterest ?? averageInterestRate) / 12 / 100;
      const n = targetTenure; // Use unified target tenure for consolidation simulation

      if (p <= 0 || n <= 0) return sum;

      if (r === 0) return sum + (p / n);
      const newEmiVal = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

      return sum + newEmiVal;
    }, 0);

    return {
      calculatedWhatIfEMI: whatIfEMI,
      emiDifference: currentEMIForSelected - whatIfEMI,
      currentSelectedEMI: currentEMIForSelected
    };
  }, [liabilities, selectedLiabilityIds, whatIfInterest, averageInterestRate, targetTenure]);

  const actionItems = useMemo(() => [
    {
      icon: Zap,
      title: 'Make Extra Payments',
      description: 'Even small extra payments directly reduce principal.',
      impact: 'High',
      color: 'orange',
      suggestion: `Pay ${formatCurrency(Math.round(totalEMI * 0.1), currency)} extra/mo`
    },
    {
      icon: RefreshCw,
      title: 'Refinance Loans',
      description: 'Find lower rates to reduce your monthly interest.',
      impact: 'Medium',
      color: 'blue',
      suggestion: highestInterestLoan
        ? `Target ${highestInterestLoan.name} (${highestInterestLoan.interestRate}%)`
        : 'Monitor efficient rates'
    },
    {
      icon: TrendingUp,
      title: 'Automate Payments',
      description: 'Never miss a due date and avoid all late fees.',
      impact: 'Low',
      color: 'green',
      suggestion: 'Set up auto-pay for peace of mind'
    }
  ], [totalEMI, currency, highestInterestLoan]);

  if (liabilities.length === 0) {
    return (
      <Card className="p-8 text-center bg-gray-50 dark:bg-gray-900 shadow-soft border-dashed border-2 border-gray-200 dark:border-gray-800">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Debt-Free Zone!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have any liabilities recorded. This is a great place to be!
            Track your loans, credit cards, or other debts here once you have them.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mesh-gradient-card card-debt rounded-[32px] overflow-hidden group relative">
        <MeshBackground variant="debt" />
        <div className="frosted-plate p-0 relative z-10">
          {/* Collapsible Header */}
          <div
            className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors relative z-20"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                <TrendingDown className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Debt Overview</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Strategic Debt Stream
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden sm:block text-right">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Total Obligations</p>
                <div className="relative">
                  <p className="text-sm font-black text-rose-500 tabular-nums">
                    {formatCurrency(totalOutstanding, currency)}
                  </p>
                  <div className="absolute inset-0 bg-rose-500/20 blur-lg -z-10 animate-pulse" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0">
                  <Tabs defaultValue="overview" className="w-full">
                    <div className="flex items-center justify-center mb-6">
                      <TabsList className="grid w-full grid-cols-3 max-w-sm bg-slate-800/50 p-1 border border-white/5">
                        <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-slate-700">Overview</TabsTrigger>
                        <TabsTrigger value="strategies" className="text-xs data-[state=active]:bg-slate-700">Strategies</TabsTrigger>
                        <TabsTrigger value="impact" className="text-xs data-[state=active]:bg-slate-700">Impact</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="overview" className="space-y-4 mt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-slate-800/40 border border-white/5 p-3 rounded-2xl">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total Outstanding</p>
                          <p className="text-sm font-bold text-rose-400 mt-0.5 tabular-nums line-clamp-1">
                            {formatFinancialValue(totalOutstanding, currency)}
                          </p>
                        </div>

                        <TooltipProvider>
                          <div className="bg-slate-800/40 border border-white/5 p-3 rounded-2xl">
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Monthly EMI</p>
                              <Tooltip>
                                <TooltipTrigger><Info className="w-3 h-3 text-slate-600" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">Equated Monthly Installment across all loans.</p></TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="text-sm font-bold text-orange-400 mt-0.5 tabular-nums">
                              {formatFinancialValue(totalEMI, currency)}
                            </p>
                          </div>
                        </TooltipProvider>

                        <div className="bg-slate-800/40 border border-white/5 p-3 rounded-2xl">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg. Interest</p>
                          <p className="text-sm font-bold text-amber-400 mt-0.5 tabular-nums">
                            {averageInterestRate.toFixed(1)}%
                          </p>
                        </div>

                        <div className="bg-slate-800/40 border border-white/5 p-3 rounded-2xl">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Debt Freedom</p>
                          <p className="text-sm font-bold text-blue-400 mt-0.5 tabular-nums">
                            {formatDuration(monthsToFreedom)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Tracker Layer */}
                      <div className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-xs font-medium text-slate-300">Overall Payoff Progress</p>
                          <span className="text-sm font-bold text-emerald-400">{payoffProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, payoffProgress)}%` }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <p className="text-[10px] text-slate-500">
                            Paid: {formatCurrency(totalPrincipal - totalOutstanding, currency)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Total: {formatCurrency(totalPrincipal, currency)}
                          </p>
                        </div>
                      </div>

                      {/* Repayment Breakdown Layer */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-4 bg-slate-800/30 border-white/5 rounded-2xl shadow-none">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ListFilter size={14} className="text-indigo-400" />
                            Repayment Breakdown
                          </h4>
                          <div className="space-y-4">
                            <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-500">
                              <span>Principal</span>
                              <span>Interest</span>
                            </div>
                            <div className="w-full h-8 bg-slate-900 rounded-xl overflow-hidden flex p-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {(() => {
                                      const rectProps = {
                                        style: {
                                          '--width': `${(totalOutstanding / (totalOutstanding + totalEstimatedInterest) * 100)}%`
                                        } as React.CSSProperties
                                      };
                                      return (
                                        <div
                                          className="h-full bg-rose-500/80 rounded-l-lg w-[var(--width)]"
                                          {...rectProps}
                                        />
                                      );
                                    })()}
                                  </TooltipTrigger>
                                  <TooltipContent>Principal: {formatCurrency(totalOutstanding, currency)}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    {(() => {
                                      const rectProps = {
                                        style: {
                                          '--width': `${(totalEstimatedInterest / (totalOutstanding + totalEstimatedInterest) * 100)}%`
                                        } as React.CSSProperties
                                      };
                                      return (
                                        <div
                                          className="h-full bg-orange-400/80 rounded-r-lg w-[var(--width)]"
                                          {...rectProps}
                                        />
                                      );
                                    })()}
                                  </TooltipTrigger>
                                  <TooltipContent>Interest: {formatCurrency(totalEstimatedInterest, currency)}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                              <span className="flex items-center gap-1.5 font-medium"><div className="w-2 h-2 rounded-full bg-rose-500" /> Principal</span>
                              <span className="flex items-center gap-1.5 font-medium"><div className="w-2 h-2 rounded-full bg-orange-400" /> Interest</span>
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4 bg-slate-800/30 border-white/5 rounded-2xl shadow-none">
                          <div className="flex gap-3 h-full items-center">
                            <AlertTriangle className="w-10 h-10 text-amber-500/30 flex-shrink-0" />
                            <div>
                              <h4 className="text-sm font-bold text-slate-200">Payment Strategy</h4>
                              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                Your {formatCurrency(totalEMI, currency)} monthly EMI represents {((totalEMI / totalMonthlyIncome) * 100).toFixed(1)}% of your income.
                                Aim to keep this under 40% for financial stability.
                              </p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="strategies" className="space-y-4 mt-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Lightbulb size={14} className="text-amber-400" />
                          Compare Methods
                        </h4>
                        <ToggleGroup
                          type="single"
                          value={selectedStrategy || ""}
                          onValueChange={(val: string) => setSelectedStrategy(val || null)}
                          className="bg-slate-900/50 p-1 border border-white/5 rounded-lg"
                        >
                          <ToggleGroupItem value="avalanche" className="px-3 text-[10px] h-7 data-[state=active]:bg-slate-700">Avalanche</ToggleGroupItem>
                          <ToggleGroupItem value="snowball" className="px-3 text-[10px] h-7 data-[state=active]:bg-slate-700">Snowball</ToggleGroupItem>
                          <ToggleGroupItem value="consolidation" className="px-3 text-[10px] h-7 data-[state=active]:bg-slate-700">Consolidation</ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {!selectedStrategy ? (
                        <div className="py-12 text-center bg-slate-900/20 rounded-2xl border border-dashed border-white/5">
                          <LayoutGrid className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Pick a strategy to visualize the payoff order</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {strategies.filter(s => s.id === selectedStrategy).map((strategy) => {
                            const Icon = strategy.icon;
                            const strategyColor = strategy.id === 'avalanche' ? 'text-blue-400' : strategy.id === 'snowball' ? 'text-purple-400' : 'text-emerald-400';
                            return (
                              <div key={strategy.id} className="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                                <div className="flex items-start gap-4">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 border border-white/5">
                                    <Icon className={`w-5 h-5 ${strategyColor}`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="font-bold text-slate-100">{strategy.title}</h5>
                                      {strategy.recommended && (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold uppercase">Optimal</span>
                                          <span className="text-[9px] text-slate-500 font-medium italic">({(strategy as any).reason})</span>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 mb-4">{strategy.description}</p>

                                    {strategy.order && (
                                      <div className="space-y-2">
                                        {strategy.order.map((l, i) => (
                                          <div key={l.id} className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                                            <div className="w-6 h-6 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-bold text-slate-400 border border-white/5">{i + 1}</div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-medium text-slate-200 truncate">{l.name}</p>
                                              <p className="text-[10px] text-slate-500">{l.interestRate}% Rate</p>
                                            </div>
                                            <p className="text-xs font-bold text-slate-200">{formatCurrency(l.outstanding, currency)}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="impact" className="space-y-4 mt-0">
                      <div className="p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                        <div className="flex items-center gap-2 mb-6">
                          <Zap className="w-4 h-4 text-blue-400" />
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Refinance & Consolidation Impact</h4>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div className="flex flex-col gap-1 px-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-400">Consolidation Interest Rate:</span>
                                  <span className="text-lg font-bold text-blue-400">{displayInterestRate.toFixed(1)}%</span>
                                </div>
                              </div>
                              <Slider
                                value={[displayInterestRate]}
                                min={Math.max(0, averageInterestRate - 5)}
                                max={Math.max(20, averageInterestRate + 5)}
                                step={0.1}
                                onValueChange={(val: number[]) => setWhatIfInterest(val[0])}
                                className="py-4 cursor-pointer"
                              />

                              <div className="flex flex-col gap-1 px-1 pt-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-400">New Loan Tenure:</span>
                                  <span className="text-lg font-bold text-blue-400">{targetTenure} months</span>
                                </div>
                                <p className="text-[10px] text-slate-500">
                                  {targetTenure >= 12 ? `${(targetTenure / 12).toFixed(1)} years` : 'Short term'}
                                </p>
                              </div>
                              <Slider
                                value={[targetTenure]}
                                min={12}
                                max={360}
                                step={12}
                                onValueChange={(val: number[]) => setTargetTenure(val[0])}
                                className="py-4 cursor-pointer"
                              />
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Debts to Consolidate</h5>
                              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                {liabilities.map(l => {
                                  const isSelected = selectedLiabilityIds.includes(l.id);
                                  const isHomeLoan = l.tenure >= 120;
                                  return (
                                    <div
                                      key={l.id}
                                      onClick={() => {
                                        setSelectedLiabilityIds(prev =>
                                          prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id]
                                        );
                                      }}
                                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isSelected
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : 'bg-slate-900/40 border-white/5 opacity-60'
                                        }`}
                                    >
                                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-400' : 'border-slate-600'
                                        }`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                          <p className="text-xs font-bold text-slate-200 truncate">{l.name}</p>
                                          <p className="text-xs text-slate-400">{formatCurrency(l.outstanding, currency)}</p>
                                        </div>
                                        <div className="flex justify-between mt-0.5">
                                          <p className="text-[10px] text-slate-500">{l.interestRate}% • {l.tenure} mo</p>
                                          {isHomeLoan && <span className="text-[9px] text-orange-400/80 font-medium">Long Term</span>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Current EMI (Selection)</p>
                              <p className="text-xl font-bold text-slate-300">{formatCurrency(currentSelectedEMI, currency)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">New Consolidated EMI</p>
                              <p className="text-xl font-bold text-blue-400">{formatCurrency(calculatedWhatIfEMI, currency)}</p>
                            </div>
                          </div>

                          <div className={`p-4 rounded-2xl border flex items-center gap-4 ${emiDifference > 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${emiDifference > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                              {emiDifference > 0 ? <TrendingDown size={20} /> : <AlertTriangle size={20} />}
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                                {emiDifference > 0 ? 'Potential Monthly Savings' : 'Monthly Cost Increase'}
                              </p>
                              <p className={`text-xl font-bold ${emiDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {emiDifference >= 0 ? '+' : ''}{formatCurrency(emiDifference, currency)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {actionItems.map(item => {
                          const Icon = item.icon;
                          return (
                            <div key={item.title} className="p-3 bg-slate-800/20 border border-white/5 rounded-2xl">
                              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center mb-2">
                                <Icon className={`w-4 h-4 text-slate-400`} />
                              </div>
                              <h5 className="text-[11px] font-bold text-slate-200">{item.title}</h5>
                              <p className="text-[10px] text-slate-500 mt-1 leading-tight">{item.suggestion}</p>
                            </div>
                          )
                        })}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
