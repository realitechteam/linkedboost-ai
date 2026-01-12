import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeJobMatch } from "@/lib/ai";
import { z } from "zod";

const requestSchema = z.object({
    profileId: z.string().optional(),
    jobData: z.object({
        title: z.string(),
        company: z.string(),
        description: z.string(),
        jobUrl: z.string().url().optional(),
    }),
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
                    feature: "JOB_MATCH",
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
                        message: `You've reached your daily limit of ${limit} job matches. Upgrade for more!`,
                    },
                },
                { status: 429 }
            );
        }

        // Get user's profile
        const profile = await prisma.linkedInProfile.findFirst({
            where: { userId: session.user.id },
        });

        if (!profile) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "PROFILE_NOT_FOUND",
                        message: "Please analyze your profile first before matching jobs.",
                    },
                },
                { status: 400 }
            );
        }

        const matchResult = await analyzeJobMatch(
            {
                headline: profile.headline,
                about: profile.about,
                experience: profile.experience,
                skills: profile.skills,
            },
            data.jobData
        );

        // Save job match
        const jobMatch = await prisma.jobMatch.create({
            data: {
                userId: session.user.id,
                jobUrl: data.jobData.jobUrl || "",
                jobTitle: data.jobData.title,
                company: data.jobData.company,
                matchScore: matchResult.overallScore,
                analysis: matchResult as object,
            },
        });

        // Update usage
        await prisma.usageRecord.upsert({
            where: {
                userId_feature_date: {
                    userId: session.user.id,
                    feature: "JOB_MATCH",
                    date: today,
                },
            },
            update: { tokensUsed: { increment: 1 } },
            create: {
                userId: session.user.id,
                feature: "JOB_MATCH",
                date: today,
                tokensUsed: 1,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                id: jobMatch.id,
                ...matchResult,
            },
        });
    } catch (error) {
        console.error("Job match error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to analyze job match" } },
            { status: 500 }
        );
    }
}
