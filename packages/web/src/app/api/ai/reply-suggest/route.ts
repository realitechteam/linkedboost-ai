import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReplySuggestions } from "@/lib/ai";
import { z } from "zod";

const requestSchema = z.object({
    conversationContext: z.string().min(10).max(5000),
    senderName: z.string().optional(),
    tone: z.enum(["professional", "friendly", "concise"]).optional(),
    language: z.enum(["en", "vi"]).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in" } },
                { status: 401 }
            );
        }

        const body = await req.json();
        const data = requestSchema.parse(body);

        const subscription = await prisma.subscription.findUnique({
            where: { userId: session.user.id },
        });
        const plan = subscription?.plan || "FREE";

        // Check usage limits
        const today = new Date(new Date().toISOString().split("T")[0]);
        const usageToday = await prisma.usageRecord.findUnique({
            where: {
                userId_feature_date: {
                    userId: session.user.id,
                    feature: "REPLY_SUGGEST",
                    date: today,
                },
            },
        });

        const used = usageToday?.tokensUsed || 0;
        const limits = { FREE: 5, PRO: -1, PREMIUM: -1 };
        const limit = limits[plan as keyof typeof limits];

        if (limit !== -1 && used >= limit) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "LIMIT_EXCEEDED",
                        message: `You've reached your daily limit of ${limit} replies. Upgrade for unlimited!`,
                    },
                },
                { status: 429 }
            );
        }

        const suggestions = await generateReplySuggestions(
            data.conversationContext,
            data.senderName,
            data.tone || "professional",
            data.language || "en"
        );

        // Update usage
        await prisma.usageRecord.upsert({
            where: {
                userId_feature_date: {
                    userId: session.user.id,
                    feature: "REPLY_SUGGEST",
                    date: today,
                },
            },
            update: { tokensUsed: { increment: 1 } },
            create: {
                userId: session.user.id,
                feature: "REPLY_SUGGEST",
                date: today,
                tokensUsed: 1,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                suggestions: suggestions.map((text, i) => ({
                    tone: ["professional", "friendly", "concise"][i] || "professional",
                    text,
                })),
            },
        });
    } catch (error) {
        console.error("Reply suggestion error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate suggestions" } },
            { status: 500 }
        );
    }
}
