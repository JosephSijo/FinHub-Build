import { supabase } from '../../lib/supabase';
import { DB_TABLES } from '../../repositories/supa';
import { IOUInstallment, EMIPlanInput } from './types';
import { iouInstallmentsLogic } from './logic';
import { iousRepo } from '../ious/repo';
import { IOU } from '../ious/types';

/**
 * Create EMI plan: Creates IOU + generates installments
 */
export async function createEMIPlan(userId: string, plan: EMIPlanInput): Promise<{ iou: IOU; installments: IOUInstallment[] }> {
    // Create the parent IOU
    const iou = await iousRepo.addIOU(userId, {
        direction: 'LENT',
        person_name: plan.person_name,
        contact_phone: plan.contact_phone,
        contact_tag: plan.contact_tag,
        principal_amount: plan.total_amount,
        due_date: plan.first_due_date,
        notes: plan.notes
    });

    // Generate installment schedule
    const installmentSchedule = iouInstallmentsLogic.generateInstallmentSchedule(
        iou.id,
        userId,
        plan
    );

    // Insert installments
    const { data, error } = await supabase
        .from(DB_TABLES.IOU_INSTALLMENTS)
        .insert(installmentSchedule)
        .select();

    if (error) {
        console.error('Error creating installments:', error);
        throw error;
    }

    return { iou, installments: data || [] };
}

/**
 * Fetch all installments for an IOU
 */
export async function fetchInstallments(iouId: string): Promise<IOUInstallment[]> {
    const { data, error } = await supabase
        .from(DB_TABLES.IOU_INSTALLMENTS)
        .select('*')
        .eq('iou_id', iouId)
        .order('sequence_no', { ascending: true });

    if (error) {
        console.error('Error fetching installments:', error);
        throw error;
    }

    return data || [];
}

/**
 * Fetch all pending installments for a user
 */
export async function fetchPendingInstallments(userId: string): Promise<IOUInstallment[]> {
    const { data, error } = await supabase
        .from(DB_TABLES.IOU_INSTALLMENTS)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching pending installments:', error);
        throw error;
    }

    return data || [];
}

/**
 * Mark installment as paid and update IOU outstanding
 */
export async function markInstallmentPaid(
    userId: string,
    installmentId: string,
    paidOn: string
): Promise<void> {
    // Fetch the installment
    const { data: installment, error: fetchError } = await supabase
        .from(DB_TABLES.IOU_INSTALLMENTS)
        .select('*')
        .eq('id', installmentId)
        .eq('user_id', userId)
        .single();

    if (fetchError) {
        console.error('Error fetching installment:', fetchError);
        throw fetchError;
    }

    // Mark installment as paid
    const { error: updateError } = await supabase
        .from(DB_TABLES.IOU_INSTALLMENTS)
        .update({
            status: 'PAID',
            paid_on: paidOn
        })
        .eq('id', installmentId)
        .eq('user_id', userId);

    if (updateError) {
        console.error('Error updating installment:', updateError);
        throw updateError;
    }

    // Add payment to IOU
    await iousRepo.addPayment(userId, installment.iou_id, {
        amount: installment.amount,
        paid_on: paidOn,
        method: 'UPI',
        note: `Installment ${installment.sequence_no} payment`
    });
}

/**
 * Cancel an installment
 */
export async function cancelInstallment(userId: string, installmentId: string): Promise<void> {
    const { error } = await supabase
        .from(DB_TABLES.IOU_INSTALLMENTS)
        .update({ status: 'CANCELLED' })
        .eq('id', installmentId)
        .eq('user_id', userId);

    if (error) {
        console.error('Error cancelling installment:', error);
        throw error;
    }
}

export const iouInstallmentsRepo = {
    createEMIPlan,
    fetchInstallments,
    fetchPendingInstallments,
    markInstallmentPaid,
    cancelInstallment
};
