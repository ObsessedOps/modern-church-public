import { getServerSession } from "@/lib/server-auth";
import { can } from "@/lib/rbac";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ClipboardCopy,
  Heart,
  Mail,
  MessageSquare,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { MessageActions } from "@/components/messaging/MessageActions";
import { ConnectCardActions } from "./ConnectCardActions";

export default async function ConnectCardsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  if (!can(session, "visitors:view")) return <AccessDenied />;

  const church = await prisma.church.findUnique({
    where: { id: session.churchId },
    select: { slug: true, name: true },
  });

  const submissions = await prisma.connectCardSubmission.findMany({
    where: { churchId: session.churchId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalThisWeek = submissions.filter((s) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return s.createdAt >= weekAgo;
  }).length;

  const connectUrl = `/connect/${church?.slug ?? ""}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-dark-50 sm:text-2xl">
            Connect Cards
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-dark-300">
            Digital visitor cards — share the link and collect responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 dark:bg-violet-900/20">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
              {totalThisWeek} this week
            </span>
          </div>
        </div>
      </div>

      {/* Shareable Link Card */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-dark-50">
              Your Connect Card Link
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-dark-300">
              Share this with visitors, put it on your website, or display as a QR code
            </p>
          </div>
          <ConnectCardActions connectUrl={connectUrl} />
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-dark-500 dark:bg-dark-700">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <code className="flex-1 truncate text-xs text-slate-600 dark:text-dark-200">
            {connectUrl}
          </code>
          <ClipboardCopy className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        </div>
      </div>

      {/* Submissions */}
      {submissions.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-slate-300 dark:text-dark-400" />
          <p className="mt-3 text-sm font-medium text-slate-600 dark:text-dark-200">
            No connect cards yet
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-400">
            Share your link to start receiving visitor information
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-dark-100">
            Recent Submissions ({submissions.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {submissions.map((sub) => {
              const daysAgo = Math.floor(
                (Date.now() - sub.createdAt.getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={sub.id}
                  className="card transition-all hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-dark-50">
                        {sub.firstName} {sub.lastName}
                      </p>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-dark-300">
                        <Clock className="h-3 w-3" />
                        {daysAgo === 0
                          ? "Today"
                          : daysAgo === 1
                            ? "Yesterday"
                            : `${daysAgo} days ago`}
                      </div>
                    </div>
                    <MessageActions
                      name={`${sub.firstName} ${sub.lastName}`}
                      email={sub.email}
                      phone={sub.phone}
                      context={`New visitor connect card from ${sub.firstName} ${sub.lastName}${sub.howHeard ? `, heard about us via ${sub.howHeard}` : ""}`}
                    />
                  </div>

                  {/* Contact info */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {sub.email && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                        <Mail className="h-2.5 w-2.5" />
                        {sub.email}
                      </span>
                    )}
                    {sub.phone && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-dark-600 dark:text-dark-300">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {sub.phone}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  {sub.howHeard && (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-dark-300">
                      <span className="font-medium">How they heard:</span> {sub.howHeard}
                    </p>
                  )}

                  {sub.interests.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {sub.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}

                  {sub.prayerRequest && (
                    <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 dark:bg-amber-900/10">
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        Prayer Request
                      </p>
                      <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-300 line-clamp-3">
                        {sub.prayerRequest}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
