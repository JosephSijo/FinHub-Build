import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { AIContext } from '../types';
import { api } from '../utils/api';

interface AIAssistantProps {
  userId: string;
  context: AIContext;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  userId,
  context,
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Finance Guru 💰 I can help you analyze your spending, create budgets, and answer questions about your finances. What would you like to know?"
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
      const response = await api.chat(userMessage, context);
      
      if (response.success && response.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment." 
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please make sure your API key is configured correctly." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "How can I save more money?",
    "Analyze my spending habits",
    "What if I reduce dining out by 20%?",
    "How's my financial health?"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3>AI Finance Guru</h3>
                <p className="text-xs opacity-90">Your personal financial advisor</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">AI Guru</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputMessage(question);
                  }}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your finances..."
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={isLoading || !inputMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
