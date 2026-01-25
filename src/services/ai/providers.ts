import { AIPersona, SYSTEM_PROMPTS } from './prompts';

export interface SAIResponse {
    text: string;
    error?: string;
}

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = import.meta.env.VITE_ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1/models';
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const PERPLEXITY_API_URL = import.meta.env.VITE_PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions';

/**
 * Scrubs API keys from error messages to prevent leakage in logs
 */
const scrubError = (error: any, key?: string): string => {
    let msg = error.message || 'Failed to generate response.';

    // Check for common connectivity/CORS issues
    if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        msg = `Connectivity Issue: Unable to reach the AI server. (Details: ${error.message}). This usually indicates a CORS blockage, an ad-blocker, or local network restriction.`;
    }

    // Check for version/model errors
    if (msg.includes('404') || msg.toLowerCase().includes('model not found') || msg.toLowerCase().includes('not exist') || msg.toLowerCase().includes('unsupported model')) {
        const modelInfo = error.modelName ? ` (Model: ${error.modelName})` : '';
        const triedInfo = error.triedModels ? ` (Tried: ${error.triedModels.join(', ')})` : '';
        msg = `AI Version/Model Error${modelInfo}${triedInfo}. The model might be deprecated or your API key lacks access. We attempted fallbacks but none succeeded.`;
    }

    // Handle specific permission errors
    if (msg.toLowerCase().includes('permission') || msg.includes('403')) {
        msg = `API Key Permission Error: Your key is valid but does not have the necessary permissions for this model/service.`;
    }

    // Handle rate limits or quota issues
    if (msg.includes('429') || msg.toLowerCase().includes('too many requests') || msg.toLowerCase().includes('quota')) {
        msg = "AI Capacity Reached: Your API quota is exhausted or the provider is rate-limiting requests. Please check your billing/usage console.";
    }

    if (key) {
        // Replace all occurrences of the key with asterisks
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reg = new RegExp(escapedKey, 'g');
        msg = msg.replace(reg, '***REDACTED***');
    }
    // Also scrub common URL patterns that might contain keys
    msg = msg.replace(/key=[a-zA-Z0-9_-]+/g, 'key=***REDACTED***');
    msg = msg.trim();
    return msg;
};

export const generateCompletion = async (
    provider: string,
    apiKey: string,
    prompt: string,
    persona: AIPersona = 'ASSISTANT'
): Promise<SAIResponse> => {
    if (!apiKey) {
        return { text: '', error: 'API key is missing. Please configure it in Settings.' };
    }

    const systemPrompt = SYSTEM_PROMPTS[persona];

    try {
        switch (provider) {
            case 'openai':
                return await callOpenAI(apiKey, prompt, systemPrompt);
            case 'anthropic':
                return await callAnthropic(apiKey, prompt, systemPrompt);
            case 'gemini':
                return await callGemini(apiKey, prompt, systemPrompt);
            case 'deepseek':
                return await callDeepSeek(apiKey, prompt, systemPrompt);
            case 'perplexity':
                return await callPerplexity(apiKey, prompt, systemPrompt);
            default:
                return { text: '', error: 'Unsupported provider.' };
        }
    } catch (error: any) {
        const scrubbedMsg = scrubError(error, apiKey);
        console.error('AI Service Error (Scrubbed):', scrubbedMsg);
        return { text: '', error: scrubbedMsg };
    }
};

const callOpenAI = async (key: string, userPrompt: string, systemPrompt: string): Promise<SAIResponse> => {
    const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini', // Cost effective
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'OpenAI API Error');
    return { text: data.choices[0].message.content };
};

const callAnthropic = async (key: string, userPrompt: string, systemPrompt: string): Promise<SAIResponse> => {
    // Claude 3.5 Haiku is the latest efficient model
    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 1024,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Anthropic API Error');
    return { text: data.content[0].text };
};

const callGemini = async (key: string, userPrompt: string, systemPrompt: string): Promise<SAIResponse> => {
    // List of models to try in order of preference (latest to fallback)
    const models = [
        'gemini-3-flash-preview',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
    ];

    let lastError: any = null;

    for (const model of models) {
        try {
            const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${key}`;
            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Client': 'gl-js/0.0.0'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `${systemPrompt}\n\nUser Question: ${userPrompt}` }]
                    }]
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const status = response.status;
                const errorMsg = errorData.error?.message || response.statusText;

                // If model not found or invalid request (potentially unsupported model), try next model
                if (status === 404 || status === 400 || errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('unsupported')) {
                    console.warn(`Gemini Model ${model} failed, trying next...`, errorMsg);
                    const err = new Error(errorMsg);
                    Object.assign(err, { status, modelName: model, triedModels: models });
                    lastError = err;
                    continue;
                }

                const err = new Error(errorMsg);
                Object.assign(err, { status, modelName: model });
                throw err;
            }

            const data = await response.json();
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error("Gemini returned an empty response. Check safety filters or prompt.");
            }

            return { text: data.candidates[0].content.parts[0].text };
        } catch (err: any) {
            lastError = err;
            if (!err.modelName) Object.assign(err, { modelName: model, triedModels: models });

            // Only continue for specific model errors, rethrow others (like auth or generic network)
            if (err.message?.toLowerCase().includes('not found') || err.message?.includes('404') || err.message?.toLowerCase().includes('unsupported')) {
                continue;
            }
            throw err;
        }
    }

    throw lastError || new Error("All Gemini fallback models failed.");
};

const callDeepSeek = async (key: string, userPrompt: string, systemPrompt: string): Promise<SAIResponse> => {
    // DeepSeek is OpenAI Compatible
    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.7,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'DeepSeek API Error');
    return { text: data.choices[0].message.content };
};

const callPerplexity = async (key: string, userPrompt: string, systemPrompt: string): Promise<SAIResponse> => {
    // Perplexity is OpenAI Compatible
    const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
            model: 'sonar-small-online',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Perplexity API Error');
    return { text: data.choices[0].message.content };
};
