
import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { getQuoteOfTheDay } from '../data/financial-quotes';
import { Button } from './ui/button';
// import { motion } from 'motion/react';
import { AIContext, UserSettings } from '../types';
import { askAI } from '../services/ai';

interface QuoteOfTheDayProps {
  onDismiss?: () => void;
  context: AIContext;
  settings: UserSettings;
}

interface QuoteData {
  text: string;
  author: string;
  category: string;
}

export function QuoteOfTheDay({ onDismiss, context, settings }: QuoteOfTheDayProps) {
  const [quote, setQuote] = useState<QuoteData | null>(null);

  useEffect(() => {
    loadQuote();
  }, [settings.apiKeys]);

  const loadQuote = async () => {
    // 1. Check Cache (One quote per day)
    const today = new Date().toDateString();
    const cached = localStorage.getItem('daily_ai_quote');

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today && parsed.data && parsed.data.text) {
          setQuote(parsed.data);
          return;
        }
      } catch (e) {
        localStorage.removeItem('daily_ai_quote');
      }
    }

    // 2. Try AI Generation
    const hasKey = settings.apiKeys && Object.values(settings.apiKeys).some(k => !!k);

    if (hasKey) {
      try {
        const response = await askAI({
          userPrompt: "Generate a short, impactful financial quote based on my current status.",
          context,
          settings,
          persona: 'MOTIVATOR'
        });

        if (response.text && response.text.length > 5) {
          const newQuote = {
            text: response.text.replace(/"/g, ''),
            author: "FinHub Coach",
            category: "Personalized"
          };

          setQuote(newQuote);
          localStorage.setItem('daily_ai_quote', JSON.stringify({ date: today, data: newQuote }));
          return;
        }
      } catch (err) {
        console.error("Failed to fetch AI quote", err);
      }
    }

    // 3. Fallback to Static
    setQuote(getQuoteOfTheDay());
  };

  if (!quote) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-1 shadow-lg group animate-in slide-in-from-top-4 fade-in duration-700"
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

      <div className="relative bg-white/10 backdrop-blur-sm rounded-[10px] p-3 sm:p-4 border border-white/10">
        <div className="absolute top-[-50%] right-[-10%] p-10 opacity-20 pointer-events-none">
          <Sparkles className="w-32 h-32 text-white animate-pulse" style={{ animationDuration: '3s' }} />
        </div>

        <div className="relative flex items-center gap-4">
          {/* Icon */}
          <div className="hidden sm:flex flex-shrink-0 h-10 w-10 items-center justify-center rounded-lg bg-white/20 shadow-inner">
            <Sparkles className="h-5 w-5 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 mr-8">
            <p className="text-white font-medium text-sm sm:text-base leading-relaxed italic">
              "{quote.text}"
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">
                {quote.author}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                {quote.category.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Dismiss */}
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="absolute top-0 right-0 -mt-1 -mr-1 text-indigo-100 hover:text-white hover:bg-white/20 rounded-lg h-8 w-8 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
