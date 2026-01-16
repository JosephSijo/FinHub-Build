/**
 * Hybrid Budget Calculation v1.1 Logic
 */

export const budgetsLogic = {
    /**
     * Calculate Stress Factor (SF) based on Obligation Ratio (OR)
     */
    calculateStressFactor(fo: number, mi: number): number {
        if (mi === 0) return 0.60;
        const or = fo / mi;
        if (or <= 0.30) return 1.00;
        if (or <= 0.50) return 0.90;
        if (or <= 0.70) return 0.75;
        return 0.60;
    },

    /**
     * Calculate Habit Share for a category
     */
    calculateHabitShare(avgSpend_c: number, avgVarSpend: number): number {
        if (avgVarSpend === 0) return 0.02;
        const share = avgSpend_c / avgVarSpend;
        return Math.min(Math.max(share, 0.02), 0.40);
    },

    /**
     * Get SSR (Safe-to-Spend Ratio)
     */
    calculateSSR(safeToSpendGlobal: number, mi: number, fo: number, sr: number): number {
        const nsp = mi - fo - sr;
        const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const daysLeft = totalDays - new Date().getDate() + 1;

        const expectedSafeToSpendToday = nsp * (daysLeft / totalDays);
        if (expectedSafeToSpendToday <= 0) return 0.60;

        return Math.min(Math.max(safeToSpendGlobal / expectedSafeToSpendToday, 0.60), 1.00);
    },

    /**
     * Base Limit calculation
     */
    calculateBaseLimit(nsp: number, habitShare: number, stressFactor: number): number {
        return nsp * habitShare * stressFactor;
    },

    /**
     * Projection for a category
     */
    calculateProjection(spentSoFar: number, daysPassed: number, totalDays: number): number {
        if (daysPassed === 0) return spentSoFar;
        const dailyRate = spentSoFar / daysPassed;
        return dailyRate * totalDays;
    },

    /**
     * Determine if a category is "Discretionary"
     * For now, based on dummy list or keywords.
     */
    isDiscretionary(categoryName: string): boolean {
        const discretionaryKeywords = [
            'entertainment', 'dining', 'out', 'shopping', 'leisure',
            'hobby', 'gift', 'travel', 'dress', 'luxury', 'movie'
        ];
        const name = categoryName.toLowerCase();
        return discretionaryKeywords.some(kw => name.includes(kw));
    },

    /**
     * Calculate Gap
     */
    calculateGap(projectedSpend: number, adjustedLimit: number): number {
        return projectedSpend - adjustedLimit;
    }
};
