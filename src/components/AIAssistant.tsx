import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { AIContext, UserSettings } from '../types';
import { askAI } from '../services/ai';
import { formatCurrency } from '../utils/numberFormat';

interface AIAssistantProps {
  currency: string;
  context: AIContext;
  settings: UserSettings;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  currency,
  context,
  settings,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I am your FinHub Assistant. My mission is to help you reach financial freedom using a Security and Growth framework. I've analyzed your financial data—how can I help you today?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Use the new AI Service
      const response = await askAI({
        userPrompt: userMessage,
        context,
        settings,
        persona: 'ARCHITECT' // Chat uses Architect persona
      });

      if (response.text) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      } else if (response.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${response.error}` }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response for demo/offline mode
      const fallbackResponse = generateFallbackResponse(userMessage, context, currency);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: fallbackResponse
        }]);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackResponse = (message: string, context: AIContext, currency: string): string => {
    const lowerMsg = message.toLowerCase();
    const { expenses, incomes, savingsRate, healthScore, goalsCount, activeDebts } = context;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    if (lowerMsg.includes('save') || lowerMsg.includes('savings')) {
      return `To save more money, check your highest expense categories. Your current savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20%! You currently have ${goalsCount} active goals.`;
    }
    if (lowerMsg.includes('spent') || lowerMsg.includes('spending') || lowerMsg.includes('expense')) {
      const topExpense = expenses.length > 0 ? [...expenses].sort((a, b) => b.amount - a.amount)[0] : null;
      return `You've spent a total of ${formatCurrency(totalExpenses, currency)} this month. ${topExpense ? `Your biggest expense was "${topExpense.description}" for ${formatCurrency(topExpense.amount, currency)}.` : "No expenses recorded yet!"}`;
    }
    if (lowerMsg.includes('income') || lowerMsg.includes('earn')) {
      return `Your total income for this period is ${formatCurrency(totalIncome, currency)}. Your net balance is ${formatCurrency(totalIncome - totalExpenses, currency)}.`;
    }
    if (lowerMsg.includes('health') || lowerMsg.includes('score')) {
      return `Your Financial Health Score is ${healthScore}/100. ${healthScore > 70 ? 'Great job! Keep maintaining your low debt-to-income ratio.' : 'We can improve this by reducing high-interest debt and increasing your emergency fund.'}`;
    }
    if (lowerMsg.includes('debt') || lowerMsg.includes('iou') || lowerMsg.includes('borrow')) {
      return `You currently have ${activeDebts} active debts or IOUs. Managing these promptly will help improve your health score.`;
    }
    if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('hey')) {
      return "Hello! I'm your AI Assistant. How can I help you with your finances today? I can analyze your spending, check your savings, or discuss your financial health.";
    }

    return "I'm currently running in offline mode. I can help you analyze your current spending and savings—just ask about your expenses, income, or financial health!";
  };

  const quickQuestions = [
    "How can I save more money?",
    "Analyze my spending habits",
    "What if I reduce dining out by 20%?",
    "How's my financial health?"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col bg-black border-white/5 shadow-2xl overflow-hidden rounded-[32px]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#1C1C1E] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0A84FF] blur-[60px] opacity-10 -mr-16 -mt-16" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0A84FF]/10 rounded-2xl flex items-center justify-center border border-[#0A84FF]/20">
                <Bot className="w-6 h-6 text-[#0A84FF]" />
              </div>
              <div>
                <h3 className="text-balance text-xl text-slate-100">FinHub Assistant</h3>
                <p className="text-label text-[10px] opacity-60">Financial Mentor</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close Assistant"
              className="w-10 h-10 rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          role="log"
          aria-live="polite"
          className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-[24px] ${message.role === 'user'
                  ? 'bg-[#0A84FF] text-white font-bold shadow-lg shadow-[#0A84FF]/20'
                  : 'bg-[#1C1C1E] border border-white/5 text-slate-200'
                  }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-[#0A84FF]" />
                    <span className="text-label text-[8px] opacity-50">Assistant Analysis</span>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-slate-900 border border-white/5 p-4 rounded-[24px]">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4 bg-black">
            <p className="text-label text-[9px] mb-3 opacity-60">Suggested Actions</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(question);
                  }}
                  className="text-[11px] font-bold px-4 py-2 bg-[#1C1C1E] border border-white/5 text-slate-400 rounded-xl hover:bg-[#0A84FF]/10 hover:border-[#0A84FF]/30 hover:text-[#0A84FF] transition-all active:scale-95"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-white/5 bg-[#1C1C1E]">
          <div className="flex flex-col gap-3">
            <Label htmlFor="ai-chat-input" className="sr-only">Message AIAssistant</Label>
            <div className="flex gap-3">
              <Input
                id="ai-chat-input"
                name="message"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask anything about your money..."
                className="h-14 bg-black border-white/5 rounded-2xl focus:ring-1 focus:ring-[#0A84FF]/30 text-slate-100 placeholder:text-slate-700 font-bold px-5"
                disabled={isLoading}
                autoComplete="off"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="h-14 w-14 rounded-2xl bg-[#0A84FF] hover:bg-[#007AFF] text-white shadow-lg shadow-[#0A84FF]/20 transition-all active:scale-90 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-label text-[8px] text-center opacity-40 px-2 leading-relaxed">
              Assistant Analysis in progress // Connection Secure
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
