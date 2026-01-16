import { RecurringRule } from './types';

/**
 * Generates all occurrence dates for a recurring rule between fromDate and toDate.
 * 
 * @param rule The recurring rule definition
 * @param fromDate Start date for generation (inclusive)
 * @param toDate End date for generation (inclusive)
 */
export function generateOccurrences(
    rule: RecurringRule,
    fromDate: Date,
    toDate: Date
): Date[] {
    const occurrences: Date[] = [];
    let current = new Date(rule.startDate);

    // Set time to noon to avoid day-flipping issues with DST/timezones
    current.setHours(12, 0, 0, 0);
    const startLimit = new Date(fromDate);
    startLimit.setHours(12, 0, 0, 0);
    const endLimit = new Date(toDate);
    endLimit.setHours(12, 0, 0, 0);

    const interval = rule.interval || 1;
    const safetyLimit = 2000; // Prevent infinite loops
    let count = 0;

    while (current <= endLimit && count < safetyLimit) {
        if (current >= startLimit) {
            occurrences.push(new Date(current));
        }

        switch (rule.frequency) {
            case 'daily':
                current.setDate(current.getDate() + interval);
                break;

            case 'weekly':
                current.setDate(current.getDate() + (interval * 7));
                break;

            case 'monthly': {
                if (rule.nthWeek !== undefined && rule.weekday !== undefined) {
                    // Handle Nth weekday of month (e.g., 2nd Friday)
                    current = getNextNthWeekday(current, rule.nthWeek, rule.weekday, interval);
                } else {
                    // Handle fixed day of month
                    const targetDay = rule.dayOfMonth || new Date(rule.startDate).getDate();
                    current = getNextMonthlyDate(current, targetDay, interval);
                }
                break;
            }

            case 'yearly':
                current.setFullYear(current.getFullYear() + interval);
                break;

            case 'custom': {
                // Treat custom as daily with customIntervalDays if provided, else default to 30
                const days = rule.customIntervalDays || 30;
                current.setDate(current.getDate() + days);
                break;
            }

            default:
                // Default to monthly if frequency is unrecognized
                current.setMonth(current.getMonth() + 1);
        }

        count++;

        // Break if we have an end date and we passed it
        if (rule.endDate && current > new Date(rule.endDate)) {
            break;
        }
    }

    return occurrences;
}

/**
 * Gets the next date for a fixed day-of-month recurrence, clamping to month end.
 */
function getNextMonthlyDate(current: Date, targetDay: number, interval: number): Date {
    const next = new Date(current);
    const targetMonth = next.getMonth() + interval;

    // Set date to 1 first to avoid overflow when changing month
    // e.g., Jan 31 -> setMonth(1) becomes Mar 2 or 3.
    next.setDate(1);
    next.setMonth(targetMonth);

    const year = next.getFullYear();
    const month = next.getMonth();
    const lastDayOfNextMonth = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(targetDay, lastDayOfNextMonth);

    next.setDate(clampedDay);
    return next;
}

/**
 * Gets the next date for an Nth weekday recurrence (e.g., 2nd Friday).
 */
function getNextNthWeekday(current: Date, nth: number, weekday: number, interval: number): Date {
    const nextMonth = new Date(current);
    nextMonth.setMonth(nextMonth.getMonth() + interval);
    nextMonth.setDate(1); // Start at 1st of the target month

    if (nth > 0) {
        // nth > 0 means "from start of month"
        let found = 0;
        while (found < nth) {
            if (nextMonth.getDay() === weekday) {
                found++;
            }
            if (found < nth) {
                nextMonth.setDate(nextMonth.getDate() + 1);
            }
        }
    } else {
        // nth < 0 means "from end of month" (e.g., -1 for last)
        // Go to last day of month and work backwards
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(0);

        let found = 0;
        const absNth = Math.abs(nth);
        while (found < absNth) {
            if (nextMonth.getDay() === weekday) {
                found++;
            }
            if (found < absNth) {
                nextMonth.setDate(nextMonth.getDate() - 1);
            }
        }
    }

    return nextMonth;
}

/**
 * Deterministic transaction ID generator for duplicate prevention.
 */
export function getOccurrenceId(recurringId: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `rec_gen_${recurringId}_${dateStr}`;
}
