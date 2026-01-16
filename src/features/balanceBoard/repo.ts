import { BalanceBoardData } from './types';

// Map context data to BalanceBoardData
export const mapContextToBalanceBoardData = (context: any): BalanceBoardData => {
    return {
        accounts: context.accounts || [],
        recurringTransactions: context.recurringTransactions || [],
        goals: context.goals || [],
        liabilities: context.liabilities || [],
        settings: context.settings || {}
    };
};
