"use client";

import { useState } from "react";
import { Sparkles, Send, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMPT_SUGGESTIONS = [
  "Draft an email to members who missed 3+ weeks",
  "Write a volunteer thank-you message for Easter weekend",
  "Create a welcome email for first-time visitors",
  "Draft a giving update for the building fund campaign",
  "Write an invite for the upcoming small groups launch",
];

// Simulated AI-generated drafts
const GENERATED_DRAFTS: Record<string, { subject: string; body: string }> = {
  "Draft an email to members who missed 3+ weeks": {
    subject: "We miss you at Grace Community!",
    body: `Hi {{first_name}},

We've noticed we haven't seen you in a few weeks, and we just wanted you to know — you're missed! Life gets busy, and we understand. No guilt, just genuine care.

Whether it's been a tough season, a schedule change, or something else entirely, we'd love to hear from you. Our pastors are always available for a conversation, and our doors are always open.

This Sunday's message is part of our new "Rooted" series — it's a great time to jump back in. We'd love to save you a seat.

If there's anything we can do to support you, just reply to this email.

With love,
Grace Community Church`,
  },
  "Write a volunteer thank-you message for Easter weekend": {
    subject: "You made Easter incredible — thank you! 🙏",
    body: `Hi {{first_name}},

Easter weekend was one for the books — and it happened because of YOU.

This weekend, we welcomed over 600 people across all services, including 85 first-time guests. Behind every warm greeting, every kids room that ran smoothly, every chair that was set up on time — there was a volunteer who said "yes."

That was you.

Your sacrifice of time and energy created space for people to encounter God. That matters more than you know.

We'd love to celebrate with you! Join us for Volunteer Appreciation Night on April 12th at 6:30 PM. Dinner's on us.

You are loved and valued,
Pastor Mike & the Grace Community Team`,
  },
};

export function GraceComposer() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate(selectedPrompt?: string) {
    const p = selectedPrompt || prompt;
    if (!p.trim()) return;

    setGenerating(true);
    setDraft(null);

    // Simulate AI generation delay
    setTimeout(() => {
      const match = Object.entries(GENERATED_DRAFTS).find(([key]) =>
        p.toLowerCase().includes(key.toLowerCase().slice(0, 20))
      );
      setDraft(
        match
          ? match[1]
          : {
              subject: "Your AI-generated draft",
              body: `Hi {{first_name}},\n\n[Modern.Church would generate a personalized message based on your prompt: "${p}"]\n\nThis is a demo of the intelligent communication feature. In the full platform, Modern.Church drafts messages using your church's tone, member data, and engagement context.\n\nBlessings,\nYour Church Team`,
            }
      );
      setGenerating(false);
    }, 1800);
  }

  function handleCopy() {
    if (!draft) return;
    navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/20">
          <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
            Smart Composer
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-dark-300">
            Intelligent message drafting
          </p>
        </div>
      </div>

      {/* Prompt suggestions */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {PROMPT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setPrompt(suggestion);
              handleGenerate(suggestion);
            }}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-200 dark:hover:border-violet-500/30 dark:hover:text-violet-400"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          placeholder="Describe the message you want to send..."
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400"
        />
        <button
          onClick={() => handleGenerate()}
          disabled={generating || !prompt.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-600/20 transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Draft
        </button>
      </div>

      {/* Generated Draft */}
      {draft && (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-500/20 dark:bg-violet-500/5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              AI Draft
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium text-violet-600 transition-colors hover:bg-violet-100 dark:text-violet-400 dark:hover:bg-violet-500/10"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-dark-50">
            Subject: {draft.subject}
          </p>
          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700 dark:text-dark-200">
            {draft.body}
          </p>
          <div className="mt-3 flex gap-2">
            <button className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-violet-700">
              <Send className="h-3 w-3" />
              Send Campaign
            </button>
            <button className="rounded-lg border border-violet-300 px-3 py-1.5 text-[10px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10">
              Edit Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
