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
            className={`nav-bar safe-header fixed top-0 w-full flex items-center justify-between px-6 border-b border-white/5 transition-transform duration-300 ease-in-out z-[100] ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
        >
            {/* User Settings (Left) */}
            <button
                onClick={onSettingsClick}
                aria-label="User Settings"
                className="w-10 h-10 sq-md bg-black border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
                <User className="w-5 h-5 text-slate-400" />
            </button>

            {/* Logo Center */}
            <div className="flex flex-col items-center">
                <img
                    src="/images/logo-dark.png"
                    alt="FinHub"
                    className="h-8 w-auto hidden dark:block"
                />
                <img
                    src="/images/logo-light.png"
                    alt="FinHub"
                    className="h-8 w-auto block dark:hidden"
                />
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
                        <span className="absolute top-0 right-0 w-2 h-2 bg-[#FF453A] sq-full ring-2 ring-black"></span>
                    )}
                </div>
            </button>
        </header>
    );
};
