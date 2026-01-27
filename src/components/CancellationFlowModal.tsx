import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ExternalLink, Mail, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { RecurringTransaction } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface CancellationFlowModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    subscription: RecurringTransaction;
    onStatusUpdate: (id: string, newStatus: string) => Promise<void>;
}

export function CancellationFlowModal({ isOpen, onOpenChange, subscription, onStatusUpdate }: CancellationFlowModalProps) {
    const [metadata, setMetadata] = React.useState<any>(null);

    React.useEffect(() => {
        if (isOpen) {
            fetchMetadata();
        }
    }, [isOpen, subscription.id]);

    const fetchMetadata = async () => {
        try {
            // Find the catalog entity linked to this subscription
            const { data: subData } = await supabase
                .from('subscriptions')
                .select('catalog_entity_id')
                .eq('id', subscription.id)
                .single();

            if (subData?.catalog_entity_id) {
                const { data: entity } = await supabase
                    .from('catalog_entities')
                    .select('metadata, name, logo_url')
                    .eq('id', subData.catalog_entity_id)
                    .single();

                if (entity) setMetadata(entity);
            }
        } catch (err) {
            console.error('Error fetching cancellation metadata:', err);
        }
    };

    const handleInitiateCancellation = async () => {
        await onStatusUpdate(subscription.id, 'cancellation_pending');
        toast.success('Subscription marked as Cancellation Pending');
        // Open URL if available
        if (metadata?.metadata?.cancel_url) {
            window.open(metadata.metadata.cancel_url, '_blank');
        }
    };

    const handleConfirmCancellation = async () => {
        await onStatusUpdate(subscription.id, 'cancelled');
        toast.success('Subscription successfully marked as Cancelled');
        onOpenChange(false);
    };

    const status = subscription.status;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-slate-950 border-white/10 text-white rounded-[32px] overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl -mr-16 -mt-16" />

                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                        {status === 'cancellation_pending' ? (
                            <><CheckCircle2 className="w-6 h-6 text-emerald-400" /> Confirm Cancellation</>
                        ) : (
                            <><AlertCircle className="w-6 h-6 text-rose-400" /> Cancel Subscription</>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold">
                        {status === 'cancellation_pending'
                            ? "Have you completed the steps on the official website?"
                            : "We'll guide you through the official cancellation process."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4 relative z-10">
                    {metadata ? (
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-4 mb-2">
                                {metadata.logo_url ? (
                                    <img src={metadata.logo_url} alt={metadata.name} className="w-12 h-12 rounded-xl object-contain bg-white/5 p-1" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-xl">📺</div>
                                )}
                                <div>
                                    <h4 className="font-black text-white">{metadata.name}</h4>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Official Provider</p>
                                </div>
                            </div>

                            {metadata.metadata?.cancel_steps && (
                                <div className="space-y-2">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Cancellation Steps
                                    </p>
                                    <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                                        {metadata.metadata.cancel_steps}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-3">
                                {metadata.metadata?.cancel_url && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 h-12 rounded-xl group"
                                        onClick={() => window.open(metadata.metadata.cancel_url, '_blank')}
                                    >
                                        <span className="flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs font-bold text-slate-200">Official Cancellation Page</span>
                                        </span>
                                        <span className="text-[10px] font-black text-indigo-400 group-hover:translate-x-1 transition-transform">GO →</span>
                                    </Button>
                                )}

                                {metadata.metadata?.support_email && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 h-12 rounded-xl group"
                                        onClick={() => window.location.href = `mailto:${metadata.metadata.support_email}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs font-bold text-slate-200">Contact Support</span>
                                        </span>
                                        <span className="text-[10px] font-black text-indigo-400 group-hover:translate-x-1 transition-transform">EMAIL</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-300">No official cancellation guide found.</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Please visit the provider's website directly.</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 space-y-3">
                        {status !== 'cancellation_pending' ? (
                            <Button
                                className="w-full h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-600/20"
                                onClick={handleInitiateCancellation}
                            >
                                Mark as Cancellation Pending
                            </Button>
                        ) : (
                            <Button
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-emerald-600/20"
                                onClick={handleConfirmCancellation}
                            >
                                Yes, I've Cancelled it
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            className="w-full h-12 text-slate-500 hover:text-white font-bold"
                            onClick={() => onOpenChange(false)}
                        >
                            Wait, Keep it for now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
