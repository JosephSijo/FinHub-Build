/**
 * Shared utility for financial calculations.
 * Ensures consistent math across TransactionForm, LiabilityTab, and other components.
 */

export interface LoanDetails {
    emi: number;
    totalInterest: number;
    totalPayment: number;
    outstanding: number;
}

export interface InvestmentDetails {
    monthlyYield: number;
    totalReturns: number;
    maturityValue: number;
}

/**
 * Calculates EMI, Total Interest, and Total Payment for a loan.
 * USES REDUCING BALANCE METHOD.
 */
export const calculateLoanDetails = (
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDate?: string
): LoanDetails => {
    if (principal <= 0 || tenureMonths <= 0) {
        return { emi: 0, totalInterest: 0, totalPayment: 0, outstanding: 0 };
    }

    const monthlyRate = annualRate / 12 / 100;
    let emi = 0;

    if (monthlyRate === 0) {
        emi = principal / tenureMonths;
    } else {
        emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
            (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    }

    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principal;

    // Calculate outstanding if startDate is provided
    let outstanding = principal;
    if (startDate) {
        const startObj = new Date(startDate);
        const nowObj = new Date();

        if (startObj <= nowObj) {
            const yDiff = nowObj.getFullYear() - startObj.getFullYear();
            const mDiff = nowObj.getMonth() - startObj.getMonth();
            const dDiff = nowObj.getDate() - startObj.getDate();

            let paidCount = yDiff * 12 + mDiff;
            if (dDiff < 0) paidCount--;
            paidCount = Math.max(0, Math.min(paidCount, tenureMonths));

            if (monthlyRate === 0) {
                outstanding = principal - (emi * paidCount);
            } else {
                outstanding = principal * (Math.pow(1 + monthlyRate, tenureMonths) - Math.pow(1 + monthlyRate, paidCount)) /
                    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
            }
        }
    }

    return {
        emi: Number(emi.toFixed(2)),
        totalInterest: Number(totalInterest.toFixed(2)),
        totalPayment: Number(totalPayment.toFixed(2)),
        outstanding: Number(Math.max(0, outstanding).toFixed(2))
    };
};

/**
 * Calculates Monthly Yield and Total Returns for an investment/income stream.
 * USES SIMPLE MONTHLY YIELD LOGIC.
 */
export const calculateInvestmentDetails = (
    principal: number,
    annualRate: number,
    tenureMonths: number
): InvestmentDetails => {
    if (principal <= 0 || tenureMonths <= 0) {
        return { monthlyYield: 0, totalReturns: 0, maturityValue: 0 };
    }

    // Monthly yield (simple interest monthly equivalent)
    const monthlyYield = (principal * (annualRate / 100)) / 12;
    const totalReturns = monthlyYield * tenureMonths;
    const maturityValue = principal + totalReturns;

    return {
        monthlyYield: Number(monthlyYield.toFixed(2)),
        totalReturns: Number(totalReturns.toFixed(2)),
        maturityValue: Number(maturityValue.toFixed(2))
    };
};
