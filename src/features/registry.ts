import { BalanceBoard } from './balanceBoard';

export const FEATURES = {
    BALANCE_BOARD: {
        enabled: true,
        component: BalanceBoard
    }
};

export const isFeatureEnabled = (featureKey: keyof typeof FEATURES) => {
    return FEATURES[featureKey].enabled;
};

export const getFeatureComponent = (featureKey: keyof typeof FEATURES) => {
    return FEATURES[featureKey].component;
};
