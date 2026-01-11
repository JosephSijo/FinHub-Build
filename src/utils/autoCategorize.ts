

// Map common keywords to categories
const KEYWORD_MAP: Record<string, string> = {
    // Subscriptions & Service Providers
    'netflix': 'Subscription',
    'spotify': 'Subscription',
    'google': 'Subscription',
    'apple': 'Subscription',
    'icloud': 'Subscription',
    'youtube': 'Subscription',
    'disney': 'Subscription',
    'hotstar': 'Subscription',
    'prime video': 'Subscription',
    'prime membership': 'Subscription',
    'amazon prime': 'Subscription',
    'audible': 'Subscription',
    'kindle': 'Subscription',
    'hulu': 'Subscription',
    'hbomax': 'Subscription',
    'hbo': 'Subscription',
    'paramount+': 'Subscription',
    'peacock': 'Subscription',
    'crunchyroll': 'Subscription',
    'chaisai': 'Subscription',
    'google play': 'Subscription',
    'google one': 'Subscription',
    'app store': 'Subscription',
    'microsoft': 'Subscription',
    'office 365': 'Subscription',
    'dropbox': 'Subscription',
    'zoom': 'Subscription',
    'canva': 'Subscription',
    'adobe': 'Subscription',
    'creative cloud': 'Subscription',

    // Telecom & Broadband ISPs
    'jio': 'Subscription',
    'airtel': 'Subscription',
    'vodafone': 'Subscription',
    'idea': 'Subscription',
    'bsnl': 'Subscription',
    'vi ': 'Subscription',
    'broadband': 'Subscription',
    'isp': 'Subscription',
    'act fiber': 'Subscription',
    'hathway': 'Subscription',
    'internet bill': 'Subscription',
    'telecom': 'Subscription',

    // Food & Dining
    'coffee': 'Food & Dining',
    'starbucks': 'Food & Dining',
    'cafe': 'Food & Dining',
    'restaurant': 'Food & Dining',
    'lunch': 'Food & Dining',
    'dinner': 'Food & Dining',
    'pizza': 'Food & Dining',
    'burger': 'Food & Dining',
    'mcdonalds': 'Food & Dining',
    'kfc': 'Food & Dining',
    'food': 'Food & Dining',
    'zomato': 'Food & Dining',
    'swiggy': 'Food & Dining',
    'beer': 'Food & Dining',
    'bar': 'Food & Dining',

    // Transportation
    'uber': 'Transportation',
    'ola': 'Transportation',
    'cab': 'Transportation',
    'taxi': 'Transportation',
    'bus': 'Transportation',
    'train': 'Transportation',
    'metro': 'Transportation',
    'fuel': 'Transportation',
    'petrol': 'Transportation',
    'gas': 'Transportation',
    'parking': 'Transportation',

    // Shopping
    'amazon': 'Shopping',
    'flipkart': 'Shopping',
    'clothes': 'Shopping',
    'zara': 'Shopping',
    'nike': 'Shopping',
    'shoes': 'Shopping',
    'mall': 'Shopping',

    // Groceries
    'grocery': 'Groceries',
    'supermarket': 'Groceries',
    'vegetables': 'Groceries',
    'fruits': 'Groceries',
    'milk': 'Groceries',

    // Bills & Utilities (Non-Telecom)
    'electricity': 'Bills & Utilities',
    'water': 'Bills & Utilities',
    'gas bill': 'Bills & Utilities',
    'rent': 'Bills & Utilities',
    'maintenance': 'Bills & Utilities',

    // Entertainment (General)
    'movie': 'Entertainment',
    'cinema': 'Entertainment',
    'game': 'Entertainment',
    'steam': 'Entertainment',
    'playstation': 'Entertainment',
    'xbox': 'Entertainment',

    // Health
    'doctor': 'Health & Wellbeing',
    'medical': 'Health & Wellbeing',
    'pharmacy': 'Health & Wellbeing',
    'medicine': 'Health & Wellbeing',
    'gym': 'Health & Wellbeing',
    'fitness': 'Health & Wellbeing',
    'hospital': 'Health & Wellbeing',
    'transfer': 'Transfer',
    'payment': 'Transfer',
    'cc bill': 'Transfer',
    'internal': 'Transfer',
    'membership': 'Subscription',
    'subscription': 'Subscription',
    'recurring': 'Subscription',
    'premium': 'Subscription',
    'monthly bill': 'Subscription'
};

export interface SubscriptionService {
    keywords: string[];
    displayName: string;
    defaultAmount: number;
    category: string;
}

