import React from 'react';
import { Coffee, Car, ShoppingBag, Sparkles, Smartphone, Heart, GraduationCap, Plane, ShoppingCart, CreditCard, Repeat, Users, Home, TrendingUp, DollarSign } from 'lucide-react';

export const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
        'Food & Dining': <Coffee className="w-5 h-5" />,
        'Transport': <Car className="w-5 h-5" />,
        'Shopping': <ShoppingBag className="w-5 h-5" />,
        'Entertainment': <Sparkles className="w-5 h-5" />,
        'Bills & Utilities': <Smartphone className="w-5 h-5" />,
        'Healthcare': <Heart className="w-5 h-5" />,
        'Education': <GraduationCap className="w-5 h-5" />,
        'Travel': <Plane className="w-5 h-5" />,
        'Groceries': <ShoppingCart className="w-5 h-5" />,
        'Personal Care': <Sparkles className="w-5 h-5" />,
        'EMI': <CreditCard className="w-5 h-5" />,
        'Subscription': <Repeat className="w-5 h-5" />,
        'Personal IOU': <Users className="w-5 h-5" />,
        'Debt Payment': <Users className="w-5 h-5" />, // Legacy support
        'Other': <Home className="w-5 h-5" />,
    };
    return iconMap[category] || <Home className="w-5 h-5" />;
};

export const getIncomeIcon = (source: string) => {
    if (source.toLowerCase().includes('salary')) {
        return <DollarSign className="w-5 h-5" />;
    }
    if (source.toLowerCase().includes('freelance')) {
        return <TrendingUp className="w-5 h-5" />;
    }
    if (source.toLowerCase().includes('investment')) {
        return <TrendingUp className="w-5 h-5" />;
    }
    return <DollarSign className="w-5 h-5" />;
};
