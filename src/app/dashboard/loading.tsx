
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <div className="h-8 w-1/3 bg-muted animate-pulse rounded mb-4" />
      <div className="space-y-4">
        <div className="h-48 bg-muted animate-pulse rounded" />
        <div className="h-6 bg-muted animate-pulse rounded" />
        <div className="h-6 bg-muted animate-pulse rounded w-2/3" />
      </div>
    </div>
  );
}
