import { SkeletonCard, SkeletonChart, SkeletonTable } from "@/components/ui/Skeleton";

export default function GivingLoading() {
  return (
    <div className="animate-fade-up space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart */}
      <SkeletonChart />

      {/* Recent transactions */}
      <SkeletonTable rows={6} />
    </div>
  );
}
