/**
 * Haptic Feedback Utility
 * provides standardized vibration patterns for user interactions.
 */

export const Haptics = {
    /**
     * Subtle tick for data point transitions or small interactions (2ms)
     */
    light: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(2);
        }
    },

    /**
     * Standard success/selection pop (20ms)
     */
    selection: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(20);
        }
    },

    /**
     * Success sequence (two quick pulses)
     */
    success: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate([10, 30, 10]);
        }
    },

    /**
     * Medium pulse for long-press or significant actions (40ms)
     */
    medium: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(40);
        }
    },

    /**
     * Warning/Error sequence (long-short-long)
     */
    warning: () => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate([50, 100, 50]);
        }
    }
};
