import React from 'react';
import { House, Receipt, RefreshCw, ChartLine, Target, GripVertical } from 'lucide-react';

interface BottomNavProps {
    isVisible: boolean;
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
    isVisible,
    activeTab,
    onTabChange
}) => {
    return (
        <nav
            className={`nav-bar safe-footer fixed bottom-0 w-full flex items-center justify-around px-4 border-t border-white/5 transition-transform duration-300 ease-in-out z-[100] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <button
                aria-label="Home Dashboard"
                className={`flex flex-col items-center relative py-4 cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('dashboard')}
            >
                {activeTab === 'dashboard' && <div className="absolute top-0 w-8 h-0.5 bg-[#0A84FF] shadow-[0_0_15px_#0A84FF] rounded-full" />}
                <House className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Home</span>
            </button>

            <button
                aria-label="Transaction History"
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'transactions' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('transactions')}
            >
                <Receipt className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">History</span>
            </button>

            <button
                aria-label="Recurring Flows"
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'recurring' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('recurring')}
            >
                <RefreshCw className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Flows</span>
            </button>

            <button
                aria-label="Investment Growth"
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'investments' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('investments')}
            >
                <ChartLine className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Growth</span>
            </button>

            <button
                aria-label="Financial Goals"
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'goals' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('goals')}
            >
                <Target className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Goals</span>
            </button>

            <button
                aria-label="More Options"
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'more' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('more')}
            >
                <GripVertical className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">More</span>
            </button>
        </nav>
    );
};
