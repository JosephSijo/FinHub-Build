import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { LiabilityTab } from '../../components/LiabilityTab';
import { LiabilityDashboard } from '../../components/LiabilityDashboard';
import { useFinance } from '../../context/FinanceContext';
import { MeshBackground } from '../../components/ui/MeshBackground';
import { CreditCard, Calendar } from 'lucide-react';
import { formatCurrency } from '../../utils/numberFormat';
import { RecurringTransactions } from '../../components/RecurringTransactions';

export function BillsDebtsScreen() {
    const {
        currency,
        liabilities,
        debts,
        recurringTransactions
    } = useFinance();

    const totalEMI = liabilities.reduce((sum, l) => sum + l.emiAmount, 0);
    const totalSub = recurringTransactions
        .filter(r => r.kind === 'subscription')
        .reduce((sum, r) => sum + r.amount, 0);

    return (
        <div className="space-y-6">
            <div className="frosted-plate rounded-[32px] border border-white/5 relative overflow-hidden p-8 shadow-2xl">
                <MeshBackground variant="debt" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                            <CreditCard className="w-7 h-7 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Bills & Debts</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Unified Commitment Stream</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                        <div className="bg-black/40 px-6 py-4 rounded-3xl border border-white/5 text-center">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1 tracking-widest">Monthly EMI</p>
                            <p className="text-xl font-black text-rose-500 tabular-nums">{formatCurrency(totalEMI, currency)}</p>
                        </div>
                        <div className="bg-black/40 px-6 py-4 rounded-3xl border border-white/5 text-center">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1 tracking-widest">Subscriptions</p>
                            <p className="text-xl font-black text-indigo-400 tabular-nums">{formatCurrency(totalSub, currency)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="loans" className="w-full">
                <div className="flex justify-center mb-6">
                    <TabsList className="bg-slate-900/60 p-1 rounded-2xl flex gap-1 border border-white/5 w-full max-w-md">
                        <TabsTrigger value="loans" className="flex-1 rounded-xl text-xs font-bold data-[state=active]:bg-indigo-600">
                            <CreditCard className="w-3.5 h-3.5 mr-2" />
                            Loans
                        </TabsTrigger>
                        <TabsTrigger value="recurring" className="flex-1 rounded-xl text-xs font-bold data-[state=active]:bg-indigo-600">
                            <Calendar className="w-3.5 h-3.5 mr-2" />
                            Recurring
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="loans" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LiabilityDashboard
                        liabilities={liabilities}
                        debts={debts}
                        currency={currency}
                        totalMonthlyIncome={1} // Fallback
                    />
                    <LiabilityTab currency={currency} liabilities={liabilities} debts={debts} />
                </TabsContent>

                <TabsContent value="loans" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <LiabilityDashboard
                        liabilities={liabilities}
                        debts={debts}
                        currency={currency}
                        totalMonthlyIncome={1} // Fallback
                    />
                    <LiabilityTab currency={currency} liabilities={liabilities} debts={debts} />
                </TabsContent>

                <TabsContent value="recurring" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <RecurringTransactions />
                </TabsContent>
            </Tabs>
        </div>
    );
}
