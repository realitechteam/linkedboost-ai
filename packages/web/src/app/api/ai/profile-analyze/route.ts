import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeProfile } from "@/lib/ai";
import { z } from "zod";

const requestSchema = z.object({
    profileData: z.object({
        headline: z.string().optional(),
        about: z.string().optional(),
        experience: z.array(z.unknown()).optional(),
        skills: z.array(z.string()).optional(),
        hasPhoto: z.boolean().optional(),
        education: z.array(z.unknown()).optional(),
    }),
    profileUrl: z.string().url().optional(),
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
                    feature: "PROFILE_ANALYZE",
                    date: today,
                },
            },
        });

        const used = usageToday?.tokensUsed || 0;
        const limits = { FREE: 1, PRO: -1, PREMIUM: -1 };
        const limit = limits[plan as keyof typeof limits];

        if (limit !== -1 && used >= limit) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "LIMIT_EXCEEDED",
                        message: `You've used your profile review for today. Upgrade for unlimited!`,
                    },
                },
                { status: 429 }
            );
        }

        const analysis = await analyzeProfile(data.profileData);

        // Save profile data for user
        if (data.profileUrl) {
            await prisma.linkedInProfile.upsert({
                where: {
                    id: `${session.user.id}-primary`,
                },
                update: {
                    profileUrl: data.profileUrl,
                    headline: data.profileData.headline,
                    about: data.profileData.about,
                    experience: data.profileData.experience as object,
                    skills: data.profileData.skills || [],
                    lastScore: analysis.overallScore,
                    lastAnalysis: analysis as object,
                },
                create: {
                    id: `${session.user.id}-primary`,
                    userId: session.user.id,
                    profileUrl: data.profileUrl,
                    headline: data.profileData.headline,
                    about: data.profileData.about,
                    experience: data.profileData.experience as object,
                    skills: data.profileData.skills || [],
                    lastScore: analysis.overallScore,
                    lastAnalysis: analysis as object,
                },
            });
        }

        // Update usage
        await prisma.usageRecord.upsert({
            where: {
                userId_feature_date: {
                    userId: session.user.id,
                    feature: "PROFILE_ANALYZE",
                    date: today,
                },
            },
            update: { tokensUsed: { increment: 1 } },
            create: {
                userId: session.user.id,
                feature: "PROFILE_ANALYZE",
                date: today,
                tokensUsed: 1,
            },
        });

        return NextResponse.json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        console.error("Profile analysis error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to analyze profile" } },
            { status: 500 }
        );
    }
}
