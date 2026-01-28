import { Router, Request, Response } from 'express';
import z from 'zod';
import fetch from 'node-fetch';

const router = Router();

// Validation Schema
const requestSchema = z.object({
    provider: z.enum(['openai', 'anthropic', 'gemini', 'deepseek', 'perplexity']),
    model: z.string().optional(),
    prompt: z.string().min(1, "Prompt is required"),
    systemPrompt: z.string().optional(),
    // Common parameters
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).optional(),
});

// Helper to get keys safely
const getApiKey = (provider: string): string | undefined => {
    const keyMap: Record<string, string | undefined> = {
        openai: process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
        deepseek: process.env.DEEPSEEK_API_KEY,
        perplexity: process.env.PERPLEXITY_API_KEY,
    };
    return keyMap[provider];
};

// --- Provider Implementations ---

async function callOpenAI(apiKey: string, body: any) {
    const model = body.model || 'gpt-4-turbo'; // Default
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: body.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: body.prompt }
            ],
            temperature: body.temperature ?? 0.7,
            max_tokens: body.maxTokens,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error((data as any).error?.message || 'OpenAI API Error');
    return (data as any).choices[0].message.content;
}

async function callAnthropic(apiKey: string, body: any) {
    const model = body.model || 'claude-3-5-haiku-20241022';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            system: body.systemPrompt || 'You are a helpful assistant.',
            messages: [{ role: 'user', content: body.prompt }],
            max_tokens: body.maxTokens ?? 1024,
            temperature: body.temperature,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error((data as any).error?.message || 'Anthropic API Error');
    return (data as any).content[0].text;
}

async function callGemini(apiKey: string, body: any) {
    const model = body.model || 'gemini-1.5-flash';
    // Google API doesn't use Bearer, it acts via URL param or x-goog-api-key header
    const url = `https://generative-language.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: (body.systemPrompt ? `${body.systemPrompt}\n\n` : '') + body.prompt }]
            }],
            generationConfig: {
                temperature: body.temperature,
                maxOutputTokens: body.maxTokens,
            }
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error((data as any).error?.message || 'Gemini API Error');

    const text = (data as any).candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned empty response');
    return text;
}

async function callDeepSeek(apiKey: string, body: any) {
    // DeepSeek is OpenAI compatible
    const model = body.model || 'deepseek-chat';
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: body.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: body.prompt }
            ],
            temperature: body.temperature ?? 0.7,
            max_tokens: body.maxTokens,
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error((data as any).error?.message || 'DeepSeek API Error');
    return (data as any).choices[0].message.content;
}

async function callPerplexity(apiKey: string, body: any) {
    const model = body.model || 'sonar-small-online';
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: body.systemPrompt || 'You are a helpful assistant.' },
                { role: 'user', content: body.prompt }
            ],
            // Perplexity supports limited params
        }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error((data as any).error?.message || 'Perplexity API Error');
    return (data as any).choices[0].message.content;
}

// --- Main Handler ---

router.post('/generate', async (req: Request, res: Response) => {
    try {
        // 1. Validate Body
        const parsed = requestSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
        }
        const { provider, ...rest } = parsed.data;

        // 2. Get Key
        const apiKey = getApiKey(provider);
        if (!apiKey) {
            // Intentionally vague error to client, but logged on server
            console.error(`Missing API Key for provider: ${provider}`);
            return res.status(500).json({ error: `Server not configured for ${provider}` });
        }

        // 3. Route to Provider
        let text = '';
        switch (provider) {
            case 'openai': text = await callOpenAI(apiKey, rest); break;
            case 'anthropic': text = await callAnthropic(apiKey, rest); break;
            case 'gemini': text = await callGemini(apiKey, rest); break;
            case 'deepseek': text = await callDeepSeek(apiKey, rest); break;
            case 'perplexity': text = await callPerplexity(apiKey, rest); break;
        }

        // 4. Respond
        return res.json({ text });

    } catch (error: any) {
        console.error('AI Proxy Error:', error.message);
        // Scrub key from error message if accidentally included
        let safeError = error.message || 'Internal Server Error';
        return res.status(500).json({ error: safeError });
    }
});

export const aiRouter = router;
