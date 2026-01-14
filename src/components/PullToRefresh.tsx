import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0 && window.scrollY === 0) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const newDistance = Math.min(distance, threshold * 1.5);

        // Haptic feedback when crossing threshold
        if (newDistance >= threshold && pullDistance < threshold) {
          if (window.navigator.vibrate) window.navigator.vibrate(10);
        }

        setPullDistance(newDistance);
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (element) {
        element.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }

    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center"
        style={{
          height: pullDistance,
          opacity: pullDistance / threshold,
        }}
        animate={{
          y: isRefreshing ? 0 : -threshold,
        }}
      >
        <div className="flex flex-col items-center gap-2 py-4">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : (pullDistance / threshold) * 180,
            }}
            transition={{
              rotate: {
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear',
              },
            }}
          >
            <RefreshCw
              className="w-6 h-6 text-[#0A84FF]"
            />
          </motion.div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">
            {isRefreshing
              ? 'Synchronizing...'
              : pullDistance >= threshold
                ? 'Relinquish to Sync'
                : 'Pull to Synchronize'}
          </span>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{
          y: isRefreshing ? 60 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
