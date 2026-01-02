import React from 'react';
import { Bell, User } from 'lucide-react';

interface AppHeaderProps {
    isVisible: boolean;
    onNotificationClick?: () => void;
    onSettingsClick?: () => void;
    notificationCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
    isVisible,
    onNotificationClick,
    onSettingsClick,
    notificationCount = 0
}) => {
    return (
        <header
            className={`nav-bar fixed top-0 w-full h-16 flex items-center justify-between px-6 border-b border-white/5 transition-transform duration-300 ease-in-out z-[100] ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        >
            {/* User Settings (Left) */}
            <button
                onClick={onSettingsClick}
                aria-label="User Settings"
                className="w-10 h-10 rounded-xl bg-[#1C1C1E] border border-white/5 flex items-center justify-center hover:bg-[#2C2C2E] transition-colors"
            >
                <User className="w-5 h-5 text-slate-400" />
            </button>

            {/* Logo Center */}
            <div className="flex flex-col items-center">
                <span className="tracking-[0.4em] font-black text-sm italic text-white leading-none">FINHUB</span>
                <div className="h-[2px] w-6 bg-blue-600 rounded-full mt-1.5 shadow-[0_0_10px_#2563EB]"></div>
            </div>

            {/* Notifications (Right) */}
            <button
                onClick={onNotificationClick}
                aria-label="Notifications"
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
            >
                <div className="relative">
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                        <span className="absolute top-0 right-0 w-2 h-2 bg-[#FF453A] rounded-full ring-2 ring-[#000000]"></span>
                    )}
                </div>
            </button>
        </header>
    );
};