export const SUBSCRIPTION_DB: SubscriptionService[] = [
    // Streaming (Video)
    { keywords: ['netflix'], displayName: 'Netflix Premium', defaultAmount: 649, category: 'Subscription' },
    { keywords: ['hotstar', 'disney'], displayName: 'Disney+ Hotstar', defaultAmount: 299, category: 'Subscription' }, // Monthly Super
    { keywords: ['prime video', 'amazon prime'], displayName: 'Amazon Prime', defaultAmount: 299, category: 'Subscription' }, // Monthly
    { keywords: ['hulu'], displayName: 'Hulu', defaultAmount: 650, category: 'Subscription' }, // Approx convert or standard
    { keywords: ['youtube', 'yt premium'], displayName: 'YouTube Premium', defaultAmount: 129, category: 'Subscription' },
    { keywords: ['sonyliv'], displayName: 'SonyLIV', defaultAmount: 299, category: 'Subscription' },
    { keywords: ['zee5'], displayName: 'Zee5', defaultAmount: 100, category: 'Subscription' }, // various plans
    { keywords: ['jiocinema'], displayName: 'JioCinema Premium', defaultAmount: 99, category: 'Subscription' }, // Monthly
    { keywords: ['apple tv'], displayName: 'Apple TV+', defaultAmount: 99, category: 'Subscription' },

    // Streaming (Audio)
    { keywords: ['spotify'], displayName: 'Spotify Premium', defaultAmount: 119, category: 'Subscription' },
    { keywords: ['apple music'], displayName: 'Apple Music', defaultAmount: 99, category: 'Subscription' }, // Voice/Student/Indiv mix
    { keywords: ['audible'], displayName: 'Audible', defaultAmount: 199, category: 'Subscription' },
    { keywords: ['wynk'], displayName: 'Wynk Music', defaultAmount: 49, category: 'Subscription' },
    { keywords: ['gaana'], displayName: 'Gaana Plus', defaultAmount: 99, category: 'Subscription' },
    { keywords: ['jiosaavn'], displayName: 'JioSaavn Pro', defaultAmount: 99, category: 'Subscription' },

    // Tech & AI
    { keywords: ['google one', 'google storage'], displayName: 'Google One', defaultAmount: 130, category: 'Subscription' }, // 100GB
    { keywords: ['chatgpt', 'openai'], displayName: 'ChatGPT Plus', defaultAmount: 1999, category: 'Subscription' }, // $20 approx
    { keywords: ['claude', 'anthropic'], displayName: 'Claude Pro', defaultAmount: 1999, category: 'Subscription' },
    { keywords: ['github'], displayName: 'GitHub Copilot', defaultAmount: 830, category: 'Subscription' }, // $10 approx
    { keywords: ['midjourney'], displayName: 'Midjourney', defaultAmount: 830, category: 'Subscription' }, // Basic
    { keywords: ['canva'], displayName: 'Canva Pro', defaultAmount: 499, category: 'Subscription' },
    { keywords: ['adobe', 'creative cloud'], displayName: 'Adobe CC', defaultAmount: 2300, category: 'Subscription' }, // Photography plan ish

    // Telecom & ISP (Estimates)
    { keywords: ['jio', 'myjio'], displayName: 'Jio Mobile', defaultAmount: 299, category: 'Subscription' }, // Common 28d
    { keywords: ['airtel'], displayName: 'Airtel Mobile', defaultAmount: 299, category: 'Subscription' },
    { keywords: ['vi ', 'vodafone'], displayName: 'Vi Mobile', defaultAmount: 299, category: 'Subscription' },
    { keywords: ['act fiber', 'act net'], displayName: 'ACT Fibernet', defaultAmount: 820, category: 'Bills & Utilities' }, // Basic + Tax
    { keywords: ['hathway'], displayName: 'Hathway Broadband', defaultAmount: 600, category: 'Bills & Utilities' },
];

export const isKnownSubscription = (description: string): boolean => {
    const desc = description.toLowerCase();
    return SUBSCRIPTION_DB.some(service =>
        service.keywords.some(k => desc.includes(k))
    );
};

export const autoCategorize = (description: string): {
    category: string;
    tags: string[];
    suggestedAmount?: number;
    suggestedDescription?: string;
} | null => {
    const normalizedDesc = description.toLowerCase();

    // 1. Check Precise Subscription DB first (Highest Priority)
    for (const service of SUBSCRIPTION_DB) {
        if (service.keywords.some(k => normalizedDesc.includes(k))) {
            const tags = ['subscription', 'online'];
            return {
                category: service.category,
                tags,
                suggestedAmount: service.defaultAmount,
                suggestedDescription: service.displayName
            };
        }
    }

    // 2. Fallback to General Keyword Map
    // Find category based on keywords
    for (const [keyword, category] of Object.entries(KEYWORD_MAP)) {
        if (normalizedDesc.includes(keyword)) {
            // Find tags (optional simple implementation)
            const tags = [];
            if (normalizedDesc.includes('online')) tags.push('online');
            if (normalizedDesc.includes('subscription')) tags.push('subscription');

            return { category, tags };
        }
    }

    return null;
};
