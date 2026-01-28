
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2,
    ArrowRight,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    ChevronRight,
    TrendingDown,
    X,
    Target
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useFinance } from '../context/FinanceContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { NumberInput } from './ui/number-input';

type Step = 'welcome' | 'account' | 'income' | 'income_check' | 'expense' | 'finish';

interface SetupWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SetupWizard({ isOpen, onClose }: SetupWizardProps) {
    const {
        createAccount,
        createRecurring,
        accounts
    } = useFinance();

    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [formData, setFormData] = useState({
        accountName: '',
        accountType: 'bank' as 'bank' | 'cash' | 'credit_card',
        cachedBalance: '',
        incomeSource: '',
        incomeAmount: '',
        expenseName: '',
        expenseAmount: '',
        expenseCategory: 'Rent'
    });

    const resetAndClose = () => {
        setCurrentStep('welcome');
        onClose();
    };

    const handleCreateAccount = async () => {
        if (!formData.accountName || !formData.cachedBalance) {
            toast.error("Please provide account details");
            return;
        }

        try {
            await createAccount({
                name: formData.accountName,
                type: formData.accountType,
                cachedBalance: parseFloat(formData.cachedBalance),
                color: '#3b82f6',
                icon: formData.accountType === 'bank' ? '🏦' : formData.accountType === 'cash' ? '💵' : '💳'
            });
            setCurrentStep('income');
        } catch {
            toast.error("Failed to create account");
        }
    };

    const handleAddIncome = async (isMultiple: boolean = false) => {
        if (!formData.incomeSource || !formData.incomeAmount) {
            toast.error("Please provide income details");
            return;
        }

        try {
            await createRecurring({
                type: 'income',
                source: formData.incomeSource,
                amount: parseFloat(formData.incomeAmount),
                frequency: 'monthly',
                startDate: new Date().toISOString().split('T')[0],
                accountId: accounts[0]?.id || '', // Use first account if available
                tags: ['onboarding', 'base-income']
            });

            toast.success(`Registered income stream: ${formData.incomeSource}`);

            // Clear income fields
            setFormData(prev => ({ ...prev, incomeSource: '', incomeAmount: '' }));

            if (!isMultiple) {
                setCurrentStep('income_check');
            }
        } catch {
            toast.error("Failed to register income");
        }
    };

    const handleAddExpense = async () => {
        if (!formData.expenseName || !formData.expenseAmount) {
            toast.error("Please provide expense details");
            return;
        }

        try {
            await createRecurring({
                type: 'expense',
                description: formData.expenseName,
                amount: parseFloat(formData.expenseAmount),
                category: formData.expenseCategory,
                frequency: 'monthly',
                startDate: new Date().toISOString().split('T')[0],
                accountId: accounts[0]?.id || '',
                tags: ['onboarding', 'fixed-cost']
            });

            toast.success(`Expense added: ${formData.expenseName}`);
            setCurrentStep('finish');
        } catch {
            toast.error("Failed to register expense");
        }
    };

