import { cn } from "@/lib/utils";
import { LucideIcon, FileQuestion } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({
    icon: Icon = FileQuestion,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center",
                className
            )}
        >
            <div className="mb-4 rounded-full bg-glass p-4 border border-glass-border">
                <Icon className="h-8 w-8 text-foreground-muted" />
            </div>
            <h3 className="mb-2 text-lg font-semibold font-heading text-foreground">
                {title}
            </h3>
            {description && (
                <p className="mb-6 max-w-sm text-sm text-foreground-muted">
                    {description}
                </p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-700 hover:shadow-glow"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
