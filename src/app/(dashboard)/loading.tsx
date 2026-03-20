import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="animate-fade-up space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <SkeletonChart className="lg:col-span-3" />
        <SkeletonChart className="lg:col-span-2" />
      </div>

      {/* Table */}
      <SkeletonTable rows={4} />
    </div>
  );
}
