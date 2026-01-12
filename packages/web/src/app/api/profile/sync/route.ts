import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const syncProfileSchema = z.object({
    profileData: z.object({
        name: z.string().optional(),
        headline: z.string().optional(),
        about: z.string().optional(),
        profileUrl: z.string().optional(),
        experience: z.array(z.object({
            title: z.string().optional(),
            company: z.string().optional(),
        })).optional(),
        skills: z.array(z.string()).optional(),
        education: z.array(z.object({
            school: z.string().optional(),
            degree: z.string().optional(),
        })).optional(),
    }),
});

// Sync LinkedIn profile data from extension
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
        const data = syncProfileSchema.parse(body);
        const { profileData } = data;

        // Upsert profile data to database
        const profile = await prisma.linkedInProfile.upsert({
            where: {
                id: `${session.user.id}-primary`,
            },
            update: {
                profileUrl: profileData.profileUrl || "",
                headline: profileData.headline || null,
                about: profileData.about || null,
                experience: profileData.experience as object || null,
                skills: profileData.skills || [],
                education: profileData.education as object || null,
                lastSyncedAt: new Date(),
            },
            create: {
                id: `${session.user.id}-primary`,
                userId: session.user.id,
                profileUrl: profileData.profileUrl || "",
                headline: profileData.headline || null,
                about: profileData.about || null,
                experience: profileData.experience as object || null,
                skills: profileData.skills || [],
                education: profileData.education as object || null,
                lastSyncedAt: new Date(),
            },
        });

        // Also update user name if provided
        if (profileData.name) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { name: profileData.name },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                profileId: profile.id,
                message: "Profile synced successfully",
            },
        });
    } catch (error) {
        console.error("Profile sync error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to sync profile" } },
            { status: 500 }
        );
    }
}

// Get synced profile data
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in" } },
                { status: 401 }
            );
        }

        const profile = await prisma.linkedInProfile.findFirst({
            where: { userId: session.user.id },
        });

        return NextResponse.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" } },
            { status: 500 }
        );
    }
}
