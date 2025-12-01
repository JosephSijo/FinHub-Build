import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Bell, TrendingUp, Target, Award, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface Notification {
  id: string;
  type: 'achievement' | 'goal' | 'alert' | 'insight';
  title: string;
  message: string;
  timestamp: Date;
  icon: React.ReactNode;
  read: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onClearRead?: () => void;
}

export function NotificationsPanel({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onMarkAsRead,
  onClearRead
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement':
        return <Award className="w-5 h-5 text-yellow-500" />;
      case 'goal':
        return <Target className="w-5 h-5 text-green-500" />;
      case 'insight':
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </SheetTitle>
          <SheetDescription>
            View your recent notifications and achievements
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  We'll notify you about achievements, goals, and important insights
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    notification.read
                      ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      : 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 shadow-sm'
                  }`}
                  onClick={() => {
                    onNotificationClick?.(notification);
                    onMarkAsRead?.(notification.id);
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm text-gray-900 dark:text-gray-100">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="mt-2">
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Tap to view details
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="absolute bottom-6 left-6 right-6 space-y-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  notifications.forEach(n => {
                    if (!n.read) onMarkAsRead?.(n.id);
                  });
                }}
              >
                Mark all as read ({unreadCount})
              </Button>
            )}
            {readCount > 0 && (
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (confirm(`Clear ${readCount} read notification${readCount > 1 ? 's' : ''}?`)) {
                    onClearRead?.();
                  }
                }}
              >
                Clear read notifications ({readCount})
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
