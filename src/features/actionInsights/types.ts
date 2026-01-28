export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ActionInsight {
    title: string;
    message: string;
    priority: InsightSeverity;
    type: 'success' | 'warning' | 'info' | 'error';
    actions?: {
        label: string;
        action?: string;
    }[];

    // Legacy support for specific gap analysis
    categoryId?: string;
    categoryName?: string;
    gap?: number;
    cutPerDay?: number;
}
