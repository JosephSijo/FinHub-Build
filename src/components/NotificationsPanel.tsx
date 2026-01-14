/* eslint-disable react/forbid-component-props, react/forbid-dom-props */
import { Sheet, SheetContent, SheetTitle, SheetDescription } from './ui/sheet';
import { Bell, TrendingUp, Target, Award, AlertTriangle, CheckCheck, Trash2, X, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';

import { Notification } from '../types';

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
      case 'reminder':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
    }
  };

  const formatTime = (inputDate: Date | string) => {
    const date = new Date(inputDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const [expandedStacks, setExpandedStacks] = useState<Record<string, boolean>>({
    reminders: true,
    transactions: true,
    achievements: false,
    insights: false
  });

  const toggleStack = (category: string) => {
    setExpandedStacks(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const categoriesOrder = ['reminders', 'transactions', 'insights', 'achievements'] as const;

  const groupedNotifications = notifications.reduce((acc, n) => {
    const cat = n.category || 'insights';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(n);
    return acc;
  }, {} as Record<string, Notification[]>);

  // Sort within each category: Unread first, then by timestamp descending
  Object.keys(groupedNotifications).forEach(cat => {
    groupedNotifications[cat].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col h-dvh max-h-dvh bg-black border-white/5 text-slate-100 overflow-hidden z-[99999]">
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <SheetDescription className="sr-only">Protocol Intelligence Pulse</SheetDescription>
        {/* Modernized Panel Header */}
        <div className="px-8 pt-28 pb-10 border-b border-white/5 bg-black relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 blur-[120px] opacity-10 -mr-24 -mt-24" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 blur-[80px] opacity-5 -ml-12 -mb-12" />

          {/* Close Button Area */}
          <div className="absolute top-8 right-8 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 sq-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-slate-100 tracking-tighter leading-none flex items-center gap-4">
                  Pulse
                  {unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 text-[10px] font-black bg-indigo-600 text-white sq-full shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                      {unreadCount}
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] leading-none ml-0.5">
                System Intelligence Stack
              </p>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Mark all as read"
                  onClick={() => {
                    notifications.forEach(n => {
                      if (!n.read) onMarkAsRead?.(n.id);
                    });
                  }}
                  className="w-11 h-11 sq-md bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-white/10 transition-all duration-300 border border-white/5 active:scale-90"
                >
                  <CheckCheck className="w-5 h-5" />
                </Button>
              )}
              {readCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Clear history"
                  onClick={() => {
                    if (confirm(`Purge ${readCount} recorded protocol entries?`)) {
                      onClearRead?.();
                    }
                  }}
                  className="w-11 h-11 sq-md bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 border border-white/5 active:scale-90"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 w-full bg-black overflow-hidden custom-scrollbar">
          <div className="px-6 space-y-12 py-8 pb-32">
            {notifications.length === 0 ? (
              <div className="text-center py-32 flex flex-col items-center animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-white/5 border border-white/5 sq-2xl flex items-center justify-center text-slate-800 mb-8 shadow-inner relative group">
                  <div className="absolute inset-0 bg-indigo-500/5 blur-2xl sq-full group-hover:bg-indigo-500/10 transition-colors" />
                  <Bell className="w-10 h-10 relative z-10" />
                </div>
                <h4 className="text-2xl font-black text-slate-100 mb-3 tracking-tight">Signal Silence</h4>
                <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em] max-w-[260px] leading-relaxed">
                  The protocol pulse is flat. We will alert you upon system breakthroughs.
                </p>
              </div>
            ) : (
              categoriesOrder.map((category) => {
                const categoryNotifs = groupedNotifications[category] || [];
                if (categoryNotifs.length === 0) return null;

                const isExpanded = expandedStacks[category];
                const displayCount = isExpanded ? categoryNotifs.length : 1;
                const unreadInCategory = categoryNotifs.filter(n => !n.read).length;

                return (
                  <div key={category} className="space-y-4">
                    <button
                      onClick={() => toggleStack(category)}
                      {...(isExpanded ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
                      className="w-full flex items-center justify-between px-2 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 group-hover:text-slate-300 transition-colors">
                          {category}
                        </span>
                        {unreadInCategory > 0 && (
                          <div className="w-1.5 h-1.5 bg-indigo-500 sq-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-700">{categoryNotifs.length}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-700" /> : <ChevronDown className="w-3 h-3 text-slate-700" />}
                      </div>
                    </button>

                    <div className="space-y-3 relative">
                      {!isExpanded && categoryNotifs.length > 1 && (
                        <>
                          <div className="absolute top-2 left-2 right-2 h-full bg-black/40 sq-xl -z-10 border border-white/5 translate-y-2 scale-[0.98]" />
                          <div className="absolute top-4 left-4 right-4 h-full bg-black/20 sq-xl -z-20 border border-white/5 translate-y-4 scale-[0.96]" />
                        </>
                      )}

                      {categoryNotifs.slice(0, displayCount).map((notification, index) => {
                        const animProps = {
                          style: {
                            '--anim-delay': `${index * 50}ms`,
                            '--z-index': 100 - index
                          } as React.CSSProperties
                        };
                        return (
                          <div
                            key={notification.id}
                            {...animProps}
                            className={`p-6 sq-xl border transition-all duration-500 group relative overflow-hidden cursor-pointer active:scale-[0.98] animate-in fade-in slide-in-from-right-4 fill-mode-both [animation-delay:var(--anim-delay)] z-[var(--z-index)] ${notification.read
                              ? 'bg-black border-white/5'
                              : 'bg-black border-indigo-500/30 shadow-lg shadow-indigo-500/5 hover:border-indigo-500/50'
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onNotificationClick?.(notification);
                              if (!notification.read) onMarkAsRead?.(notification.id);
                            }}
                          >
                            {notification.priority === 'high' && !notification.read && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 blur-[80px] opacity-10 -mr-16 -mt-16" />
                            )}
                            {!notification.read && notification.priority !== 'high' && (
                              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 blur-[80px] opacity-10 -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" />
                            )}

                            <div className="flex gap-4 relative z-10">
                              <div className={`w-12 h-12 sq-md flex items-center justify-center shrink-0 border border-white/5 transition-all duration-500 ${notification.read ? 'bg-white/5 text-slate-600' : (notification.priority === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400 shadow-inner')}`}>
                                {getIcon(notification.type)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className={`text-sm font-black tracking-tight leading-tight ${notification.read ? 'text-slate-500' : 'text-slate-100'}`}>
                                    {notification.title}
                                  </h4>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 whitespace-nowrap pt-1">
                                    {formatTime(notification.timestamp)}
                                  </span>
                                </div>

                                <p className={`text-xs mt-2 leading-relaxed font-bold tracking-tight ${notification.read ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {notification.message}
                                </p>

                                {notification.priority === 'high' && !notification.read && (
                                  <div className="mt-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-red-400 sq-full animate-ping" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">
                                      Critical Stability Alert
                                    </span>
                                  </div>
                                )}

                                {notification.action && notification.action.status === 'pending' && (
                                  <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-1">
                                    <Button
                                      size="sm"
                                      className="h-8 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white border-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // This interaction would ideally be passed up via a prop, but for this specific logic
                                        // we might need a dedicated onAction handler in props.
                                        // For now, let's assume onNotificationClick handles actions by checking the payload?
                                        // OR better: we add onAction prop to this component.
                                        // Since we can't change props easily without breaking usage, let's use onNotificationClick with a modified object or similar.
                                        // Actually, let's add the onAction prop to the interface and component.
                                        // WAIT: I cannot change the interface without updating usage in App.tsx (or wherever it's used).
                                        // Let's rely on onNotificationClick handling execution if it detects an action.

                                        // But wait, "No" needs to just dismiss. "Yes" needs to execute.
                                        // Let's modify the onNotificationClick signature or just attach a meta property?
                                        notification.action!.status = 'completed'; // Optimistic update local
                                        onNotificationClick?.(notification); // Pass to parent to execute actual logic
                                      }}
                                    >
                                      Yes, Automate
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 hover:bg-white/5"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        notification.action!.status = 'dismissed';
                                        if (!notification.read) onMarkAsRead?.(notification.id);
                                      }}
                                    >
                                      No, One-time
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
