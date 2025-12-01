import React from 'react';
import { Card } from './ui/card';
import { Sparkles } from 'lucide-react';
import { getQuoteOfTheDay } from '../data/financial-quotes';

export function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3>Quote of the Day</h3>
            <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full capitalize">
              {quote.category.replace('-', ' ')}
            </span>
          </div>
          <blockquote className="text-gray-700 dark:text-gray-300 italic mb-2">
            "{quote.text}"
          </blockquote>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            — {quote.author}
          </p>
        </div>
      </div>
    </Card>
  );
}
