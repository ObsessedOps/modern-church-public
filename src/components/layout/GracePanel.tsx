"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Send, TrendingUp, AlertTriangle, Users, Calendar, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGracePanelStore } from "@/stores/grace-panel";

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
    content:
      "Hello, Pastor Mike! Here's your quick snapshot for today:",
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
];

export function GracePanel() {
  const { isOpen, close } = useGracePanelStore();
  const inputRef = useRef<HTMLInputElement>(null!); // eslint-disable-line

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  return (
    <>
      {/* Desktop: slide-in panel */}
      <div
        data-grace-panel
        className={cn(
          "fixed right-0 top-0 z-50 hidden h-full w-[400px] transform border-l border-violet-500/20 bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-dark-800 lg:block",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <PanelContent close={close} inputRef={inputRef} />
      </div>

      {/* Mobile: bottom sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <div className="absolute bottom-0 left-0 right-0 h-[85dvh] rounded-t-2xl border-t border-violet-500/20 bg-white dark:bg-dark-800">
            <div className="flex justify-center py-3">
              <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-dark-500" />
            </div>
            <PanelContent close={close} inputRef={inputRef} />
          </div>
        </div>
      )}
    </>
  );
}

function PanelContent({
  close,
  inputRef,
}: {
  close: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-violet-500/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600">
            <span className="text-sm font-bold text-white">G</span>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Grace AI
            </h2>
            <p className="text-[10px] text-emerald-500">
              Online • Church Intelligence Assistant
            </p>
          </div>
        </div>
        <button
          onClick={close}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-600 dark:hover:text-dark-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {seedMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Suggested prompts */}
        <div className="pt-2">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-400">
            Suggested questions
          </p>
          <div className="space-y-1.5">
            {suggestedPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.text}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-dark-600 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:bg-violet-600/10"
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
      <div className="border-t border-slate-200 p-4 dark:border-dark-600">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) setInput("");
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 dark:border-dark-600 dark:bg-dark-700"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Grace anything..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-dark-100 dark:placeholder:text-dark-300"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="rounded-lg bg-violet-600 p-1.5 text-white transition-colors hover:bg-violet-700 disabled:opacity-30"
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
        <div className="rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3 dark:bg-dark-700">
          <div className="text-sm text-slate-800 dark:text-dark-100 whitespace-pre-line">
            {renderMarkdown(message.content)}
          </div>

          {/* Highlight cards */}
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
                  <p className="text-[10px] text-slate-500 dark:text-dark-300">
                    {h.label}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      h.color === "violet" && "text-violet-600 dark:text-violet-400",
                      h.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                      h.color === "blue" && "text-blue-600 dark:text-blue-400",
                      h.color === "purple" && "text-purple-600 dark:text-purple-400",
                      h.color === "amber" && "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Action needed */}
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
        <p className="text-[10px] text-slate-400 dark:text-dark-400 pl-1">
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  // Simple markdown rendering for bold and line breaks
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
