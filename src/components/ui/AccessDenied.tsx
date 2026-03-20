import { ShieldX } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/20">
          <ShieldX className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-dark-50">
          Access Denied
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-dark-300">
          You don&apos;t have permission to view this page. Contact your church
          administrator to request access.
        </p>
      </div>
    </div>
  );
}
