
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Goal } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { PiggyBank, ShieldCheck, Timer } from 'lucide-react';
import { toast } from 'sonner';

interface RoundUpDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (destinationId: string, destinationType: 'goal' | 'emergency', muteDuration?: 'today' | 'week' | 'month') => void;
    expenseAmount: number;
    roundedAmount: number;
    currency: string;
    goals: Goal[];
    onMute: (duration: 'today' | 'week' | 'month') => void;
}

export const RoundUpDialog: React.FC<RoundUpDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    expenseAmount,
    roundedAmount,
    currency,
    goals,
    onMute
}) => {
    const [destinationType, setDestinationType] = useState<'goal' | 'emergency'>('emergency');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const diff = roundedAmount - expenseAmount;

    const handleConfirm = () => {
        if (destinationType === 'goal') {
            if (goals.length > 0 && !selectedGoalId) {
                toast.error("Please select a goal to save into.");
                return;
            }
        }

        onConfirm(
            destinationType === 'goal' ? selectedGoalId : 'emergency',
            destinationType
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-slate-950 border-white/5 p-0 shadow-2xl custom-scrollbar">
                <div className="px-8 pt-10 pb-8 border-b border-white/5 relative overflow-hidden bg-emerald-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 blur-[80px] opacity-20 -mr-16 -mt-16" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tighter text-slate-100">
                            <PiggyBank className="w-7 h-7 text-emerald-500" />
                            Round-Up Savings
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
                            Save your spare change from this transaction
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-300 leading-relaxed text-center px-4">
                            Transaction of <span className="text-slate-100">{formatCurrency(expenseAmount, currency)}</span> processed.
                            Round up to <span className="text-emerald-400">{formatCurrency(roundedAmount, currency)}</span>?
                        </p>

                        <div className="flex flex-col items-center justify-center py-8 bg-slate-900 border border-white/5 rounded-[32px] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-1">Spare Change</p>
                            <p className="text-5xl font-black text-white tracking-tighter">
                                {formatCurrency(diff, currency)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Save to</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setDestinationType('emergency')}
                                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 ${destinationType === 'emergency'
                                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                                    : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <ShieldCheck className={`w-6 h-6 ${destinationType === 'emergency' ? 'text-white' : 'text-slate-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Emergency Fund</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setDestinationType('goal');
                                    if (goals.length > 0 && !selectedGoalId) {
                                        setSelectedGoalId(goals[0].id);
                                    }
                                }}
                                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-3 ${destinationType === 'goal'
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40'
                                    : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                    }`}
                            >
                                <Timer className={`w-6 h-6 ${destinationType === 'goal' ? 'text-white' : 'text-slate-500'}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Savings Goal</span>
                            </button>
                        </div>

                        {destinationType === 'goal' && goals.length > 0 && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                                    <SelectTrigger id="round-up-goal-select" name="goalId" className="h-12 bg-slate-900 border-white/5 rounded-2xl text-slate-200 font-bold focus:ring-1 focus:ring-white/10">
                                        <SelectValue placeholder="Select Savings Goal" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/5">
                                        {goals.map(goal => (
                                            <SelectItem key={goal.id} value={goal.id} className="focus:bg-white/5 focus:text-white font-bold">
                                                {goal.emoji} {goal.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {destinationType === 'goal' && goals.length === 0 && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-amber-400 text-center">
                                No active goals. Defaulting to Emergency Fund.
                            </div>
                        )}
                    </div>

                    <div className="pt-2 space-y-4">
                        <Button onClick={handleConfirm} className="w-full text-[10px] font-black uppercase tracking-widest h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-900/20 active:scale-[0.98] transition-all">
                            Save Spare Change
                        </Button>

                        <div className="flex items-center justify-between gap-4">
                            <Button variant="ghost" size="sm" onClick={onClose} className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-white/5">
                                Cancel
                            </Button>

                            <div className="flex-1">
                                <Select onValueChange={(v: any) => onMute(v)}>
                                    <SelectTrigger id="mute-duration" name="muteDuration" className="h-10 bg-transparent border border-white/5 hover:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 justify-center gap-2 px-4 focus:ring-0">
                                        <SelectValue placeholder="Disabled" />
                                    </SelectTrigger>
                                    <SelectContent align="end" className="bg-slate-900 border-white/5">
                                        <SelectItem value="today" className="text-[10px] font-bold py-2">Mute 24h</SelectItem>
                                        <SelectItem value="week" className="text-[10px] font-bold py-2">Mute 7d</SelectItem>
                                        <SelectItem value="month" className="text-[10px] font-bold py-2">Mute 30d</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
