import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeftRight, TrendingDown, AlertCircle } from 'lucide-react';
import { Account } from '../types';
import { formatCurrency } from '../utils/numberFormat';
import { toast } from 'sonner';

interface TransferFormProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    currency: string;
    onTransfer: (sourceId: string, destinationId: string, amount: number) => void;
}

export function TransferForm({
    isOpen,
    onClose,
    accounts,
    currency,
    onTransfer
}: TransferFormProps) {
    const [sourceId, setSourceId] = useState('');
    const [destinationId, setDestinationId] = useState('');
    const [amount, setAmount] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const sourceAccount = accounts.find(a => a.id === sourceId);
    const destinationAccount = accounts.find(a => a.id === destinationId);
    const amountNum = parseFloat(amount) || 0;

    const handlePreview = () => {
        if (!sourceId) {
            toast.error('Please select source reservoir');
            return;
        }
        if (!destinationId) {
            toast.error('Please select destination reservoir');
            return;
        }
        if (sourceId === destinationId) {
            toast.error('Source and destination must be different');
            return;
        }
        if (!amount || amountNum <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (sourceAccount && amountNum > sourceAccount.balance) {
            toast.error('Insufficient funds in source reservoir');
            return;
        }
        setShowPreview(true);
    };

    const handleConfirm = () => {
        onTransfer(sourceId, destinationId, amountNum);
        resetAndClose();
    };

    const resetAndClose = () => {
        setSourceId('');
        setDestinationId('');
        setAmount('');
        setShowPreview(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#020408] border-white/5 p-0 shadow-2xl custom-scrollbar text-white">
                <div className="px-8 pt-10 pb-8 border-b border-white/5 relative overflow-hidden bg-indigo-500/5">
                    <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -mr-16 -mt-16 bg-indigo-500" />

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black tracking-tighter text-slate-100 flex items-center gap-3">
                            <ArrowLeftRight className="w-6 h-6 text-indigo-400" />
                            Capital Migration
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
                            Transfer between core liquidity reservoirs
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8">
                    {!showPreview ? (
                        <div className="space-y-6">
                            {/* Source Reservoir */}
                            <div className="space-y-3">
                                <Label htmlFor="source-reservoir" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Source Reservoir</Label>
                                <Select value={sourceId} onValueChange={setSourceId}>
                                    <SelectTrigger id="source-reservoir" className="h-14 bg-slate-900 border-white/5 rounded-2xl focus:ring-1 focus:ring-indigo-500/50 text-slate-200 font-bold">
                                        <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/5 max-h-[40vh]">
                                        {accounts.map(account => (
                                            <SelectItem key={account.id} value={account.id} className="focus:bg-white/5 focus:text-white">
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{account.icon}</span>
                                                        <span>{account.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500">
                                                        {formatCurrency(account.balance, currency)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Destination Reservoir */}
                            <div className="space-y-3">
                                <Label htmlFor="dest-reservoir" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Destination Reservoir</Label>
                                <Select value={destinationId} onValueChange={setDestinationId}>
                                    <SelectTrigger id="dest-reservoir" className="h-14 bg-slate-900 border-white/5 rounded-2xl focus:ring-1 focus:ring-indigo-500/50 text-slate-200 font-bold">
                                        <SelectValue placeholder="Select destination" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/5 max-h-[40vh]">
                                        {accounts.map(account => (
                                            <SelectItem key={account.id} value={account.id} className="focus:bg-white/5 focus:text-white" disabled={account.id === sourceId}>
                                                <div className="flex items-center justify-between w-full pr-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl">{account.icon}</span>
                                                        <span>{account.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-slate-500">
                                                        {formatCurrency(account.balance, currency)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Amount */}
                            <div className="space-y-3">
                                <Label htmlFor="migration-amount" className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Capital Amount</Label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-indigo-400 transition-colors">
                                        {currency === 'INR' ? '₹' : '$'}
                                    </div>
                                    <Input
                                        id="migration-amount"
                                        name="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="pl-12 h-14 bg-slate-900 border-white/5 rounded-2xl focus:ring-1 focus:ring-indigo-500/50 text-slate-100 font-black text-xl"
                                    />
                                </div>
                                {sourceAccount && amountNum > sourceAccount.balance && (
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-400 ml-1 animate-in slide-in-from-top-1">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Insufficient stability in source reservoir</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <Button variant="ghost" onClick={resetAndClose} className="flex-1 h-12 rounded-2xl text-slate-500 font-bold hover:bg-white/5">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePreview}
                                    className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                >
                                    Verify Migration
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                            <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-6">
                                {/* Visual Flow */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 text-center space-y-2">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-2xl mx-auto">
                                            {sourceAccount?.icon}
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 truncate">{sourceAccount?.name}</p>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <ArrowLeftRight className="w-6 h-6 text-indigo-400 animate-pulse" />
                                        <p className="text-[10px] font-black text-indigo-400">{formatCurrency(amountNum, currency)}</p>
                                    </div>

                                    <div className="flex-1 text-center space-y-2">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-2xl mx-auto">
                                            {destinationAccount?.icon}
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-500 truncate">{destinationAccount?.name}</p>
                                    </div>
                                </div>

                                {/* Impact Summary */}
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold">Source New Balance</span>
                                        <span className="text-rose-400 font-black">
                                            {formatCurrency((sourceAccount?.balance || 0) - amountNum, currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold">Dest. New Balance</span>
                                        <span className="text-emerald-400 font-black">
                                            {formatCurrency((destinationAccount?.balance || 0) + amountNum, currency)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3">
                                <TrendingDown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                <p className="text-[10px] text-amber-200/60 font-medium leading-relaxed">
                                    Notice: This transfer will instantly adjust the balance of both accounts. This action is recorded in your transaction history.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button variant="ghost" onClick={() => setShowPreview(false)} className="flex-1 h-12 rounded-2xl text-slate-500 font-bold hover:bg-white/5">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                                >
                                    Confirm Migration
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
