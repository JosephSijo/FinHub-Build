
export type PacingStatus = 'safe' | 'warning' | 'danger';

/**
 * Calculates the budget pacing status based on income, expenses, and current day of the month.
 * 
 * Logic:
 * - Safe (Teal): Spending is on track (spending ratio <= time ratio)
 * - Warning (Yellow): Pacing too fast (spending ratio > time ratio)
 * - Danger (Red): Over budget (spending ratio >= 1.0)
 */
export const getBudgetPacingStatus = (
    totalIncome: number,
    totalExpenses: number
): PacingStatus => {
    if (totalIncome === 0) {
        return totalExpenses > 0 ? 'danger' : 'safe';
    }

    const spendingRatio = totalExpenses / totalIncome;

    // If already spent more than income, it's over budget
    if (spendingRatio >= 1.0) return 'danger';

    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const monthProgress = currentDay / daysInMonth;

    // If spending ratio is significantly higher than month progress (e.g. > 10% buffer?), 
    // let's stick to simple "faster than time" for now as per "Pacing too fast".
    if (spendingRatio > monthProgress) return 'warning';

    return 'safe';
};

/**
 * Returns the Tailwind CSS classes for the dynamic halo effect based on status.
 */
export const getHaloClasses = (status: PacingStatus): string => {
    switch (status) {
        case 'safe':
            return 'shadow-[0_0_20px_rgba(20,184,166,0.6)] ring-2 ring-emerald-400/50 transition-all duration-500';
        case 'warning':
            return 'shadow-[0_0_20px_rgba(234,179,8,0.6)] ring-2 ring-yellow-400/50 transition-all duration-500';
        case 'danger':
            return 'shadow-[0_0_20px_rgba(244,63,94,0.6)] ring-2 ring-rose-400/50 transition-all duration-500';
        default:
            return '';
    }
};
