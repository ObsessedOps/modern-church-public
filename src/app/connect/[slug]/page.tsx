"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Heart, Send, CheckCircle2, Church, Loader2 } from "lucide-react";

interface CampusOption {
  id: string;
  name: string;
}

interface ChurchInfo {
  id: string;
  name: string;
  campuses: CampusOption[];
}

const INTEREST_OPTIONS = [
  "Small Groups",
  "Volunteering",
  "Youth Ministry",
  "Kids Ministry",
  "Worship Team",
  "Bible Study",
  "Community Events",
  "Prayer Ministry",
];

export default function ConnectCardPage() {
  const { slug } = useParams<{ slug: string }>();
  const [church, setChurch] = useState<ChurchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    campusId: "",
    howHeard: "",
    prayerRequest: "",
    interests: [] as string[],
  });

  useEffect(() => {
    fetch(`/api/connect-card?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setChurch(data);
          if (data.campuses.length === 1) {
            setForm((f) => ({ ...f, campusId: data.campuses[0].id }));
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load church info");
        setLoading(false);
      });
  }, [slug]);

  function toggleInterest(interest: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/connect-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Submission failed");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error && !church) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 px-4">
        <div className="text-center">
          <Church className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-lg font-semibold text-slate-700">Church not found</h1>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Welcome to {church?.name}!
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Thank you for connecting with us. Someone from our team will reach out to you soon!
          </p>
          <div className="mt-8 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
            <p className="text-xs font-medium text-violet-700">
              We&apos;re so glad you visited. You&apos;re always welcome here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/30">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Welcome to {church?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            We&apos;d love to get to know you! Fill out this card and we&apos;ll be in touch.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Campus */}
            {church && church.campuses.length > 1 && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Which campus did you visit?
                </label>
                <select
                  value={form.campusId}
                  onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
                >
                  <option value="">Select a campus...</option>
                  {church.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* How did you hear */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                How did you hear about us?
              </label>
              <select
                value={form.howHeard}
                onChange={(e) => setForm({ ...form, howHeard: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              >
                <option value="">Select...</option>
                <option>Friend or family</option>
                <option>Social media</option>
                <option>Google search</option>
                <option>Drive by</option>
                <option>Community event</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          {/* Interests */}
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <label className="mb-3 block text-xs font-semibold text-slate-600">
              I&apos;m interested in...
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = form.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? "border-violet-300 bg-violet-100 text-violet-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600"
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prayer Request */}
          <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Prayer requests or anything you&apos;d like us to know
            </label>
            <textarea
              value={form.prayerRequest}
              onChange={(e) => setForm({ ...form, prayerRequest: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              placeholder="We'd love to pray for you..."
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.firstName || !form.lastName}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Connect With Us
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400">
            Powered by Modern.Church
          </p>
        </form>
      </div>
    </div>
  );
}
