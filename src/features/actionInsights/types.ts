export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ActionInsight {
    categoryId: string;
    categoryName: string;
    message: string;
    gap: number;
    cutPerDay: number;
    severity: InsightSeverity;
}
