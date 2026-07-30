"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, Bot, User, Sparkles } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Jambo! I am your SmartChama Advisor. I can help you analyze your savings or suggest investment groups. What's on your mind?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // --- VOICE FUNCTION (11Labs) ---
  const playVoice = async (text: string) => {
    try {
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Audio generation failed");

      // Convert the response to a playable audio blob
      const blob = await response.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch (error) {
      console.error("Voice Playback Error:", error);
    }
  };

  // --- SEND MESSAGE FUNCTION ---
  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add User Message to UI instantly
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true); // Show typing animation

    try {
      // 2. Send to YOUR Backend (Gemini)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();

      // 3. Add AI Response to UI
      if (data.reply) {
        const aiMsg = { role: "assistant", content: data.reply };
        setMessages(prev => [...prev, aiMsg]);
        
        // 4. Speak the response!
        playVoice(data.reply); 
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg = { role: "assistant", content: "Pole! My brain is offline right now. Check your internet." };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false); // Hide typing animation
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-60px)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="size-10 bg-[#22C55E] rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 font-geist" style={{ color: 'var(--text-primary)' }}>
            Chama AI <Sparkles className="w-4 h-4 text-[#22C55E]" />
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Powered by Gemini & 11Labs</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-[#22C55E] text-white" : "bg-emerald-900/20 border border-[#22C55E]/30"}`}>
              {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-[#22C55E]" />}
            </div>
            <div 
              className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-[#22C55E] text-white rounded-tr-none" 
                  : "rounded-tl-none shadow-sm"
              }`}
              style={msg.role === "user" ? {} : {
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="size-8 rounded-full bg-emerald-900/20 border border-[#22C55E]/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce delay-75" style={{ backgroundColor: 'var(--text-muted)' }}></div>
              <div className="w-2 h-2 rounded-full animate-bounce delay-150" style={{ backgroundColor: 'var(--text-muted)' }}></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about loans, savings, or group rules..."
            className="w-full rounded-full pl-6 pr-24 py-4 outline-none focus:border-[#22C55E] transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border)',
              borderWidth: '1px',
              color: 'var(--text-primary)'
            }}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button className="p-2.5 rounded-full transition-colors hover:text-[#22C55E]" style={{ color: 'var(--text-muted)' }}>
              <Mic className="w-5 h-5" />
            </button>
            <button 
              onClick={handleSend}
              className="p-2.5 rounded-full bg-[#22C55E] text-white hover:bg-[#16A34A] transition-colors font-bold shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}