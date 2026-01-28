import { AIPersona, SYSTEM_PROMPTS } from './prompts';

export interface SAIResponse {
    text: string;
    error?: string;
}

/**
 * Unified Backend Call
 * All logic about API keys, headers, and specific URL endpoints resides on the server.
 */
export const generateCompletion = async (
    provider: string,
    _unusedApiKey: string, // Kept for signature compatibility but ignored
    prompt: string,
    persona: AIPersona = 'ASSISTANT'
): Promise<SAIResponse> => {

    // We strictly use the backend proxy now.
    // The apiKey arg is intentionally ignored because keys are now server-side.

    const systemPrompt = SYSTEM_PROMPTS[persona];

    try {
        const response = await fetch('/api/ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                provider,       // 'openai', 'anthropic', 'gemini', 'deepseek', 'perplexity'
                prompt,
                systemPrompt,
                // Optional defaults (can be overridden by settings later if needed)
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Server returns { error: "..." }
            throw new Error(data.error || `Server Error ${response.status}`);
        }

        return { text: data.text };

    } catch (error: any) {
        console.error('AI Service Error:', error.message);

        let msg = error.message || 'Failed to reach AI Server.';

        // Friendly mapping for common server errors
        if (msg.includes('Server not configured')) {
            msg = `Please configure the server-side API key for ${provider}.`;
        } else if (msg.includes('Connectivity Issue') || msg.includes('Failed to fetch')) {
            msg = "Could not connect to the local secure server. Ensure 'npm run server' is running.";
        }

        return { text: '', error: msg };
    }
};

