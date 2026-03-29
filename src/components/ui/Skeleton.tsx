import { cn } from "@/lib/cn";

interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded bg-surface-secondary h-4", className)} />;
}

export function SkeletonCircle({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-full bg-surface-secondary", className)} />;
}

export function SkeletonRect({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-secondary", className)} />;
}

export function TableSkeleton({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="h-10 bg-surface-secondary rounded animate-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-10 bg-surface-secondary rounded animate-pulse" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-border overflow-hidden", className)}>
      <div className="aspect-video bg-surface-secondary animate-pulse" />
      <div className="p-4 space-y-2">
        <SkeletonLine className="w-3/4" />
        <SkeletonLine className="w-1/2" />
      </div>
    </div>
  );
}
