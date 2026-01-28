// <reference lib="deno.ns" />
import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Security: Restrict CORS to specific origins
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://finhub-beta.vercel.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Use a sanitized logger
app.use('*', logger((str: string) => {
  console.log(`[API] ${str}`);
}));

// ===== AI DISPATCHER =====
app.post('/server', async (c: Context) => {
  try {
    const payload = await c.req.json();
    const { action } = payload;

    switch (action) {
      case 'categorize':
        return await handleCategorize(c, payload);
      case 'chat':
        return await handleChat(c, payload);
      case 'dashboard-feedback':
        return await handleDashboardFeedback(c, payload);
      default:
        return c.json({ success: false, error: 'Unknown AI action' }, 400);
    }
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ===== AI HANDLERS =====

// Smart categorization suggestion
const handleCategorize = async (c: Context, payload: any) => {
  try {
    const { description } = payload;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return c.json({ success: false, error: 'Gemini API key not configured' }, 500);
    }

    const response = await fetch(
      `https://generative-language.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Given this transaction description: "${description}", suggest a single category and up to 3 relevant tags. Respond ONLY with a JSON object in this exact format: {"category": "CategoryName", "tags": ["tag1", "tag2", "tag3"]}. 
          
          Valid categories: Food & Dining, Transport, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Groceries, Personal Care, Salary, Freelance, Investment, Gift, Other.
          
          Keep tags short, lowercase, and descriptive.`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        return c.json({ success: true, suggestion });
      }
    }

    return c.json({ success: true, suggestion: { category: 'Other', tags: [] } });
  } catch (error) {
    console.log(`Error in AI categorization: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
};

// AI Finance Guru chat
const handleChat = async (c: Context, payload: any) => {
  try {
    const { message, context } = payload;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return c.json({ success: false, error: 'Gemini API key not configured' }, 500);
    }

    const systemPrompt = `You are a friendly, supportive AI Finance Guru helping users manage their personal finances. Be encouraging, provide actionable advice, and use simple language. 
    
    User's financial context:
    - Total Income: ${context.totalIncome || 0}
    - Total Expenses: ${context.totalExpenses || 0}
    - Active Debts: ${context.activeDebts || 0}
    - Savings Goals: ${context.goalsCount || 0}
    - Recent transactions: ${JSON.stringify(context.recentTransactions || [])}
    
    Provide specific, personalized advice based on this data.`;

    const response = await fetch(
      `https://generative-language.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser question: ${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const reply = data.candidates[0].content.parts[0].text;
      return c.json({ success: true, reply });
    }

    return c.json({ success: false, error: 'No response from AI' }, 500);
  } catch (error) {
    console.log(`Error in AI chat: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
};

// Generate dashboard AI feedback
const handleDashboardFeedback = async (c: Context, payload: any) => {
  try {
    const { context } = payload;
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    if (!apiKey) {
      return c.json({ success: false, error: 'Gemini API key not configured' }, 500);
    }

    const prompt = `Based on this user's financial data, generate a short, encouraging motivational tip (max 2 sentences):
    - Total Income: ${context.totalIncome || 0}
    - Total Expenses: ${context.totalExpenses || 0}
    - Spending percentage: ${context.spendingPercentage || 0}%
    - Recent category: ${context.topCategory || 'N/A'}
    
    Make it personal, actionable, and positive.`;

    const response = await fetch(
      `https://generative-language.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 150
          }
        })
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const feedback = data.candidates[0].content.parts[0].text;
      return c.json({ success: true, feedback });
    }

    return c.json({ success: true, feedback: 'Keep up the great work tracking your finances! 💪' });
  } catch (error) {
    console.log(`Error generating dashboard feedback: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
};

// Export for Deno serve
Deno.serve(app.fetch);
