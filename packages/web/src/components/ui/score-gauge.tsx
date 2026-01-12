"use client";

import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
    score: number;
    maxScore?: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    label?: string;
    className?: string;
}

export function ScoreGauge({
    score,
    maxScore = 100,
    size = "md",
    showLabel = true,
    label,
    className,
}: ScoreGaugeProps) {
    const percentage = Math.round((score / maxScore) * 100);
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage >= 80) return "text-success stroke-success";
        if (percentage >= 60) return "text-primary-500 stroke-primary-500";
        if (percentage >= 40) return "text-warning stroke-warning";
        return "text-error stroke-error";
    };

    const getLabel = () => {
        if (label) return label;
        if (percentage >= 80) return "Excellent";
        if (percentage >= 60) return "Good";
        if (percentage >= 40) return "Fair";
        return "Needs Work";
    };

    const sizeClasses = {
        sm: "h-20 w-20",
        md: "h-32 w-32",
        lg: "h-40 w-40",
    };

    const fontSizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
    };

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div className={cn("relative", sizeClasses[size])}>
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-glass"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className={cn("transition-all duration-700 ease-out", getColor())}
                    />
                </svg>
                {/* Score text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("font-heading font-bold", fontSizeClasses[size], getColor().split(" ")[0])}>
                        {percentage}%
                    </span>
                </div>
            </div>
            {showLabel && (
                <span className={cn("text-sm font-medium", getColor().split(" ")[0])}>
                    {getLabel()}
                </span>
            )}
        </div>
    );
}
