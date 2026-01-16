import { BalanceBoard } from './balanceBoard';
import { ActionInsightCard } from './actionInsights';
import { BudgetsScreen } from './budgets';
import { IOUReminderCard } from './ious/ui';
import { InstallmentReminderCard } from './iouInstallments/ui';
import { FeeAlertBanner } from './feeDetection/ui';

export const FEATURES = {
    BALANCE_BOARD: {
        enabled: true,
        component: BalanceBoard
    },
    ACTION_INSIGHTS: {
        enabled: true,
        component: ActionInsightCard
    },
    BUDGETS: {
        enabled: true,
        component: BudgetsScreen
    },
    IOUS: {
        enabled: true,
        component: IOUReminderCard
    },
    IOU_INSTALLMENTS: {
        enabled: true,
        component: InstallmentReminderCard
    },
    FEE_DETECTION: {
        enabled: true,
        component: FeeAlertBanner
    }
};

export const isFeatureEnabled = (featureKey: keyof typeof FEATURES) => {
    return FEATURES[featureKey].enabled;
};

export const getFeatureComponent = (featureKey: keyof typeof FEATURES) => {
    return FEATURES[featureKey].component;
};
