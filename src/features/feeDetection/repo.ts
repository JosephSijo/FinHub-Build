import { supabase } from '../../lib/supabase';
import { FeeRule } from './types';

/**
 * Fetch active fee rules for the current user (including global rules)
 */
export async function fetchFeeRules(userId: string): Promise<FeeRule[]> {
    const { data, error } = await supabase
        .from('fee_rules')
        .select('*')
        .eq('is_active', true)
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('severity', { ascending: true }); // CRITICAL first

    if (error) {
        console.error('Error fetching fee rules:', error);
        throw error;
    }

    return data || [];
}

/**
 * Create a custom fee rule for a user
 */
export async function createFeeRule(userId: string, rule: Omit<FeeRule, 'id' | 'user_id' | 'created_at'>): Promise<FeeRule> {
    const { data, error } = await supabase
        .from('fee_rules')
        .insert([{
            ...rule,
            user_id: userId
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating fee rule:', error);
        throw error;
    }

    return data;
}

/**
 * Update a fee rule
 */
export async function updateFeeRule(userId: string, ruleId: string, updates: Partial<FeeRule>): Promise<void> {
    const { error } = await supabase
        .from('fee_rules')
        .update(updates)
        .eq('id', ruleId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating fee rule:', error);
        throw error;
    }
}

/**
 * Delete a fee rule
 */
export async function deleteFeeRule(userId: string, ruleId: string): Promise<void> {
    const { error } = await supabase
        .from('fee_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting fee rule:', error);
        throw error;
    }
}

export const feeDetectionRepo = {
    fetchFeeRules,
    createFeeRule,
    updateFeeRule,
    deleteFeeRule
};
