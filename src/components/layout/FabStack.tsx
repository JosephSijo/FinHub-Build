import { Sparkles, Minus, Plus, Users, ArrowLeftRight } from 'lucide-react';

interface FabStackProps {
    onOpenAI: () => void;
    onAddTransaction: (type: 'expense' | 'income' | 'debt') => void;
    onMigrate: () => void;
    isVisible: boolean;
}

export const FabStack: React.FC<FabStackProps> = ({ onOpenAI, onAddTransaction, onMigrate, isVisible }) => {
    return (
        <div
            id="fab-dock"
            className={`fixed right-5 bottom-[110px] flex flex-col gap-3.5 z-[110] transition-all duration-500 ease-[cubic-bezier(0.2,1,0.3,1)] ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[100px] opacity-0'}`}
        >
            {/* AI Assistant (Purple) */}
            <div
                onClick={onOpenAI}
                title="AI Assistant"
                className="w-[52px] h-[52px] sq-md flex items-center justify-center bg-black border border-[#a855f74d] shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer text-[#A855F7] hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </div>

            {/* Migrate Capital (Indigo) */}
            <div
                onClick={onMigrate}
                title="Migrate Capital"
                className="w-[52px] h-[52px] sq-md flex items-center justify-center bg-black border border-indigo-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer text-indigo-400 hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
                <ArrowLeftRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>

            {/* Add IOU (Yellow) */}
            <div
                onClick={() => onAddTransaction('debt')}
                title="Added Personal IOU"
                className="w-[52px] h-[52px] sq-md flex items-center justify-center bg-black border border-yellow-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer text-yellow-500 hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
                <Users className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            </div>

            {/* Add Money In (Green) */}
            <div
                onClick={() => onAddTransaction('income')}
                title="Add Money In"
                className="w-[52px] h-[52px] sq-md flex items-center justify-center bg-black border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] cursor-pointer text-emerald-500 hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </div>

            {/* Add Money Out (Red) */}
            <div
                onClick={() => onAddTransaction('expense')}
                title="Add Money Out"
                className="w-[52px] h-[52px] sq-md flex items-center justify-center bg-black border border-rose-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.6)] cursor-pointer text-rose-500 hover:scale-110 active:scale-95 transition-all duration-300 group"
            >
                <Minus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
        </div>
    );
};
