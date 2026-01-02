import React from 'react';
import { House, Receipt, Landmark, ChartLine, Target, GripVertical } from 'lucide-react';

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
            className={`nav-bar fixed bottom-0 w-full h-20 flex items-center justify-around px-4 border-t border-white/5 transition-transform duration-300 ease-in-out z-[100] ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
        >
            <div
                className={`flex flex-col items-center relative py-4 cursor-pointer transition-colors ${activeTab === 'dashboard' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('dashboard')}
            >
                {activeTab === 'dashboard' && <div className="absolute top-0 w-8 h-0.5 bg-[#0A84FF] shadow-[0_0_15px_#0A84FF] rounded-full" />}
                <House className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Home</span>
            </div>

            <div
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'transactions' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('transactions')}
            >
                <Receipt className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">History</span>
            </div>

            <div
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'liability' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('liability')}
            >
                <Landmark className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Bills</span>
            </div>

            <div
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'investments' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('investments')}
            >
                <ChartLine className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Growth</span>
            </div>

            <div
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'goals' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('goals')}
            >
                <Target className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">Goals</span>
            </div>

            <div
                className={`flex flex-col items-center transition-all cursor-pointer ${activeTab === 'more' ? 'text-[#0A84FF]' : 'text-[#8E8E93] hover:text-white'}`}
                onClick={() => onTabChange('more')}
            >
                <GripVertical className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase mt-2 tracking-[0.3em]">More</span>
            </div>
        </nav>
    );
};
