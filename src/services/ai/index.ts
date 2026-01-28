import { AIContext, UserSettings } from '../../types';
import { formatContextForPrompt } from '../../utils/aiUtils';
import { api } from '../../utils/api';
import { AIPersona } from './prompts';
import { generateCompletion, SAIResponse } from './providers';

export interface AIRequest {
    userPrompt: string;
    context: AIContext;
    settings: UserSettings;
    persona?: AIPersona;
    provider?: string; // Optional override
}

/**
 * Resolves API key from UserSettings or Environment Variables
 * Precedence: Settings (Saved) > ENV (System)
 */
export const resolveApiKey = (provider: string, settings: UserSettings): string | null => {
    // 1. Check Settings
    const settingKey = settings.apiKeys?.[provider as keyof typeof settings.apiKeys];
    if (settingKey && settingKey.trim() !== "") return settingKey;

    // 2. Check ENV Variables
    const envKeyName = `VITE_${provider.toUpperCase()}_API_KEY`;
    const envKey = import.meta.env[envKeyName];
    if (envKey && envKey.trim() !== "") return envKey;

    return null;
};

export const askAI = async ({
    userPrompt,
    context,
    settings,
    persona = 'ASSISTANT',
    provider
}: AIRequest): Promise<SAIResponse> => {
    // 1. Identify Provider & Key
    // Default to what's in settings, or the first available key if auto-detecting
    const activeProvider = provider || detectActiveProvider(settings);

    if (!activeProvider) {
        return {
            text: '',
            error: 'No AI Provider configured. Please add an API Key in Settings.'
        };
    }

    const apiKey = resolveApiKey(activeProvider, settings);

    if (!apiKey) {
        return {
            text: '',
            error: `Missing API Key for ${activeProvider}. Please check Settings or ENV.`
        };
    }

    // 2. Prepare Context (Guru Brain - Structured JSON)
    const contextString = formatContextForPrompt(context);
    const brainSummary = context.brainSummary ? `\nIMPORTANT LOCAL CONTEXT:\n${context.brainSummary}\n` : '';
    const fullPrompt = `
${contextString}
${brainSummary}
User Query: ${userPrompt}
  `.trim();

    // 3. Call Backend Proxy (Preferred) or Provider directly
    // 3. Call Backend Proxy (Preferred) or Provider directly
    if (activeProvider === 'gemini') {
        try {
            const response = await api.chat(userPrompt, context);
            if (!response.error) return response;
            console.warn("Backend AI failed, falling back to local...", response.error);
        } catch (e) {
            console.warn("Backend AI unavailable, falling back to local...", e);
        }
    }

    // 4. Fallback to Local Provider call
    return await generateCompletion(activeProvider, apiKey, fullPrompt, persona);
};

/**
 * Validates an API key by sending a minimal test request
 */
export const validateApiKey = async (provider: string, apiKey: string): Promise<SAIResponse> => {
    return await generateCompletion(
        provider,
        apiKey,
        "Respond with only the word 'OK' to verify connectivity.",
        'ASSISTANT'
    );
};

const detectActiveProvider = (settings: UserSettings): string | null => {
    // 1. Honor user's selected provider if it has a key (Setting or ENV)
    if (settings.aiProvider && resolveApiKey(settings.aiProvider, settings)) {
        return settings.aiProvider;
    }

    // 2. Fallback to first available key in preference order
    const providers = ['openai', 'anthropic', 'gemini', 'deepseek', 'perplexity'];
    for (const p of providers) {
        if (resolveApiKey(p, settings)) return p;
    }

    return null;
};
