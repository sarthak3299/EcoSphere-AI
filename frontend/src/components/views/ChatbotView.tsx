"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "@/services/api";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Bot,
  User,
  ArrowRight,
  MessageSquare
} from "lucide-react";

interface Message {
  sender: "user" | "bot";
  text: string;
}

const CHIPS = [
  "How can I reduce food waste?",
  "How do I use the Carbon Simulator?",
  "Tell me how to earn Eco Points",
  "How do I upload utility bills?"
];

export default function ChatbotView() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: "bot", text: "Hello! I'm EcoBot AI, your personal environmental intelligence assistant. I can suggest custom footprint goals, help you run simulations, or explain how to submit reports. What can I help you with today?" }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    // Add user message
    const userMsg: Message = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      // API payload requires history formatted as schemas.ChatMessage
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.ai.sendMessage(historyPayload, text);
      
      setMessages((prev) => [...prev, { sender: "bot", text: res.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { sender: "bot", text: "Sorry, I ran into a network issue trying to connect to my brain. Please try again in a second!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    handleSendMessage(chipText);
  };

  return (
    <div className="relative bg-gradient-to-b from-white to-emerald-50/30 rounded-3xl border border-slate-200/60 shadow-xl shadow-emerald-950/5 h-[78vh] flex flex-col overflow-hidden animate-fade-in">
      
      {/* Ambient background glow elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-teal-400/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Bot Chat Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 flex items-center justify-between shrink-0 shadow-md border-b border-emerald-800/25 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 text-emerald-950 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-400/20 relative animate-pulse">
            <Bot className="w-5 h-5 text-emerald-950" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-950" />
          </div>
          <div>
            <h3 className="font-black text-white text-sm tracking-wide flex items-center gap-1.5">
              <span>EcoBot AI</span>
              <span className="bg-emerald-500/20 text-emerald-400 font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Online</span>
            </h3>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-current" />
              <span>Gemini Intelligence Assistant</span>
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (confirm("Are you sure you want to reset your conversation?")) {
              setMessages([messages[0]]);
            }
          }}
          className="text-emerald-300 hover:text-white text-[11px] font-black bg-emerald-800/30 hover:bg-emerald-800/50 px-3 py-1.5 rounded-xl border border-emerald-700/20 transition-all active:scale-95"
        >
          Reset Chat
        </button>
      </div>

      {/* Messages Feed panel */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 relative z-10 scrollbar-thin scrollbar-thumb-slate-200">
        {messages.map((msg, idx) => {
          const isBot = msg.sender === "bot";
          return (
            <div 
              key={idx} 
              className={`flex items-end gap-3 max-w-[82%] ${isBot ? "self-start" : "self-end flex-row-reverse ml-auto"} animate-fade-in`}
            >
              {/* Avatar indicator */}
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-xs border shadow-sm transition ${
                isBot 
                  ? "bg-emerald-600 border-emerald-500 shadow-emerald-600/10" 
                  : "bg-slate-800 border-slate-700 shadow-slate-800/10"
              }`}>
                {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message bubble */}
              <div className={`p-4 rounded-2xl text-[12px] leading-relaxed shadow-sm transition-all duration-200 hover:shadow-md ${
                isBot 
                  ? "bg-white border border-emerald-100 text-slate-800 rounded-bl-xs" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-br-xs border border-emerald-500/25"
              }`}>
                <p className="whitespace-pre-line font-medium leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex items-end gap-3 max-w-[80%] self-start animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 border border-emerald-500 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 bg-white border border-emerald-100 rounded-2xl rounded-tl-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              <span className="text-[10px] text-slate-400 font-bold ml-2">EcoBot is analyzing...</span>
            </div>
          </div>
        )}
        
        <div ref={scrollRef} />
      </div>

      {/* Suggestion Chips Panel */}
      {messages.length === 1 && (
        <div className="px-6 py-3 border-t border-slate-100/60 shrink-0 flex flex-wrap gap-2.5 justify-center bg-slate-50/50 backdrop-blur-xs z-10">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleChipClick(chip)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-2xl text-[10px] font-black text-slate-700 hover:text-emerald-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-emerald-900/5 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{chip}</span>
              <ArrowRight className="w-3 h-3 shrink-0 text-slate-400" />
            </button>
          ))}
        </div>
      )}

      {/* Input controls footer */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-white z-10">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputVal); }}
          className="flex gap-2.5 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask EcoBot anything about environmental impact, goals, calculations..."
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-5 py-3.5 outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 shadow-inner transition-all focus:ring-2 focus:ring-emerald-500/10"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
