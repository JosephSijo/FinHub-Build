

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

export const autoCategorize = (description: string): { category: string; tags: string[] } | null => {
    const normalizedDesc = description.toLowerCase();

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
