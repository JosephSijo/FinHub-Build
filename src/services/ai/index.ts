import { AIContext, UserSettings } from '../../types';
import { formatContextForPrompt } from '../../utils/aiUtils';
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
 * Resolves API key - NOW SERVER MANAGED
 */
export const resolveApiKey = (): string | null => {
    // We no longer leak keys to the client.
    return 'server-managed-key';
};

export const askAI = async ({
    userPrompt,
    context,
    settings,
    persona = 'ASSISTANT',
    provider
}: AIRequest): Promise<SAIResponse> => {
    // 1. Identify Provider
    const activeProvider = provider || settings.aiProvider || 'gemini';

    // 2. Prepare Context
    const contextString = formatContextForPrompt(context);
    const brainSummary = context.brainSummary ? `\nIMPORTANT LOCAL CONTEXT:\n${context.brainSummary}\n` : '';
    const fullPrompt = `
${contextString}
${brainSummary}
User Query: ${userPrompt}
  `.trim();

    // 3. Call Unified Backend Proxy
    return await generateCompletion(activeProvider, 'server-managed-key', fullPrompt, persona);
};

/**
 * Validates connectivity
 */
export const validateApiKey = async (provider: string): Promise<SAIResponse> => {
    return await generateCompletion(
        provider,
        'server-managed-key',
        "Respond with only the word 'OK' to verify connectivity.",
        'ASSISTANT'
    );
};


