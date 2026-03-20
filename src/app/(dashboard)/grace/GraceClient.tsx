"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, TrendingUp, AlertTriangle, Users, Calendar, Heart, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: string;
  highlights?: { label: string; value: string; color: string }[];
  actionNeeded?: string;
}

const seedMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello, Pastor Mike! Here's your quick snapshot for today:",
    timestamp: "Just now",
    highlights: [
      { label: "Weekend Attendance", value: "4,237", color: "violet" },
      { label: "Weekly Giving", value: "$127,450", color: "emerald" },
      { label: "New Visitors", value: "43", color: "blue" },
      { label: "Salvations/Baptisms", value: "7", color: "purple" },
    ],
  },
  {
    id: "2",
    role: "assistant",
    content:
      "**Key highlights:**\n• Weekend attendance hit **4,237** — your best week since January.\n• Giving is **8.1% above** last week and 4% over budget.\n• 5 first-time visitors still need follow-up contact. Want me to draft personalized messages?",
    timestamp: "Just now",
    actionNeeded:
      "Westside Kids Ministry is short 3 volunteers for Easter. I've identified 8 qualified members who haven't been asked yet.",
  },
  {
    id: "3",
    role: "user",
    content: "Which members haven't attended in 30+ days but were previously regular?",
    timestamp: "2 min ago",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "I found **23 members** showing signs of disengagement — they attended at least 3x/month for 6+ months but haven't been seen in 30+ days:",
    timestamp: "2 min ago",
    highlights: [
      { label: "Downtown", value: "12 members", color: "violet" },
      { label: "Westside", value: "7 members", color: "blue" },
      { label: "North Campus", value: "4 members", color: "amber" },
    ],
    actionNeeded:
      "Top priority: The Johnson family (Downtown) — previously attended every Sunday for 2 years, last visit was 5 weeks ago. Giving also stopped. Should I draft a pastoral care outreach?",
  },
  {
    id: "5",
    role: "user",
    content: "Yes, draft a care email for the Johnson family",
    timestamp: "1 min ago",
  },
  {
    id: "6",
    role: "assistant",
    content:
      "Here's a draft for the Johnson family:\n\n---\n**Subject:** We miss seeing you, David & Lisa\n\nHi David and Lisa,\n\nI wanted to reach out personally — we've missed you and the kids at Resurrection these past few weeks. I hope everything is going well with your family.\n\nNo pressure at all, but if there's anything going on that we can support you with — whether it's prayer, a conversation, or just a friendly visit — please don't hesitate to reach out.\n\nYou're a treasured part of our church family, and we're here for you.\n\nWarm regards,\nPastor Mike",
    timestamp: "Just now",
    actionNeeded:
      "Want me to send this through the church email system, or would you prefer to personalize it further?",
  },
];

const suggestedPrompts = [
  { icon: TrendingUp, text: "Show giving trends across all campuses this quarter" },
  { icon: Users, text: "Which volunteer teams are understaffed for Easter?" },
  { icon: AlertTriangle, text: "Flag members showing signs of disengagement" },
  { icon: Calendar, text: "What events are coming up this month?" },
  { icon: Heart, text: "How many first-time visitors returned this month?" },
  { icon: Lightbulb, text: "Suggest follow-up actions for this week" },
];

export default function GraceAIPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    inputRef.current?.focus();
  }, []);

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
        {seedMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Suggested Prompts */}
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
                  onClick={() => setInput(prompt.text)}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span>{prompt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) setInput("");
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
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-violet-600 p-2 text-white transition-colors hover:bg-violet-700 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-dark-400">
          Grace AI • Powered by church data across all integrations
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
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
          <div className="text-sm text-slate-800 dark:text-dark-100 whitespace-pre-line">
            {renderMarkdown(message.content)}
          </div>

          {message.highlights && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.highlights.map((h) => (
                <div
                  key={h.label}
                  className={cn(
                    "rounded-lg px-3 py-2",
                    h.color === "violet" && "bg-violet-500/10",
                    h.color === "emerald" && "bg-emerald-500/10",
                    h.color === "blue" && "bg-blue-500/10",
                    h.color === "purple" && "bg-purple-500/10",
                    h.color === "amber" && "bg-amber-500/10"
                  )}
                >
                  <p className="text-[10px] text-slate-500 dark:text-dark-300">{h.label}</p>
                  <p className={cn(
                    "text-sm font-bold",
                    h.color === "violet" && "text-violet-600 dark:text-violet-400",
                    h.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                    h.color === "blue" && "text-blue-600 dark:text-blue-400",
                    h.color === "purple" && "text-purple-600 dark:text-purple-400",
                    h.color === "amber" && "text-amber-600 dark:text-amber-400"
                  )}>
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {message.actionNeeded && (
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-50 px-3 py-2.5 dark:border-amber-500/10 dark:bg-amber-500/5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Action needed
              </p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                {message.actionNeeded}
              </p>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-dark-400 pl-1">{message.timestamp}</p>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
