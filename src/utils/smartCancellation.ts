import { RecurringTransaction } from '../types';

export interface CancellationStrategy {
    optimalDate: Date;
    reason: string;
    urgency: 'low' | 'medium' | 'high';
    savings: number;
    message: string;
    actionType: 'wait' | 'cancel_now' | 'monitor';
}

export function getCancellationStrategy(
    sub: RecurringTransaction,
    today: Date = new Date()
): CancellationStrategy | null {
    // Only applicable for active subscriptions
    if (sub.kind !== 'subscription' || (sub.status !== 'active' && sub.status !== 'cancellation_pending')) {
        return null;
    }

    // Default to 'end_of_cycle' if no meta provided
    const policy = sub.cancellationMeta?.policy || 'end_of_cycle';
    const graceDays = sub.cancellationMeta?.graceDays || 0; // Days you get to keep after paying? OR Days before renewal you must cancel?
    // Usually "Grace" in this context = "Safety Margin" user wants.
    // Let's interpret graceDays as "Days BEFORE billing to cancel safely"

    // Safety margin for timezone/gateways
    const safetyMargin = 1;

    // Calculate Next Billing Date
    const nextBillingDate = getNextBillingDate(sub, today);
    const monthlyCost = sub.amount;

    // -- LOGIC ENGINE --

    // CASE A: End of Cycle (Netflix, Spotify)
    // You keep access until the billing period ends.
    // Goal: Cancel anytime, but ideally "Set and Forget".
    // BUT: "Smart" advice is often "Cancel Now" to not forget, since you keep access.
    // HOWEVER: User request says "Avoid next charge... Not 'cancel now', but 'cancel smart'".
    // Wait, if I cancel Netflix today, I keep access until Feb 28.
    // Maybe "Smart" means: "If you are unsure, wait. If you decide to cancel, do it by X".
    if (policy === 'end_of_cycle') {
        const cutoffDate = addDays(nextBillingDate, -(graceDays + safetyMargin));
        const daysUntilCutoff = getDaysDiff(today, cutoffDate);

        // If cutoff is today or passed, URGENT
        if (daysUntilCutoff <= 2) {
            return {
                optimalDate: today,
                reason: 'Renewal Imminent',
                urgency: 'high',
                savings: monthlyCost,
                message: `Cancel IMMEDIATELY to avoid ${sub.amount} charge on ${formatDate(nextBillingDate)}.`,
                actionType: 'cancel_now'
            };
        }

        return {
            optimalDate: cutoffDate,
            reason: 'Maximize Decision Window',
            urgency: 'low',
            savings: monthlyCost,
            message: `You have until ${formatDate(cutoffDate)} to cancel safely.`,
            actionType: 'wait'
        };
    }

    // CASE B: Immediate Termination (some Pro tools, Gyms sometimes)
    // Canceling kills access instantly. 
    // Goal: Use it until the last possible moment.
    if (policy === 'immediate') {
        const cutoffDate = addDays(nextBillingDate, -(graceDays + safetyMargin));
        // Ideally we'd look at usage, but for now purely time-based maximization:
        return {
            optimalDate: cutoffDate,
            reason: 'Retain Access',
            urgency: 'medium',
            savings: monthlyCost,
            message: `Cancel on ${formatDate(cutoffDate)} to keep access as long as possible.`,
            actionType: 'monitor'
        };
    }

    // CASE C: Prorated (Refunds)
    // Cancel anytime -> money back.
    // Strategy: If not using, cancel NOW to get max refund.
    if (policy === 'prorated') {
        // Check usage (mocked/simple for now)
        const lastUsed = sub.lastUsedAt ? new Date(sub.lastUsedAt) : null;
        const daysSinceUse = lastUsed ? getDaysDiff(lastUsed, today) : 30;

        if (daysSinceUse > 7) {
            return {
                optimalDate: today,
                reason: 'Unused / Prorated Refund',
                urgency: 'high',
                savings: monthlyCost, // Rough estimate, actually specific portion
                message: `Refund available! Cancel now to recover funds.`,
                actionType: 'cancel_now'
            };
        }

        return {
            optimalDate: today, // Placeholder
            reason: 'Monitor Usage',
            urgency: 'low',
            savings: 0,
            message: 'Usage detected recently. Keep monitoring.',
            actionType: 'monitor'
        };
    }

    return null;
}

// --- Helpers ---

function getNextBillingDate(sub: RecurringTransaction, today: Date): Date {
    // Simple monthly logic for MVP
    // Ideally this comes from a robust recurrence engine
    const start = new Date(sub.startDate);
    const day = sub.dueDay || start.getDate();

    let next = new Date(today.getFullYear(), today.getMonth(), day);
    if (next < today) {
        next = new Date(today.getFullYear(), today.getMonth() + 1, day);
    }
    return next;
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function getDaysDiff(start: Date, end: Date): number {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
