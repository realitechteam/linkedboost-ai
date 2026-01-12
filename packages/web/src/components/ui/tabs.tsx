"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
    return (
        <TabsPrimitive.List
            className={cn(
                "inline-flex items-center justify-center rounded-xl bg-glass p-1 backdrop-blur-glass border border-glass-border",
                className
            )}
            {...props}
        >
            {children}
        </TabsPrimitive.List>
    );
}

function TabsTrigger({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
    return (
        <TabsPrimitive.Trigger
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5",
                "text-sm font-medium text-foreground-muted transition-all duration-200",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-50",
                "data-[state=active]:bg-primary-600 data-[state=active]:text-white data-[state=active]:shadow-glow",
                className
            )}
            {...props}
        >
            {children}
        </TabsPrimitive.Trigger>
    );
}

function TabsContent({
    className,
    children,
    ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
    return (
        <TabsPrimitive.Content
            className={cn(
                "mt-4 animate-fade-in focus-visible:outline-none",
                className
            )}
            {...props}
        >
            {children}
        </TabsPrimitive.Content>
    );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
