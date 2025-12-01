import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;

    if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
    setStartY(0);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
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
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
            />
          </motion.div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {isRefreshing
              ? 'Refreshing...'
              : pullDistance >= threshold
              ? 'Release to refresh'
              : 'Pull to refresh'}
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
