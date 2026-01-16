import { generateOccurrences } from './logic';
import { RecurringRule } from './types';

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function testDaily() {
    console.log('Testing Daily...');
    const rule: RecurringRule = {
        id: '1',
        startDate: '2024-01-01',
        frequency: 'daily',
        amount: 100,
        type: 'expense' as const,
        accountId: 'a1',
        category: 'c1',
        tags: [],
        createdAt: new Date().toISOString()
    };
    const from = new Date('2024-01-01T12:00:00Z');
    const to = new Date('2024-01-03T12:00:00Z');
    const results = generateOccurrences(rule, from, to);
    assert(results.length === 3, `Expected 3 occurrences, got ${results.length}`);
    assert(results[0].toISOString().startsWith('2024-01-01'), 'First occurrence date mismatch');
    assert(results[2].toISOString().startsWith('2024-01-03'), 'Last occurrence date mismatch');
}

function testMonthlyClamping() {
    console.log('Testing Monthly Clamping (31st)...');
    const rule: RecurringRule = {
        id: '1',
        startDate: '2024-01-31',
        frequency: 'monthly',
        dayOfMonth: 31,
        amount: 100,
        type: 'expense' as const,
        accountId: 'a1',
        category: 'c1',
        tags: [],
        createdAt: new Date().toISOString()
    };
    const from = new Date('2024-01-31T12:00:00Z');
    const to = new Date('2024-03-31T12:00:00Z');
    const results = generateOccurrences(rule, from, to);
    // Jan 31, Feb 29 (leap year 2024), Mar 31
    assert(results.length === 3, `Expected 3 occurrences, got ${results.length}`);
    assert(results[1].getDate() === 29, `Feb date should be 29, got ${results[1].getDate()}`);
}

function testNthWeekday() {
    console.log('Testing Nth Weekday (2nd Friday)...');
    const rule: RecurringRule = {
        id: '1',
        startDate: '2024-01-01',
        frequency: 'monthly',
        nthWeek: 2,
        weekday: 5, // Friday
        amount: 100,
        type: 'expense' as const,
        accountId: 'a1',
        category: 'c1',
        tags: [],
        createdAt: new Date().toISOString()
    };
    const from = new Date('2024-01-01T12:00:00Z');
    const to = new Date('2024-02-29T12:00:00Z');
    const results = generateOccurrences(rule, from, to);
    // Jan 2024: 1st is Mon. Fri are 5, 12, 19, 26. 2nd Fri is Jan 12.
    // Feb 2024: 1st is Thu. Fri are 2, 9, 16, 23. 2nd Fri is Feb 9.
    assert(results.length === 2, `Expected 2 occurrences, got ${results.length}`);
    assert(results[0].getDate() === 12, `Jan 2nd Fri should be 12, got ${results[0].getDate()}`);
    assert(results[1].getDate() === 9, `Feb 2nd Fri should be 9, got ${results[1].getDate()}`);
}

async function runTests() {
    try {
        testDaily();
        testMonthlyClamping();
        testNthWeekday();
        console.log('All tests passed!');
    } catch (error: any) {
        console.error('Tests failed!');
        console.error(error);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

runTests();
