import { supabase } from '../lib/supabase';
import { IOU, IOUPayment, IOUStatus } from './types';
import { iousLogic } from './logic';

/**
 * Fetch all IOUs for the current user
 */
export async function fetchIOUs(userId: string): Promise<IOU[]> {
    const { data, error } = await supabase
        .from('ious')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching IOUs:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch payments for a specific IOU
 */
export async function fetchIOUPayments(iouId: string): Promise<IOUPayment[]> {
    const { data, error } = await supabase
        .from('iou_payments')
        .select('*')
        .eq('iou_id', iouId)
        .order('paid_on', { ascending: false });

    if (error) {
        console.error('Error fetching IOU payments:', error);
        throw error;
    }

    return data || [];
}

/**
 * Add a new IOU
 */
export async function addIOU(userId: string, iou: Omit<IOU, 'id' | 'user_id' | 'created_at' | 'outstanding_amount' | 'status'>): Promise<IOU> {
    const newIOU = {
        ...iou,
        user_id: userId,
        outstanding_amount: iou.principal_amount,
        status: 'OPEN' as IOUStatus
    };

    const { data, error } = await supabase
        .from('ious')
        .insert([newIOU])
        .select()
        .single();

    if (error) {
        console.error('Error adding IOU:', error);
        throw error;
    }

    return data;
}

/**
 * Add a payment to an IOU and update outstanding amount
 */
export async function addPayment(
    userId: string,
    iouId: string,
    payment: Omit<IOUPayment, 'id' | 'user_id' | 'iou_id' | 'created_at'>
): Promise<void> {
    // First, fetch the IOU and its payments
    const iou = await supabase
        .from('ious')
        .select('*')
        .eq('id', iouId)
        .eq('user_id', userId)
        .single();

    if (iou.error) {
        console.error('Error fetching IOU:', iou.error);
        throw iou.error;
    }

    const payments = await fetchIOUPayments(iouId);

    // Add the new payment
    const { error: paymentError } = await supabase
        .from('iou_payments')
        .insert([{
            ...payment,
            iou_id: iouId,
            user_id: userId
        }]);

    if (paymentError) {
        console.error('Error adding payment:', paymentError);
        throw paymentError;
    }

    // Calculate new outstanding amount
    const allPayments = [...payments, { ...payment, amount: payment.amount }];
    const newOutstanding = iousLogic.calculateOutstanding(iou.data.principal_amount, allPayments as IOUPayment[]);
    const newStatus = iousLogic.deriveStatus(iou.data.principal_amount, newOutstanding, allPayments.length > 0);

    // Update the IOU
    const { error: updateError } = await supabase
        .from('ious')
        .update({
            outstanding_amount: newOutstanding,
            status: newStatus
        })
        .eq('id', iouId)
        .eq('user_id', userId);

    if (updateError) {
        console.error('Error updating IOU:', updateError);
        throw updateError;
    }
}

/**
 * Close an IOU (mark as CLOSED or CANCELLED)
 */
export async function closeIOU(userId: string, iouId: string, status: 'CLOSED' | 'CANCELLED'): Promise<void> {
    const { error } = await supabase
        .from('ious')
        .update({ status })
        .eq('id', iouId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error closing IOU:', error);
        throw error;
    }
}

/**
 * Delete an IOU
 */
export async function deleteIOU(userId: string, iouId: string): Promise<void> {
    const { error } = await supabase
        .from('ious')
        .delete()
        .eq('id', iouId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting IOU:', error);
        throw error;
    }
}

export const iousRepo = {
    fetchIOUs,
    fetchIOUPayments,
    addIOU,
    addPayment,
    closeIOU,
    deleteIOU
};
