import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePost, PostTone, PostFormat } from "@/lib/ai";
import { z } from "zod";

const requestSchema = z.object({
    topic: z.string().min(3).max(500),
    tone: z.enum(["professional", "casual", "inspirational", "educational"]),
    format: z.enum(["story", "tips", "announcement", "question", "carousel"]),
    keywords: z.array(z.string()).optional(),
    language: z.enum(["en", "vi"]).optional(),
});

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in" } },
                { status: 401 }
            );
        }

        // Parse and validate request
        const body = await req.json();
        const data = requestSchema.parse(body);

        // Get user subscription
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
                    feature: "POST_GENERATE",
                    date: today,
                },
            },
        });

        const used = usageToday?.tokensUsed || 0;
        const limits = { FREE: 3, PRO: 20, PREMIUM: -1 };
        const limit = limits[plan as keyof typeof limits];

        if (limit !== -1 && used >= limit) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "LIMIT_EXCEEDED",
                        message: `You've reached your daily limit of ${limit} posts. Upgrade to get more!`,
                    },
                },
                { status: 429 }
            );
        }

        // Generate posts using AI
        const posts = await generatePost(
            data.topic,
            data.tone as PostTone,
            data.format as PostFormat,
            data.keywords,
            data.language || "en"
        );

        // Update usage
        await prisma.usageRecord.upsert({
            where: {
                userId_feature_date: {
                    userId: session.user.id,
                    feature: "POST_GENERATE",
                    date: today,
                },
            },
            update: { tokensUsed: { increment: 1 } },
            create: {
                userId: session.user.id,
                feature: "POST_GENERATE",
                date: today,
                tokensUsed: 1,
            },
        });

        return NextResponse.json({
            success: true,
            data: { posts },
            meta: {
                usage: {
                    feature: "POST_GENERATE",
                    used: used + 1,
                    limit,
                    remaining: limit === -1 ? -1 : limit - used - 1,
                },
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: { code: "VALIDATION_ERROR", message: error.errors[0].message } },
                { status: 400 }
            );
        }

        console.error("Post generation error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to generate posts" } },
            { status: 500 }
        );
    }
}
