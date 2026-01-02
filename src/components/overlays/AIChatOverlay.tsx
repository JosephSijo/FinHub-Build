import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ArrowUp } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { askAI } from '@/services/ai';
import { AIContext } from '@/types';

interface AIChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    context: AIContext;
    settings: any;
}

export const AIChatOverlay: React.FC<AIChatOverlayProps> = ({ isOpen, onClose, context, settings }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ text: string, type: 'ai' | 'user' }[]>([
        { text: "Hello! I've analyzed your cash flow. How can I assist with your goals?", type: 'ai' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { text: userMsg, type: 'user' }]);
        setIsLoading(true);

        try {
            // Call AI Service
            // We use a simplified call here fitting the UI demo logic provided by user
            // In real app, we use strict prompt engineering
            const response = await askAI({
                userPrompt: userMsg,
                context: context,
                settings,
                persona: 'ANALYST'
            });

            setMessages(prev => [...prev, { text: response.text || "I'm analyzing that...", type: 'ai' }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Connection error. Please try again.", type: 'ai' }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div id="ai-chat-overlay" className="fixed inset-0 bg-[#020408] z-[200] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50" />
            {/* Header */}
            <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                        <Sparkles className="text-indigo-400 w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-black text-2xl text-white tracking-tight leading-none">AI Analyst</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Neural Core Context</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close Chat"
                    className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white text-slate-400 transition-all active:scale-95"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div id="chat-messages" className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "p-4 rounded-[24px] text-sm leading-relaxed",
                            msg.type === 'ai'
                                ? "bg-slate-900 border border-white/5 text-slate-200 self-start max-w-[85%]"
                                : "bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-600/20 self-end max-w-[85%]"
                        )}
                    >
                        {msg.type === 'ai' && (
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3 h-3 text-indigo-400 font-black" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Guru Analysis</span>
                            </div>
                        )}
                        {msg.text}
                    </div>
                ))}
                {isLoading && (
                    <div className="p-4 bg-slate-900 border border-white/5 rounded-[24px] self-start animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0ms]" />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:150ms]" />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-8 flex gap-3 p-2 bg-slate-900/40 rounded-[28px] border border-white/5 relative z-10">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask the analyst..."
                    className="flex-1 bg-transparent border-none px-6 py-4 text-white focus:outline-none placeholder:text-slate-600 font-bold"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    aria-label="Send Message"
                    className="w-14 h-14 bg-indigo-600 rounded-[22px] flex items-center justify-center shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <ArrowUp className="w-6 h-6 text-white group-hover:-translate-y-1 transition-transform" />
                </button>
            </div>
            <p className="text-[9px] font-bold text-slate-600 text-center uppercase tracking-widest mt-4">
                Encryption Verified // Neural Fabric Link Stable
            </p>
        </div>
    );
};
