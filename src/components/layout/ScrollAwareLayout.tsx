import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

interface ScrollAwareLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    notificationCount?: number;
    onNotificationClick?: () => void;
    onSettingsClick?: () => void;
    renderFab?: (isVisible: boolean) => React.ReactNode;
    forceHide?: boolean;
}

export const ScrollAwareLayout: React.FC<ScrollAwareLayoutProps> = ({
    children,
    activeTab,
    onTabChange,
    notificationCount,
    onNotificationClick,
    onSettingsClick,
    renderFab,
    forceHide = false
}) => {
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0);
    const scrollThreshold = 20;

    const effectivelyVisible = isVisible && !forceHide;

    useEffect(() => {
        const handleScroll = () => {
            if (forceHide) return;
            const currentScrollY = window.scrollY;

            if (currentScrollY < 10) {
                setIsVisible(true);
                lastScrollY.current = currentScrollY;
                return;
            }

            const diff = currentScrollY - lastScrollY.current;

            if (Math.abs(diff) > scrollThreshold) {
                if (diff > 0) {
                    setIsVisible(false);
                } else {
                    setIsVisible(true);
                }
                lastScrollY.current = currentScrollY;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [forceHide]);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary">
            <AppHeader
                isVisible={effectivelyVisible}
                notificationCount={notificationCount}
                onNotificationClick={onNotificationClick}
                onSettingsClick={onSettingsClick}
            />

            <main
                className="safe-layout-main px-4 w-full md:max-w-3xl lg:max-w-5xl mx-auto min-h-screen"
            >
                {children}
            </main>

            <BottomNav
                isVisible={effectivelyVisible}
                activeTab={activeTab}
                onTabChange={onTabChange}
            />
            {renderFab && renderFab(effectivelyVisible)}
        </div>
    );
};
