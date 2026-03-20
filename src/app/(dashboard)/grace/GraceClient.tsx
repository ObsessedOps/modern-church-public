"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Send, TrendingUp, AlertTriangle, Users, Calendar, Heart, Lightbulb, Loader2 } from "lucide-react";
import { ChatMarkdown } from "@/components/ui/ChatMarkdown";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  suggestions?: string[];
}

const suggestedPrompts = [
  { icon: TrendingUp, text: "Who should I check in on this week?" },
  { icon: Users, text: "Which volunteer teams are understaffed or have burnout risk?" },
  { icon: AlertTriangle, text: "Flag members showing signs of disengagement" },
  { icon: Calendar, text: "What life events have been recorded recently?" },
  { icon: Heart, text: "How are our small groups doing? Any health concerns?" },
  { icon: Lightbulb, text: "Give me a full briefing on this week's church health" },
];

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parseSuggestions(text: string): { content: string; suggestions: string[] } {
  const marker = "[SUGGESTIONS]";
  const idx = text.indexOf(marker);
  if (idx === -1) return { content: text.trim(), suggestions: [] };

  const content = text.slice(0, idx).trim();
  const suggestionsBlock = text.slice(idx + marker.length).trim();
  const suggestions = suggestionsBlock
    .split("\n")
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);

  return { content, suggestions };
}

export default function GraceAIPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello, Pastor! I'm **Grace AI**, your church intelligence assistant. I have access to your live church data — attendance, giving, member engagement, alerts, volunteer teams, small groups, and growth tracks.\n\nAsk me anything about your church, or try one of the suggested questions below.",
      timestamp: formatTime(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: formatTime(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/grace/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (res.status === 429) {
        setError("Rate limit reached — please wait a few minutes before trying again.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("Streaming not supported.");
        return;
      }

      const assistantId = crypto.randomUUID();
      let fullText = "";

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: formatTime() },
      ]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              fullText += parsed.text;
              const { content, suggestions } = parseSuggestions(fullText);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content, suggestions } : m
                )
              );
              scrollToBottom();
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      // Final parse for suggestions
      const { content, suggestions } = parseSuggestions(fullText);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content, suggestions } : m
        )
      );
    } catch {
      setError("Failed to reach Grace AI. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50">Grace AI</h1>
            <p className="text-xs text-emerald-500">Online • Church Intelligence Assistant</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="custom-scrollbar mt-4 flex-1 overflow-y-auto space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-dark-600 dark:bg-dark-800">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onSuggestionClick={sendMessage} />
        ))}

        {loading && !messages.some((m) => m.role === "assistant" && m.content === "") && (
          <div className="flex gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 mt-0.5">
              <span className="text-[10px] font-bold text-white">G</span>
            </div>
            <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm dark:bg-dark-700">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
            {error}
          </div>
        )}

        {messages.length <= 2 && !loading && (
          <div className="pt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">
              Suggested questions
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {suggestedPrompts.map((prompt) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={prompt.text}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-left text-xs text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-dark-600 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10"
                    onClick={() => sendMessage(prompt.text)}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <span>{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 dark:border-dark-600 dark:bg-dark-700"
        >
          <Sparkles className="h-4 w-4 shrink-0 text-violet-500" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Grace anything about your church..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-dark-100 dark:placeholder:text-dark-300"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="rounded-lg bg-violet-600 p-2 text-white transition-colors hover:bg-violet-700 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-dark-400">
          Grace AI • Powered by Claude &amp; live church data
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onSuggestionClick,
}: {
  message: Message;
  onSuggestionClick: (text: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-violet-600 px-4 py-3 text-sm text-white">
          {message.content}
          <p className="mt-1 text-[10px] text-violet-200">{message.timestamp}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 mt-0.5">
        <span className="text-[10px] font-bold text-white">G</span>
      </div>
      <div className="max-w-[90%] space-y-2">
        <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm dark:bg-dark-700">
          <div className="text-sm text-slate-800 dark:text-dark-100">
            <ChatMarkdown text={message.content} />
          </div>
        </div>
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {message.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick(s)}
                className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] text-violet-700 transition-colors hover:bg-violet-100 hover:border-violet-300 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-400 dark:text-dark-400 pl-1">{message.timestamp}</p>
      </div>
    </div>
  );
}

