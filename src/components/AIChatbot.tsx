"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, User, RotateCcw } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface AIChatbotProps {
  disputes?: Record<string, unknown>[];
}

const SUGGESTED_QUESTIONS = [
  "Summarize active disputes",
  "How does DAO voting work?",
  "What happens after voting ends?",
  "Who is eligible to vote?",
];

export function AIChatbot({ disputes }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          context: { disputes },
        }),
      });

      const data = await res.json();

      if (data.success && data.response) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content:
            "Network error — couldn't reach the chat service. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const formatBotMessage = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\n/g, "<br/>");
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isOpen
            ? "bg-zinc-800 hover:bg-zinc-700 rotate-0"
            : "bg-[#ef233c] hover:bg-red-700 shadow-[#ef233c]/30 hover:shadow-[#ef233c]/50 hover:scale-110"
        }`}
        aria-label={isOpen ? "Close chat" : "Open DAO Assistant"}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        } bottom-22 right-5 w-[calc(100vw-40px)] sm:w-[400px] max-h-[min(550px,calc(100vh-120px))] flex flex-col rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="w-9 h-9 rounded-xl bg-[#ef233c]/10 border border-[#ef233c]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#ef233c]" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white font-[var(--font-heading)]">
              DAO Assistant
            </h3>
            <p className="text-[10px] text-zinc-500">
              Ask about disputes, voting & more
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "380px" }}>
          {messages.length === 0 && !loading && (
            <div className="py-6 text-center">
              <Bot className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-4">
                Hi! I can help you understand DAO Court disputes and voting.
              </p>
              <div className="space-y-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/10 transition-all"
                  >
                    <Sparkles className="w-3 h-3 inline mr-1.5 text-[#ef233c]" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                  msg.role === "user"
                    ? "bg-[#ef233c]/10"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-[#ef233c]" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </div>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#ef233c]/15 text-zinc-200 rounded-tr-md"
                    : "bg-white/[0.04] border border-white/[0.06] text-zinc-400 rounded-tl-md"
                }`}
              >
                {msg.role === "bot" ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: formatBotMessage(msg.content),
                    }}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="px-4 py-3 border-t border-white/10 bg-white/[0.02]"
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about DAO Court..."
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#ef233c]/30 focus:ring-1 focus:ring-[#ef233c]/20 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#ef233c] hover:bg-red-700 disabled:bg-zinc-800 disabled:text-zinc-600 flex items-center justify-center text-white transition-all disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
