// Utility for handling touch gestures

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export function useSwipeGesture(
  element: HTMLElement | null,
  options: SwipeGestureOptions
) {
  if (!element) return;

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  const threshold = options.threshold || 50;
  const timeThreshold = 300; // ms

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startTime = Date.now();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const endTime = Date.now();

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;

    // Only trigger if swipe is fast enough
    if (deltaTime > timeThreshold) return;

    // Determine if horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          options.onSwipeRight?.();
        } else {
          options.onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          options.onSwipeDown?.();
        } else {
          options.onSwipeUp?.();
        }
      }
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

// Pull to refresh handler
export function usePullToRefresh(
  element: HTMLElement | null,
  onRefresh: () => Promise<void>
) {
  if (!element) return;

  let startY = 0;
  let isPulling = false;
  let refreshTriggered = false;

  const handleTouchStart = (e: TouchEvent) => {
    // Only allow pull to refresh at top of page
    if (element.scrollTop === 0) {
      startY = e.touches[0].clientY;
      isPulling = true;
      refreshTriggered = false;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;

    // If pulling down at top of page
    if (deltaY > 0 && element.scrollTop === 0) {
      e.preventDefault();
      
      // Visual feedback could be added here
      if (deltaY > 100 && !refreshTriggered) {
        refreshTriggered = true;
      }
    }
  };

  const handleTouchEnd = async () => {
    if (refreshTriggered) {
      await onRefresh();
    }
    isPulling = false;
    refreshTriggered = false;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd);

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

// Edge swipe detection for menus
export function useEdgeSwipe(
  onLeftEdgeSwipe: () => void,
  onRightEdgeSwipe: () => void,
  edgeThreshold: number = 20
) {
  let startX = 0;

  const handleTouchStart = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;

    // Left edge swipe (swipe right from left edge)
    if (startX < edgeThreshold && deltaX > 50) {
      onLeftEdgeSwipe();
      startX = window.innerWidth; // Prevent multiple triggers
    }

    // Right edge swipe (swipe left from right edge)
    if (startX > window.innerWidth - edgeThreshold && deltaX < -50) {
      onRightEdgeSwipe();
      startX = 0; // Prevent multiple triggers
    }
  };

  document.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchmove', handleTouchMove);

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
  };
}
