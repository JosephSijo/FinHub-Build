import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { CategoryLimit, BudgetSnapshot } from './types';

const API_BASE = `https://${projectId}.supabase.co/rest/v1`;

const headers = {
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

export const budgetsRepo = {
    async getLimits(userId: string): Promise<CategoryLimit[]> {
        const res = await fetch(`${API_BASE}/category_limits?user_id=eq.${userId}&select=*`, { headers });
        const data = await res.json();
        return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            categoryId: d.category_id,
            period: d.period,
            limitAmount: Number(d.limit_amount),
            warnAtPercent: d.warn_at_percent,
            criticalAtPercent: d.critical_at_percent,
            autoCalculated: d.auto_calculated,
            calculationVersion: d.calculation_version,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        }));
    },

    async upsertLimit(userId: string, limit: Partial<CategoryLimit>): Promise<CategoryLimit> {
        const body = {
            user_id: userId,
            category_id: limit.categoryId,
            period: limit.period || 'monthly',
            limit_amount: limit.limitAmount,
            auto_calculated: limit.autoCalculated ?? true,
            calculation_version: limit.calculationVersion || 'v1.1'
        };

        const res = await fetch(`${API_BASE}/category_limits`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(body)
        });

        const [data] = await res.json();
        return {
            id: data.id,
            userId: data.user_id,
            categoryId: data.category_id,
            period: data.period,
            limitAmount: Number(data.limit_amount),
            warnAtPercent: data.warn_at_percent,
            criticalAtPercent: data.critical_at_percent,
            autoCalculated: data.auto_calculated,
            calculationVersion: data.calculation_version,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    async saveSnapshot(userId: string, snapshot: Omit<BudgetSnapshot, 'id' | 'createdAt'>): Promise<BudgetSnapshot> {
        const body = {
            user_id: userId,
            month: snapshot.month,
            mi: snapshot.mi,
            fo: snapshot.fo,
            sr: snapshot.sr,
            nsp: snapshot.nsp,
            obligation_ratio: snapshot.obligationRatio,
            stress_factor: snapshot.stressFactor,
            ssr: snapshot.ssr
        };

        const res = await fetch(`${API_BASE}/budgets_monthly_snapshot`, {
            method: 'POST',
            headers: {
                ...headers,
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(body)
        });

        const [data] = await res.json();
        return {
            id: data.id,
            userId: data.user_id,
            month: data.month,
            mi: Number(data.mi),
            fo: Number(data.fo),
            sr: Number(data.sr),
            nsp: Number(data.nsp),
            obligationRatio: Number(data.obligation_ratio),
            stressFactor: Number(data.stress_factor),
            ssr: Number(data.ssr),
            createdAt: data.created_at
        };
    }
};
