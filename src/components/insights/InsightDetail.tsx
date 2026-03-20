"use client";

import { useState } from "react";
import { X, Sparkles, MessageCircle, Lightbulb, CheckCircle2 } from "lucide-react";

type InsightItem = {
  id: string;
  type: string;
  source: string;
  priority: string;
  title: string;
  body: string;
  suggestion: string | null;
  isResolved: boolean;
  createdAt: string;
  author: { name: string; role: string } | null;
  readAt: string | null;
  reaction: string | null;
};

const REACTIONS = [
  { value: "thanks", label: "Thanks" },
  { value: "on-it", label: "On it" },
  { value: "noted", label: "Noted" },
];

export function InsightDetail({ insight, onClose, onUpdate }: {
  insight: InsightItem;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [reacting, setReacting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  async function markRead() {
    await fetch(`/api/insights/${insight.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read" }),
    });
  }

  async function handleReact(reaction: string) {
    setReacting(true);
    await fetch(`/api/insights/${insight.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "react", reaction }),
    });
    setReacting(false);
    onUpdate();
  }

  async function handleReply() {
    if (!replyText.trim()) return;
    setReplying(true);
    await fetch(`/api/insights/${insight.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reply", replyText }),
    });
    setReplying(false);
    setReplyText("");
    onUpdate();
  }

  // Mark as read on open
  if (!insight.readAt) markRead();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-dark-600 dark:bg-dark-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {insight.source === "AI_GENERATED" ? (
              <Sparkles className="h-4 w-4 text-primary-600" />
            ) : (
              <MessageCircle className="h-4 w-4 text-teal-600" />
            )}
            <span className="text-xs text-slate-500 dark:text-dark-400">
              {insight.source === "AI_GENERATED" ? "Grace AI Insight" : `Shared by ${insight.author?.name ?? "Leader"}`}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="mt-3 text-lg font-semibold text-slate-800 dark:text-dark-100">
          {insight.title}
        </h2>

        <p className="mt-3 text-sm text-slate-600 dark:text-dark-300 leading-relaxed">
          {insight.body}
        </p>

        {insight.suggestion && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-900/10">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-3.5 w-3.5" />
              Suggested Action
            </div>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{insight.suggestion}</p>
          </div>
        )}

        {/* Reactions */}
        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-dark-700">
          <p className="text-xs font-medium text-slate-500 dark:text-dark-400">Quick Reaction</p>
          <div className="mt-2 flex gap-2">
            {REACTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => handleReact(r.value)}
                disabled={reacting}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  insight.reaction === r.value
                    ? "bg-primary-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reply */}
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-100"
            />
            <button
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
              className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Reply
            </button>
          </div>
        </div>

        {insight.isResolved && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolved
          </div>
        )}
      </div>
    </div>
  );
}