    const handleFinish = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        resetAndClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={resetAndClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
            >
                <button
                    onClick={resetAndClose}
                    aria-label="Close setup wizard"
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-10">
                    <AnimatePresence mode="wait">
                        {currentStep === 'welcome' && (
                            <motion.div
                                key="welcome"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center space-y-8"
                            >
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-[28px] flex items-center justify-center border border-blue-500/20">
                                        <Sparkles className="w-10 h-10 text-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black text-white tracking-tight">Setup Assistant</h2>
                                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                                        Let's set up your financial basics in 4 quick steps. No complicated navigation required.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setCurrentStep('account')}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-black text-lg shadow-xl shadow-blue-900/40 group"
                                >
                                    Get Started
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </motion.div>
                        )}

                        {currentStep === 'account' && (
                            <motion.div
                                key="account"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                        <Building2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Main Account</h3>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Step 1 of 4: Primary Balance</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {(['bank', 'cash', 'credit_card'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, accountType: type })}
                                            className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${formData.accountType === type
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-white/5 bg-white/5 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="text-2xl">
                                                {type === 'bank' ? '🏦' : type === 'cash' ? '💵' : '💳'}
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-white truncate">{type.replace('_', ' ')}</p>
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Name</Label>
                                        <Input
                                            value={formData.accountName}
                                            onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                            placeholder="e.g. HDFC Checking / Main Wallet"
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Balance</Label>
                                        <NumberInput
                                            value={formData.cachedBalance}
                                            onChange={val => setFormData({ ...formData, cachedBalance: val })}
                                            placeholder="0.00"
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreateAccount}
                                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-black"
                                >
                                    Link Account
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}

                        {currentStep === 'income' && (
                            <motion.div
                                key="income"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Income Setup</h3>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Step 2 of 4: Monthly Inflow</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Income Source</Label>
                                        <Input
                                            value={formData.incomeSource}
                                            onChange={e => setFormData({ ...formData, incomeSource: e.target.value })}
                                            placeholder="e.g. Monthly Salary / Freelance"
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount per Month</Label>
                                        <NumberInput
                                            value={formData.incomeAmount}
                                            onChange={val => setFormData({ ...formData, incomeAmount: val })}
                                            placeholder="0.00"
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-white font-bold text-emerald-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setCurrentStep('income_check')}
                                        className="flex-1 h-14 text-slate-400 border border-white/5 hover:bg-white/5 rounded-2xl font-bold"
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        onClick={() => handleAddIncome()}
                                        className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[20px] font-black shadow-lg shadow-emerald-900/40"
                                    >
                                        Add Income
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'income_check' && (
                            <motion.div
                                key="income_check"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center space-y-8"
                            >
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-indigo-500/10 rounded-[28px] flex items-center justify-center border border-indigo-500/20">
                                        <Target className="w-10 h-10 text-indigo-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-white">Multiple Incomes?</h3>
                                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                                        FinHub works best when all income sources are linked. Do you have other monthly earnings?
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setCurrentStep('expense')}
                                        className="h-16 text-slate-400 border border-white/5 hover:bg-white/5 rounded-2xl font-black"
                                    >
                                        Single Source
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentStep('income')}
                                        className="h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-900/40"
                                    >
                                        Add Another
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'expense' && (
                            <motion.div
                                key="expense"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                                        <TrendingDown className="w-6 h-6 text-rose-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">Monthly Bills</h3>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Step 4 of 4: Regular Expenses</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Main Expense</Label>
                                        <Input
                                            value={formData.expenseName}
                                            onChange={e => setFormData({ ...formData, expenseName: e.target.value })}
                                            placeholder="e.g. Rent, Electricity, Netflix"
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</Label>
                                        <NumberInput
                                            value={formData.expenseAmount}
                                            onChange={val => setFormData({ ...formData, expenseAmount: val })}
                                            placeholder="0.00"
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-white font-bold text-rose-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setCurrentStep('finish')}
                                        className="flex-1 h-14 text-slate-400 border border-white/5 hover:bg-white/5 rounded-2xl font-bold"
                                    >
                                        Skip for Now
                                    </Button>
                                    <Button
                                        onClick={handleAddExpense}
                                        className="flex-1 h-16 bg-rose-600 hover:bg-rose-500 text-white rounded-[20px] font-black shadow-lg shadow-rose-900/40"
                                    >
                                        Add Monthly Bill
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 'finish' && (
                            <motion.div
                                key="finish"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center space-y-8"
                            >
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-emerald-500/10 rounded-[28px] flex items-center justify-center border border-emerald-500/20">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-white">Setup Complete</h3>
                                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                                        Your financial foundation is ready. Safe-to-Spend insights are now active.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleFinish}
                                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[20px] font-black text-lg shadow-xl shadow-emerald-900/40"
                                >
                                    Enter Dashboard
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
