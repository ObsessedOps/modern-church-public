import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function MembersLoading() {
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>
      <SkeletonTable rows={10} />
    </div>
  );
}
