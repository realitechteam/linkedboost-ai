import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    message = "We couldn't load the data. Please try again.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center",
                className
            )}
        >
            <div className="mb-4 rounded-full bg-error/10 p-4 border border-error/20">
                <AlertCircle className="h-8 w-8 text-error" />
            </div>
            <h3 className="mb-2 text-lg font-semibold font-heading text-foreground">
                {title}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-foreground-muted">
                {message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-lg bg-glass border border-glass-border px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-glass-hover"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </button>
            )}
        </div>
    );
}
