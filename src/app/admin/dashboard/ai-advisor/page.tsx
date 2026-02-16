"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Bot, User, Sparkles, Crown } from "lucide-react";

export default function AdminAIAdvisorPage() {
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Jambo! I'm your SmartChama AI Advisor. I can help you with:\n\n• Creating and managing chamas\n• Inviting members with secure links\n• M-Pesa deposits and withdrawals\n• Loan eligibility and terms\n• Investment opportunities (SmartGrow)\n• Analytics and performance tracking\n\nWhat would you like to know about SmartChama?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const playVoice = async (text: string) => {
    // Voice playback disabled - requires 11Labs API key
    // To enable: Add ELEVENLABS_API_KEY to .env.local and configure /api/voice endpoint
    return;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      if (data.reply) {
        const aiMsg = { role: "assistant", content: data.reply };
        setMessages(prev => [...prev, aiMsg]);
        playVoice(data.reply); 
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-800">
        <div className="size-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20 relative">
          <Bot className="w-6 h-6 text-slate-950" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Crown className="w-3 h-3 text-black" />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Admin AI Advisor <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400">Powered by Gemini & 11Labs</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "user" 
                ? "bg-slate-700" 
                : "bg-amber-900/50 border border-amber-500/30"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-400" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-amber-600 text-white rounded-tr-none" 
                : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="size-8 rounded-full bg-amber-900/50 border border-amber-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-amber-400" />
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about chama management, analytics, or strategy..."
            className="w-full bg-slate-900 border border-slate-800 rounded-full pl-6 pr-24 py-4 text-slate-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button className="p-2.5 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSend}
              className="p-2.5 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors font-bold"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
