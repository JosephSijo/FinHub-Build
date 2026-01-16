import { generateOccurrences } from './logic';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, 'debug.log');
function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

log('Testing Daily...');
const ruleDaily: any = {
    id: '1',
    startDate: '2024-01-01',
    frequency: 'daily',
    amount: 100,
    type: 'expense',
    accountId: 'a1',
    category: 'c1',
    tags: [],
    createdAt: new Date().toISOString()
};
const fromDaily = new Date('2024-01-01T12:00:00Z');
const toDaily = new Date('2024-01-03T12:00:00Z');
const resultsDaily = generateOccurrences(ruleDaily, fromDaily, toDaily);
log(`Daily Results length: ${resultsDaily.length}`);
resultsDaily.forEach((r, i) => log(`  ${i}: ${r.toISOString()}`));

log('Testing Monthly Clamping (31st)...');
const ruleMonthly: any = {
    id: '1',
    startDate: '2024-01-31',
    frequency: 'monthly',
    dayOfMonth: 31,
    amount: 100,
    type: 'expense',
    accountId: 'a1',
    category: 'c1',
    tags: [],
    createdAt: new Date().toISOString()
};
const fromMonthly = new Date('2024-01-31T12:00:00Z');
const toMonthly = new Date('2024-03-31T12:00:00Z');
const resultsMonthly = generateOccurrences(ruleMonthly, fromMonthly, toMonthly);
log(`Monthly Results length: ${resultsMonthly.length}`);
resultsMonthly.forEach((r, i) => log(`  ${i}: ${r.toISOString()}`));

log('Testing Nth Weekday (2nd Friday)...');
const ruleNth: any = {
    id: '1',
    startDate: '2024-01-01',
    frequency: 'monthly',
    nthWeek: 2,
    weekday: 5, // Friday
    amount: 100,
    type: 'expense',
    accountId: 'a1',
    category: 'c1',
    tags: [],
    createdAt: new Date().toISOString()
};
const fromNth = new Date('2024-01-01T12:00:00Z');
const toNth = new Date('2024-02-29T12:00:00Z');
const resultsNth = generateOccurrences(ruleNth, fromNth, toNth);
log(`Nth Results length: ${resultsNth.length}`);
resultsNth.forEach((r, i) => log(`  ${i}: ${r.toISOString()}`));
