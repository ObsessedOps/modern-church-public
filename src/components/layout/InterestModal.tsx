"use client";

import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterestModalProps {
  open: boolean;
  onClose: () => void;
}

export function InterestModal({ open, onClose }: InterestModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [church, setChurch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const nameRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus name input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 100);
      setStatus("idle");
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), church: church.trim(), role: role.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
    >
      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-dark-700 dark:hover:text-dark-200"
        >
          <X className="h-4 w-4" />
        </button>

        {status === "sent" ? (
          /* ── Success State ── */
          <div className="flex flex-col items-center px-8 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-50">
              We&apos;ll be in touch!
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-dark-300">
              Thanks, {name.split(" ")[0]}! We&apos;re excited to connect with you about Modern.Church.
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              Back to Demo
            </button>
          </div>
        ) : (
          /* ── Form State ── */
          <div className="px-8 pb-8 pt-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-dark-50">
                  Interested in Modern.Church?
                </h3>
                <p className="text-xs text-slate-500 dark:text-dark-300">
                  We&apos;d love to learn about your church.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  Name *
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Pastor Mike"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400 dark:focus:border-violet-500 dark:focus:bg-dark-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mike@yourchurch.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400 dark:focus:border-violet-500 dark:focus:bg-dark-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  Church Name
                </label>
                <input
                  type="text"
                  value={church}
                  onChange={(e) => setChurch(e.target.value)}
                  placeholder="Grace Community Church"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400 dark:focus:border-violet-500 dark:focus:bg-dark-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-300">
                  Your Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Lead Pastor, Executive Director, etc."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-50 dark:placeholder:text-dark-400 dark:focus:border-violet-500 dark:focus:bg-dark-600"
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-rose-500">
                  Something went wrong. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !name.trim() || !email.trim()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
              >
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Get in Touch
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-dark-400">
              No spam, ever. We&apos;ll reach out personally.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
