import { AIPersona, SYSTEM_PROMPTS } from './prompts';

export interface SAIResponse {
    text: string;
    error?: string;
}

const OPENAI_API_URL = import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_API_URL = import.meta.env.VITE_ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';
const GEMINI_API_URL = import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
const DEEPSEEK_API_URL = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';
const PERPLEXITY_API_URL = import.meta.env.VITE_PERPLEXITY_API_URL || 'https://api.perplexity.ai/chat/completions';

/**
 * Scrubs API keys from error messages to prevent leakage in logs
 */
const scrubError = (error: any, key?: string): string => {
    let msg = error.message || 'Failed to generate response.';

    // Check for common connectivity/CORS issues
    if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
        msg = "Connectivity Issue: Unable to reach the AI server. FinHub will transition to 'Cached View' using local intelligence fallback. Please check your internet connection.";
    }

    // Handle rate limits or quota issues
    if (msg.includes('429') || msg.toLowerCase().includes('too many requests')) {
        msg = "AI Capacity Reached: The provider is currently busy or rate-limited. Falling back to local 'Cached View'.";
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
    // Note: Anthropic needs CORS proxy usually from browser, but we'll try direct.
    // Warning: Browser usage of Anthropic API often fails CORS.
    const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true' // Necessary for client-side
        },
        body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
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
    // Using stable v1 endpoint with the latest flash model
    const url = `${GEMINI_API_URL}?key=${key}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${userPrompt}` }]
            }]
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || `Gemini Error ${response.status}: ${response.statusText}`);
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Gemini returned an empty response. Check safety filters or prompt.");
    }

    return { text: data.candidates[0].content.parts[0].text };
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
