"use client";

import { useState } from "react";
import { X, Mail, MessageSquare, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: "email" | "sms";
  recipientName: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  /** Pre-filled subject for email */
  suggestedSubject?: string;
  /** Pre-filled body */
  suggestedBody?: string;
  /** Context label shown in header (e.g. "From Alert: Attendance Drop") */
  context?: string;
}

const AI_SUGGESTIONS: Record<string, { subject: string; body: string }[]> = {
  "check-in": [
    {
      subject: "Just checking in, {{name}}",
      body: "Hey {{name}}, we've been thinking about you and wanted to reach out. Is everything okay? We'd love to see you soon. 💜",
    },
    {
      subject: "We miss you at Crossroads!",
      body: "Hi {{name}},\n\nJust a quick note to let you know you're missed! If there's anything going on, we're here for you.\n\nWarmly,\nCrossroads Church",
    },
  ],
  welcome: [
    {
      subject: "Welcome to Crossroads, {{name}}!",
      body: "Hi {{name}},\n\nSo glad you visited! We'd love to help you feel at home. Here are some ways to get connected:\n\n• Join a Small Group\n• Start Growth Track\n• Serve on a Team\n\nSee you soon!",
    },
  ],
  encouragement: [
    {
      subject: "You're making a difference, {{name}}",
      body: "Hey {{name}}, we just wanted to say thank you for everything you do. Your service makes our community stronger. We appreciate you! 🙌",
    },
  ],
};

export function ComposeModal({
  isOpen,
  onClose,
  channel,
  recipientName,
  recipientEmail,
  recipientPhone,
  suggestedSubject,
  suggestedBody,
  context,
}: ComposeModalProps) {
  const [subject, setSubject] = useState(suggestedSubject?.replace("{{name}}", recipientName.split(" ")[0]) ?? "");
  const [body, setBody] = useState(suggestedBody?.replace(/\{\{name\}\}/g, recipientName.split(" ")[0]) ?? "");
  const [sending, setSending] = useState(false);
  const addToast = useToastStore((s) => s.add);

  if (!isOpen) return null;

  const isEmail = channel === "email";
  const contactInfo = isEmail ? recipientEmail : recipientPhone;

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);

    // Simulate sending (in production: call TIC or Mailchimp API)
    await new Promise((r) => setTimeout(r, 800));

    addToast(
      "success",
      `${isEmail ? "Email" : "Text"} sent to ${recipientName}`
    );
    setSending(false);
    onClose();
  }

  function applySuggestion(category: string) {
    const suggestions = AI_SUGGESTIONS[category];
    if (!suggestions?.length) return;
    const s = suggestions[Math.floor(Math.random() * suggestions.length)];
    const firstName = recipientName.split(" ")[0];
    setSubject(s.subject.replace(/\{\{name\}\}/g, firstName));
    setBody(s.body.replace(/\{\{name\}\}/g, firstName));
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-[10vh] z-50 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-dark-600 dark:bg-dark-800 sm:inset-x-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-dark-600">
          <div className="flex items-center gap-2">
            {isEmail ? (
              <Mail className="h-4 w-4 text-blue-500" />
            ) : (
              <MessageSquare className="h-4 w-4 text-green-500" />
            )}
            <h2 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              {isEmail ? "Send Email" : "Send Text"} to {recipientName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Context badge */}
          {context && (
            <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
              {context}
            </div>
          )}

          {/* Recipient */}
          <div className="text-xs text-slate-500 dark:text-dark-300">
            To: <span className="font-medium text-slate-700 dark:text-dark-100">{contactInfo ?? "No contact info"}</span>
          </div>

          {/* Subject (email only) */}
          {isEmail && (
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400"
            />
          )}

          {/* Message body */}
          <textarea
            placeholder={isEmail ? "Write your message..." : "Type your text message..."}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={isEmail ? 6 : 3}
            maxLength={isEmail ? undefined : 320}
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400"
          />

          {/* SMS character count */}
          {!isEmail && (
            <p className="text-right text-[10px] text-slate-400">
              {body.length}/320 characters
            </p>
          )}

          {/* AI suggestions */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-dark-400">
              Smart Suggestions
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["check-in", "welcome", "encouragement"].map((cat) => (
              <button
                key={cat}
                onClick={() => applySuggestion(cat)}
                className="rounded-full border border-violet-200 px-2.5 py-1 text-[11px] font-medium text-violet-600 transition-colors hover:bg-violet-50 dark:border-violet-500/30 dark:text-violet-400 dark:hover:bg-violet-500/10"
              >
                {cat === "check-in" ? "Check-In" : cat === "welcome" ? "Welcome" : "Encouragement"}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-dark-600">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!body.trim() || !contactInfo || sending}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all",
              sending
                ? "bg-violet-400 cursor-wait"
                : "bg-violet-600 hover:bg-violet-700 active:scale-95",
              (!body.trim() || !contactInfo) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}
