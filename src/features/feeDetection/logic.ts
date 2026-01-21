import { FeeRule, TransactionInput, FeeAlert } from './types';

/**
 * Check if a string contains any of the keywords (case-insensitive)
 */
function containsKeyword(text: string | undefined, keywords: string[] | undefined): boolean {
    if (!text || !keywords || keywords.length === 0) return false;
<<<<<<< HEAD
    
=======

>>>>>>> Antigravity
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

/**
 * Detect if a transaction matches a fee rule
 */
function matchesRule(transaction: TransactionInput, rule: FeeRule): boolean {
    // Only evaluate if payment method matches
    if (transaction.payment_method !== rule.applies_payment_method) {
        return false;
    }

    // Category match (if rule specifies category)
    if (rule.category_id && transaction.category_id !== rule.category_id) {
        return false;
    }

    // Keyword match: merchant_name OR note OR external_service
    const merchantMatch = containsKeyword(transaction.merchant_name, rule.merchant_keywords);
    const noteMatch = containsKeyword(transaction.note, rule.note_keywords);
    const serviceMatch = containsKeyword(transaction.external_service, rule.merchant_keywords);

    return merchantMatch || noteMatch || serviceMatch;
}

/**
 * Format fee alert message
 */
function formatFeeMessage(
    transaction: TransactionInput,
    estimatedFee: number,
    currency: string = '₹'
): string {
    const service = transaction.merchant_name || transaction.external_service || 'this service';
    const feeAmount = `${currency}${Math.round(estimatedFee)}`;
<<<<<<< HEAD
    
=======

>>>>>>> Antigravity
    return `Possible extra charges for this card transaction via ${service}. Estimated fee ~${feeAmount}. Consider UPI/bank transfer.`;
}

/**
 * Detect fees for a transaction based on active rules
 */
export function detectFees(
    transaction: TransactionInput,
    rules: FeeRule[],
    currency: string = '₹'
): FeeAlert | null {
    // Only check card transactions
    if (transaction.payment_method !== 'CARD') {
        return null;
    }

    // Find matching rules (prioritize by severity)
    const activeRules = rules.filter(r => r.is_active);
    const matchingRules = activeRules.filter(rule => matchesRule(transaction, rule));

    if (matchingRules.length === 0) {
        return null;
    }

    // Sort by severity (CRITICAL > WARN > INFO)
    const severityOrder = { 'CRITICAL': 0, 'WARN': 1, 'INFO': 2 };
    matchingRules.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const topRule = matchingRules[0];
    const estimatedFee = transaction.amount * (topRule.estimated_fee_percent / 100);

    return {
        severity: topRule.severity,
        message: formatFeeMessage(transaction, estimatedFee, currency),
        estimated_fee: estimatedFee,
        rule_name: topRule.name
    };
}

/**
 * Check if fee alert should be shown on dashboard
 */
export function shouldShowOnDashboard(alert: FeeAlert, threshold: number = 100): boolean {
    return alert.severity === 'CRITICAL' || alert.estimated_fee > threshold;
}

export const feeDetectionLogic = {
    detectFees,
    shouldShowOnDashboard
};
