import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle2, ChevronRight, AlertTriangle, Flame, Plus, Trash2, Sparkles, Zap } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface LiabilityInput {
    name: string;
    amount: string;
    interest: string;
}

export const OnboardingFlow: React.FC = () => {
    const { settings, updateSettings, createGoal, createLiability } = useFinance();
    const [phase, setPhase] = useState<1 | 2 | 3>(1);
    const [step, setStep] = useState<'intro' | 'question' | 'completion'>('intro');
    const [isProcessing, setIsProcessing] = useState(false);

    // Phase 2 State
    const [liabilities, setLiabilities] = useState<LiabilityInput[]>([]);
    const [currentLiability, setCurrentLiability] = useState<LiabilityInput>({ name: '', amount: '', interest: '' });

    // Phase 3 State
    const [passiveTarget, setPassiveTarget] = useState<string>(settings.passiveIncomeTarget?.toString() || '');

    const toggleSampleMode = async (enabled: boolean) => {
        await updateSettings({ isSampleMode: enabled });
    };

    const handlePhase1Answer = async (hasInsurance: boolean) => {
        setIsProcessing(true);
        if (!hasInsurance) {
            await createGoal({
                name: "Health Insurance",
                targetAmount: 500000,
                currentAmount: 0,
                targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                emoji: "🏥",
                type: "protection",
                status: "active",
                createdAt: new Date().toISOString()
            });
            await createGoal({
                name: "Term Insurance",
                targetAmount: 10000000,
                currentAmount: 0,
                targetDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                emoji: "🛡️",
                type: "protection",
                status: "active",
                createdAt: new Date().toISOString()
            });
        }
        setStep('completion');
        setIsProcessing(false);
    };

    const startPhase2 = () => {
        setPhase(2);
        setStep('intro');
    };

    const addLiability = () => {
        if (currentLiability.name && currentLiability.amount && currentLiability.interest) {
            setLiabilities([...liabilities, currentLiability]);
            setCurrentLiability({ name: '', amount: '', interest: '' });
        }
    };

    const removeLiability = (index: number) => {
        setLiabilities(liabilities.filter((_, i) => i !== index));
    };

    const handlePhase2Submit = async () => {
        setIsProcessing(true);
        for (const lib of liabilities) {
            const interestNum = parseFloat(lib.interest);
            await createLiability({
                name: lib.name,
                type: 'other',
                principal: parseFloat(lib.amount),
                outstanding: parseFloat(lib.amount),
                interestRate: interestNum,
                emiAmount: 0,
                startDate: new Date().toISOString(),
                tenure: 12,
                penalty_applied: interestNum > 10
            });
        }
        setStep('completion');
        setIsProcessing(false);
    };

    const startPhase3 = () => {
        setPhase(3);
        setStep('intro');
    };

    const handlePhase3Submit = async () => {
        setIsProcessing(true);
        await updateSettings({ passiveIncomeTarget: parseFloat(passiveTarget) || 0 });
        setStep('completion');
        setIsProcessing(false);
    };

    const finishOnboarding = async () => {
        await updateSettings({ onboardingPhase: 3 }); // Mark complete
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black overflow-hidden">
            {/* Mesh Gradient Background - Shifts based on phase */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none transition-colors duration-1000">
                <AnimatePresence>
                    {phase === 1 && (
                        <motion.div
                            key="teal-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-teal-500/20 blur-[120px] rounded-full animate-pulse" />
                            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
                        </motion.div>
                    )}
                    {phase === 2 && (
                        <motion.div
                            key="orange-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-orange-500/20 blur-[120px] rounded-full animate-pulse" />
                            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse" />
                        </motion.div>
                    )}
                    {phase === 3 && (
                        <motion.div
                            key="purple-bg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                        >
                            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" />
                            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-amber-500/10 blur-[120px] rounded-full animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full" />
            </div>

            <AnimatePresence mode="wait">
                {/* PHASE 1: THE SHIELD */}
                {phase === 1 && step === 'intro' && (
                    <motion.div key="p1-intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full text-center space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-teal-500/20">
                            <Shield className="w-10 h-10 text-teal-400" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-white tracking-tight leading-tight uppercase">Welcome to <span className="text-teal-400">FinHub</span></h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">Before we look at your wealth, let's ensure it's protected.</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => setStep('question')} className="group py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-24 flex items-center justify-center gap-3 hover:bg-teal-400 transition-all duration-500">
                                Begin Shield <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={() => toggleSampleMode(true)} className="py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-teal-400 transition-colors">
                                View Sample Node
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 1 && step === 'question' && (
                    <motion.div key="p1-question" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full space-y-8 relative z-10">
                        <div className="space-y-4 text-center">
                            <div className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] mb-2">Security Check</div>
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">Do you have Health and Term Insurance?</h2>
                            <p className="text-slate-500 font-bold">These are the foundations of any terminal wealth flight path.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 pt-4 text-left">
                            <button onClick={() => handlePhase1Answer(true)} disabled={isProcessing} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl text-left hover:border-teal-500/30 hover:bg-teal-500/5 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-white font-black uppercase tracking-widest group-hover:text-teal-400 transition-colors">Yes, I'm covered</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Shield is active</p>
                                    </div>
                                    <CheckCircle2 className="w-6 h-6 text-slate-700 group-hover:text-teal-500 transition-colors" />
                                </div>
                            </button>
                            <button onClick={() => handlePhase1Answer(false)} disabled={isProcessing} className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-white font-black uppercase tracking-widest group-hover:text-amber-400 transition-colors">Not yet</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Security leak detected</p>
                                    </div>
                                    <AlertTriangle className="w-6 h-6 text-slate-700 group-hover:text-amber-500 transition-colors" />
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 1 && step === 'completion' && (
                    <motion.div key="p1-comp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-teal-500/10 border border-teal-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-teal-400" /></div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">Security Enabled</h2>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">Understood. We've prioritized these. A single emergency shouldn't crash your flight path.</p>
                        </div>
                        <button onClick={startPhase2} className="w-full py-5 bg-teal-500 text-black font-black uppercase tracking-[0.2em] rounded-24 hover:bg-teal-400 transition-all duration-500 shadow-xl shadow-teal-500/20">Initialize Phase 2</button>
                    </motion.div>
                )}

                {/* PHASE 2: ACTION ZONE */}
                {phase === 2 && step === 'intro' && (
                    <motion.div key="p2-intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full text-center space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20">
                            <Flame className="w-10 h-10 text-orange-400" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-white tracking-tight leading-tight uppercase">Action <span className="text-orange-400">Zone</span></h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">Now, let's find the 'Wealth Leaks' that are slowing you down.</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => setStep('question')} className="group py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-24 flex items-center justify-center gap-3 hover:bg-orange-400 transition-all duration-500">
                                Run Scan <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={() => toggleSampleMode(true)} className="py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-orange-400 transition-colors">
                                View Sample Node
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 2 && step === 'question' && (
                    <motion.div key="p2-question" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full space-y-6 relative z-10 flex flex-col h-[80vh]">
                        <div className="space-y-2 text-center shrink-0">
                            <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-1">Alert: High-Interest Detection</div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Identify High-Interest Debt</h2>
                            <p className="text-slate-500 text-xs font-bold leading-relaxed">List liabilities (Credit Cards, Personal Loans) with interest above 10%.</p>
                        </div>

                        {/* Liability Form */}
                        <div className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/5 shrink-0">
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    placeholder="Name (e.g. ICICI CC)"
                                    className="bg-black/50 border border-white/10 p-3 rounded-xl text-xs font-bold focus:border-orange-500 outline-none transition-colors"
                                    value={currentLiability.name}
                                    onChange={e => setCurrentLiability({ ...currentLiability, name: e.target.value })}
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="bg-black/50 border border-white/10 p-3 rounded-xl text-xs font-bold focus:border-orange-500 outline-none transition-colors"
                                    value={currentLiability.amount}
                                    onChange={e => setCurrentLiability({ ...currentLiability, amount: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Interest % (e.g. 14)"
                                    className="flex-1 bg-black/50 border border-white/10 p-3 rounded-xl text-xs font-bold focus:border-orange-500 outline-none transition-colors"
                                    value={currentLiability.interest}
                                    onChange={e => setCurrentLiability({ ...currentLiability, interest: e.target.value })}
                                />
                                <button
                                    onClick={addLiability}
                                    className="px-6 bg-orange-500 hover:bg-orange-400 text-black rounded-xl p-3 transition-colors shrink-0"
                                    aria-label="Add liability"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 custom-scrollbar">
                            {liabilities.map((lib, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center justify-between p-4 bg-slate-900/40 border border-white/5 rounded-2xl group"
                                >
                                    <div>
                                        <p className="text-xs font-black uppercase text-white">{lib.name}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">₹{lib.amount} @ {lib.interest}%</p>
                                    </div>
                                    <button onClick={() => removeLiability(idx)} className="text-slate-600 hover:text-rose-500 transition-colors" aria-label="Remove liability"><Trash2 className="w-4 h-4" /></button>
                                </motion.div>
                            ))}
                            {liabilities.length === 0 && (
                                <div className="h-20 flex items-center justify-center border border-dashed border-white/5 rounded-2xl">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">No leaks added yet</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 shrink-0 flex gap-3">
                            <button
                                onClick={() => setStep('completion')}
                                className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:text-white transition-colors"
                            >
                                Skip (No High Debt)
                            </button>
                            <button
                                onClick={handlePhase2Submit}
                                disabled={liabilities.length === 0 || isProcessing}
                                className="flex-1 py-4 bg-orange-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl disabled:opacity-50 hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20"
                            >
                                Patch Leaks
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 2 && step === 'completion' && (
                    <motion.div key="p2-comp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6"><Flame className="w-10 h-10 text-rose-400" /></div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">Analysis Complete</h2>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed leading-relaxed">
                                Found them. Paying these off isn't an expense—it's a <span className="text-rose-400">guaranteed profit</span>.
                                We'll tackle these before we scale your investments.
                            </p>
                        </div>
                        <button onClick={startPhase3} className="w-full py-5 bg-orange-500 text-black font-black uppercase tracking-[0.2em] rounded-24 hover:bg-orange-400 transition-all duration-500 shadow-xl shadow-orange-500/20">Initialize Phase 3</button>
                    </motion.div>
                )}

                {/* PHASE 3: GROWTH ZONE */}
                {phase === 3 && step === 'intro' && (
                    <motion.div key="p3-intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md w-full text-center space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/20">
                            <Sparkles className="w-10 h-10 text-purple-400" />
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-black text-white tracking-tight leading-tight uppercase">Growth <span className="text-purple-400">Zone</span></h1>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">Your foundation is set. Now, what does freedom look like for you?</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <button onClick={() => setStep('question')} className="group py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-24 flex items-center justify-center gap-3 hover:bg-purple-400 transition-all duration-500">
                                Set Target <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={() => toggleSampleMode(true)} className="py-3 text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-purple-400 transition-colors">
                                View Sample Node
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 3 && step === 'question' && (
                    <motion.div key="p3-question" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full space-y-8 relative z-10">
                        <div className="space-y-4 text-center">
                            <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] mb-2">Financial Freedom Score</div>
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">Target Monthly Passive Income</h2>
                            <p className="text-slate-500 font-bold text-sm leading-relaxed">This sets the baseline for your Freedom Meter. Every rupee you save now will be measured in Time.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-700">₹</span>
                                <input
                                    type="number"
                                    placeholder="50,000"
                                    className="w-full bg-slate-900/50 border border-white/5 p-8 pl-12 rounded-[32px] text-4xl font-black text-white outline-none focus:border-purple-500/50 transition-all tabular-nums"
                                    value={passiveTarget}
                                    onChange={e => setPassiveTarget(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handlePhase3Submit}
                                disabled={!passiveTarget || isProcessing}
                                className="w-full py-5 bg-purple-500 text-black font-black uppercase tracking-[0.2em] rounded-24 hover:bg-purple-400 transition-all duration-500 shadow-xl shadow-purple-500/20 disabled:opacity-50"
                            >
                                Lock Horizon
                            </button>
                        </div>
                    </motion.div>
                )}

                {phase === 3 && step === 'completion' && (
                    <motion.div key="p3-comp" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-8 relative z-10">
                        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-[28px] flex items-center justify-center mx-auto mb-6"><Zap className="w-10 h-10 text-amber-400" /></div>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight uppercase">Target Locked</h2>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed leading-relaxed">
                                Welcome to the cockpit. Every rupee you save now will be measured in <span className="text-amber-400">Time</span>, not just numbers.
                            </p>
                        </div>
                        <button onClick={finishOnboarding} className="w-full py-5 bg-amber-500 text-black font-black uppercase tracking-[0.2em] rounded-24 hover:bg-amber-400 transition-all duration-500 shadow-xl shadow-amber-500/20">Launch Terminal</button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
