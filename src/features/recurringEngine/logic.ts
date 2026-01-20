import { RecurringRule } from './types';

/**
 * Generates all occurrence dates for a recurring rule between fromDate and toDate.
 * 
 * @param rule The recurring rule definition
 * @param fromDate Start date for generation (inclusive)
 * @param toDate End date for generation (inclusive)
 */
/**
 * Internal helper to find the nth weekday of a given month.
 */
function findNthWeekdayOfMonth(year: number, month: number, nth: number, weekday: number): Date {
    const date = new Date(year, month, 1, 12, 0, 0, 0);

    if (nth > 0) {
        let found = 0;
        while (found < nth) {
            if (date.getDay() === weekday) {
                found++;
            }
            if (found < nth) {
                date.setDate(date.getDate() + 1);
            }
        }
    } else {
        // For nth < 0 (like -1 for last), go to last day of month and work backwards
        date.setMonth(month + 1);
        date.setDate(0);
        let found = 0;
        const absNth = Math.abs(nth);
        while (found < absNth) {
            if (date.getDay() === weekday) {
                found++;
            }
            if (found < absNth) {
                date.setDate(date.getDate() - 1);
            }
        }
    }
    return date;
}

export interface OccurrenceInfo {
    date: Date;
    index: number;
}

export function generateOccurrences(
    rule: RecurringRule,
    fromDate: Date,
    toDate: Date
): OccurrenceInfo[] {
    const occurrences: OccurrenceInfo[] = [];
    const interval = rule.interval || 1;
    let current = new Date(rule.startDate);
    current.setHours(12, 0, 0, 0);

    // Initial Alignment: Ensure 'current' starts at a valid occurrence on or after rule.startDate
    if (rule.frequency === 'monthly') {
        if (rule.nthWeek !== undefined && rule.weekday !== undefined) {
            const first = findNthWeekdayOfMonth(current.getFullYear(), current.getMonth(), rule.nthWeek, rule.weekday);
            if (first < new Date(rule.startDate)) {
                // If the nth weekday of the start month is before startDate, find it in the next interval
                current = findNthWeekdayOfMonth(current.getFullYear(), current.getMonth() + interval, rule.nthWeek, rule.weekday);
            } else {
                current = first;
            }
        } else {
            const targetDay = rule.dayOfMonth || new Date(rule.startDate).getDate();
            const year = current.getFullYear();
            const month = current.getMonth();
            const lastDay = new Date(year, month + 1, 0).getDate();
            const clampedDay = Math.min(targetDay, lastDay);

            current.setDate(clampedDay);
            if (current < new Date(rule.startDate)) {
                current = getNextMonthlyDate(current, targetDay, interval);
            }
        }
    }

    const startLimit = new Date(fromDate);
    startLimit.setHours(12, 0, 0, 0);
    const endLimit = new Date(toDate);
    endLimit.setHours(12, 0, 0, 0);

    const safetyLimit = 2000;
    let count = 0;
    let occurrenceIndex = 1;

    const ruleEndLimit = rule.endDate ? new Date(rule.endDate) : null;
    if (ruleEndLimit) {
        ruleEndLimit.setHours(12, 0, 0, 0);
    }

    while (current <= endLimit && count < safetyLimit) {
        if (ruleEndLimit && current > ruleEndLimit) break;

        if (current >= startLimit) {
            occurrences.push({
                date: new Date(current),
                index: occurrenceIndex
            });
        }

        switch (rule.frequency) {
            case 'daily':
                current.setDate(current.getDate() + interval);
                break;
            case 'weekly':
                current.setDate(current.getDate() + (interval * 7));
                break;
            case 'monthly':
                if (rule.nthWeek !== undefined && rule.weekday !== undefined) {
                    // Correctly move to the nth weekday of the next applicable month
                    const nextMonthTotal = current.getMonth() + interval;
                    current = findNthWeekdayOfMonth(current.getFullYear(), nextMonthTotal, rule.nthWeek, rule.weekday);
                } else {
                    const targetDay = rule.dayOfMonth || new Date(rule.startDate).getDate();
                    current = getNextMonthlyDate(current, targetDay, interval);
                }
                break;
            case 'yearly':
                current.setFullYear(current.getFullYear() + interval);
                break;
            case 'custom':
                current.setDate(current.getDate() + (rule.customIntervalDays || 30));
                break;
            default:
                current.setMonth(current.getMonth() + 1);
        }

        occurrenceIndex++;
        count++;
    }

    return occurrences;
}

function getNextMonthlyDate(current: Date, targetDay: number, interval: number): Date {
    const next = new Date(current);
    next.setDate(1);
    next.setMonth(next.getMonth() + interval);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(targetDay, lastDay));
    return next;
}


/**
 * Deterministic transaction ID generator for duplicate prevention.
 * Returns a valid UUID format derived from the inputs.
 */
export function getOccurrenceId(recurringId: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    const seed = `rec_${recurringId}_${dateStr}`;

    // Create a deterministic hash-like string
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
    }

    // Format as valid UUID (v4-like format but deterministic)
    const h = Math.abs(hash).toString(16).padStart(8, '0');
    const rId = recurringId.replace(/-/g, '').substring(0, 12);

    // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // We use the hash for the first 8 chars, and parts of recurringId for the rest
    return `${h}-4444-4000-8000-${rId.padStart(12, '0')}`;
}
