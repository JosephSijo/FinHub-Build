export type SuggestionType =
    | 'category_guess'
    | 'subscription_detected'
    | 'bill_risk'
    | 'overspend_warning'
    | 'optimize_transfer'
    | 'goal_recommendation';

export type SuggestionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SuggestionStatus = 'new' | 'seen' | 'dismissed' | 'accepted';
export type SuggestionSource = 'rule' | 'ai' | 'hybrid';

export interface SmartSuggestion {
    id: string;
    user_id: string;
    type: SuggestionType;
    title: string;
    message: string;
    severity: SuggestionSeverity;
    action: {
        type: string;
        payload: any;
    };
    source: SuggestionSource;
    status: SuggestionStatus;
    catalog_entity_id: string | null;
    created_at: string;
    expires_at: string | null;
    template_key: string | null;
}
