import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Target, Cpu } from 'lucide-react';

interface AboutUsPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AboutUsPopup: React.FC<AboutUsPopupProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (Dismissible Area) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Popup Container */}
                    <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-md bg-slate-900 border border-white/5 rounded-[32px] shadow-2xl overflow-hidden pointer-events-auto relative"
                        >
                            {/* Header Mesh Background */}
                            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors z-10"
                                aria-label="Close about us popup"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="p-8 pt-12 space-y-8 relative">
                                {/* Branding */}
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="w-16 h-16 rounded-[22px] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Cpu className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">FinHub Core</h2>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Quantum Fabric v50.3</p>
                                    </div>
                                </div>

                                {/* Content Sections */}
                                <div className="space-y-6">
                                    <section className="space-y-2">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Target className="w-3.5 h-3.5" />
                                            Our Vision
                                        </h3>
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                            FinHub is designed to be the central nervous system of your personal economy.
                                            We merge neural-inspired data models with high-precision tracking to navigate
                                            complex wealth landscapes.
                                        </p>
                                    </section>

                                    <section className="space-y-2">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Shield className="w-3.5 h-3.5" />
                                            Core Protocol
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <span className="block text-[8px] font-black text-indigo-400 uppercase mb-1">Localization</span>
                                                <span className="text-[10px] text-slate-400 leading-tight">Sovereign identity via node storage.</span>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                                <span className="block text-[8px] font-black text-indigo-400 uppercase mb-1">Clamping Logic</span>
                                                <span className="text-[10px] text-slate-400 leading-tight">Mathematical stability in all simulations.</span>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Footer */}
                                    <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-2">
                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Architect: Sijo Joseph</p>
                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">© 2025 Neural FinBase Fabric</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
