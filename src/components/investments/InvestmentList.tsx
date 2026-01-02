import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Plus, Edit, X } from 'lucide-react';
import { Investment } from '../../types';
import { InteractiveFinancialValue } from '../ui/InteractiveFinancialValue';

interface InvestmentListProps {
    investments: Investment[];
    onAdd: () => void;
    onEdit: (inv: Investment) => void;
    onClose: (inv: Investment) => void;
    currency: string;
}

export function InvestmentList({
    investments,
    onAdd,
    onEdit,
    onClose,
    currency
}: InvestmentListProps) {
    return (
        <Card className="p-6 bg-[#1C1C1E] border border-white/5 rounded-[32px]">
            <div className={`flex items-center justify-between mb-8 px-2 ${investments.length === 0 ? 'opacity-40' : ''}`}>
                <h3 className="text-label text-[10px]">Portfolio Assets</h3>
            </div>

            {investments.length === 0 ? (
                <div
                    onClick={onAdd}
                    className="group cursor-pointer p-8 bg-slate-800/10 border-2 border-dashed border-slate-700/30 rounded-[32px] hover:border-slate-600/50 hover:bg-slate-800/20 transition-all duration-300 flex flex-col items-center justify-center space-y-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 opacity-50 group-hover:scale-105 transition-transform">
                        <Plus className="w-6 h-6 text-slate-500" />
                    </div>
                    <div className="text-center">
                        <p className="text-slate-400 font-bold">No investments tracked yet. Want to see your growth here?</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2 font-black">Tap to Initialize Portfolio</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {investments.map((inv) => {
                        const totalCost = inv.buyPrice * inv.quantity;
                        const currentValue = (inv.currentPrice || 0) * inv.quantity;
                        const gainLoss = currentValue - totalCost;
                        const gainLossPercent = totalCost === 0 ? 0 : (gainLoss / totalCost) * 100;

                        return (
                            <div key={inv.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/40 border border-white/5 rounded-[28px] hover:bg-black/60 transition-all duration-300 gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-12 h-12 bg-black border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                        <span className="text-sm font-black text-[#0A84FF]">{inv.symbol.substring(0, 2)}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-slate-100 truncate">{inv.symbol}</h4>
                                            <span className="text-[8px] px-1.5 py-0.5 bg-white/5 rounded uppercase tracking-wider text-[#8E8E93] font-bold shrink-0">
                                                {inv.type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-label text-[10px] truncate opacity-60">
                                            {inv.name} • {inv.quantity} {inv.type === 'stock' ? 'shares' : 'units'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                                    <div className="text-right flex flex-col justify-center">
                                        <div className="text-balance text-sm font-bold text-slate-200">
                                            <InteractiveFinancialValue value={currentValue} currency={currency} />
                                        </div>
                                        <div className="flex items-center gap-2 justify-end mt-1">
                                            <div className={`text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-lg ${gainLoss >= 0 ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-[#FF453A]/10 text-[#FF453A]'}`}>
                                                {gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit(inv)}
                                            className="w-9 h-9 p-0 bg-white/5 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-slate-400"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onClose(inv)}
                                            className="w-9 h-9 p-0 bg-white/5 rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-slate-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </Card>
    );
}
