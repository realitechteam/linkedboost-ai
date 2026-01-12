import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-lg bg-glass",
                "before:absolute before:inset-0",
                "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                "before:animate-skeleton before:bg-[length:200%_100%]",
                className
            )}
            {...props}
        />
    );
}

// Pre-built skeleton components for common use cases
function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn(
                        "h-4",
                        i === lines - 1 ? "w-3/4" : "w-full"
                    )}
                />
            ))}
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-xl bg-glass border border-glass-border p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <SkeletonText lines={3} />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
            </div>
        </div>
    );
}

function SkeletonScore() {
    return (
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-6 w-24" />
        </div>
    );
}

export { Skeleton, SkeletonText, SkeletonCard, SkeletonScore };
