import { useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';
import { Notification } from '../types';

export const useFinanceNotifications = (setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>) => {
    const addNotifications = useCallback((newNotifs: Notification | Notification[]) => {
        const toAdd = Array.isArray(newNotifs) ? newNotifs : [newNotifs];

        setNotifications(prev => {
            const filtered = toAdd.filter(notif => {
                const idExists = prev.some(p => p.id === notif.id);
                if (idExists) return false;

                const similarExists = prev.some(p =>
                    p.type === notif.type &&
                    p.message === notif.message &&
                    !p.read &&
                    (new Date().getTime() - new Date(p.timestamp).getTime() < 1000 * 60 * 60 * 24)
                );
                return !similarExists;
            });

            if (filtered.length === 0) return prev;

            const combined = [...filtered, ...prev].sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            return combined.slice(0, 100);
        });

        if (Capacitor.isNativePlatform()) {
            toAdd.forEach(notif => {
                if (notif.priority === 'high' || notif.type === 'reminder' || notif.type === 'alert' || notif.type === 'achievement') {
                    LocalNotifications.schedule({
                        notifications: [{
                            id: Math.floor(Math.random() * 1000000),
                            title: notif.title,
                            body: notif.message,
                            largeIcon: 'res://drawable/splash',
                            smallIcon: 'res://drawable/splash',
                            schedule: { at: new Date(Date.now() + 1000) },
                            extra: {
                                notificationId: notif.id,
                                achievementId: notif.achievementId,
                                type: notif.type,
                                category: notif.category
                            }
                        }]
                    });
                }
            });
        } else {
            // Web/Browser Toasts
            toAdd.forEach(notif => {
                if (notif.type === 'achievement') {
                    toast.success(notif.title, {
                        description: notif.message,
                        duration: 5000,
                    });
                } else if (notif.priority === 'high') {
                    toast.info(notif.title, {
                        description: notif.message,
                    });
                }
            });
        }
    }, [setNotifications]);

    return useMemo(() => ({ addNotifications }), [addNotifications]);
};
