import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const syncProfileSchema = z.object({
    profileData: z.object({
        linkedInId: z.string(), // Required: unique LinkedIn identifier
        name: z.string().optional(),
        headline: z.string().optional(),
        about: z.string().optional(),
        profileUrl: z.string().optional(),
        location: z.string().optional(),
        connections: z.string().optional(),
        experience: z.array(z.object({
            title: z.string().optional(),
            company: z.string().optional(),
            duration: z.string().optional(),
        })).optional(),
        skills: z.array(z.string()).optional(),
        education: z.array(z.object({
            school: z.string().optional(),
            degree: z.string().optional(),
        })).optional(),
    }),
});

// Helper: Get user's profile limit based on subscription
async function getProfileLimit(userId: string): Promise<number> {
    const subscription = await prisma.subscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        return 1; // Free tier default
    }

    // -1 means unlimited (Premium)
    if (subscription.profileLimit === -1) {
        return Infinity;
    }

    return subscription.profileLimit;
}

// Sync LinkedIn profile data from extension
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" } },
                { status: 401 }
            );
        }

        const body = await req.json();
        const data = syncProfileSchema.parse(body);
        const { profileData } = data;

        const userId = session.user.id;

        // Check if this is a new profile or update
        const existingProfile = await prisma.linkedInProfile.findUnique({
            where: {
                userId_linkedInId: {
                    userId,
                    linkedInId: profileData.linkedInId,
                },
            },
        });

        // If new profile, check limit
        if (!existingProfile) {
            const profileCount = await prisma.linkedInProfile.count({
                where: { userId },
            });
            const limit = await getProfileLimit(userId);

            if (profileCount >= limit) {
                return NextResponse.json({
                    success: false,
                    error: {
                        code: "PROFILE_LIMIT_REACHED",
                        message: `Bạn đã đạt giới hạn ${limit} profile. Nâng cấp để thêm profile mới.`,
                        currentCount: profileCount,
                        limit,
                    },
                }, { status: 403 });
            }
        }

        // Convert arrays to JSON strings for SQLite
        const experienceJson = profileData.experience ? JSON.stringify(profileData.experience) : null;
        const skillsJson = profileData.skills ? JSON.stringify(profileData.skills) : null;
        const educationJson = profileData.education ? JSON.stringify(profileData.education) : null;

        // Upsert profile
        const profile = await prisma.linkedInProfile.upsert({
            where: {
                userId_linkedInId: {
                    userId,
                    linkedInId: profileData.linkedInId,
                },
            },
            update: {
                profileUrl: profileData.profileUrl || "",
                name: profileData.name || null,
                headline: profileData.headline || null,
                about: profileData.about || null,
                location: profileData.location || null,
                connections: profileData.connections || null,
                experience: experienceJson,
                skills: skillsJson,
                education: educationJson,
                lastSyncedAt: new Date(),
            },
            create: {
                userId,
                linkedInId: profileData.linkedInId,
                profileUrl: profileData.profileUrl || "",
                name: profileData.name || null,
                headline: profileData.headline || null,
                about: profileData.about || null,
                location: profileData.location || null,
                connections: profileData.connections || null,
                experience: experienceJson,
                skills: skillsJson,
                education: educationJson,
                lastSyncedAt: new Date(),
            },
        });

        // Update user name if provided
        if (profileData.name) {
            await prisma.user.update({
                where: { id: userId },
                data: { name: profileData.name },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                profileId: profile.id,
                linkedInId: profile.linkedInId,
                message: "Profile đã được đồng bộ thành công",
            },
        });
    } catch (error) {
        console.error("Profile sync error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: { code: "INVALID_DATA", message: "Dữ liệu không hợp lệ", details: error.errors },
            }, { status: 400 });
        }

        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể đồng bộ profile" } },
            { status: 500 }
        );
    }
}

// Get all user's synced LinkedIn profiles
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Vui lòng đăng nhập" } },
                { status: 401 }
            );
        }

        const profiles = await prisma.linkedInProfile.findMany({
            where: { userId: session.user.id },
            orderBy: { lastSyncedAt: "desc" },
        });

        const limit = await getProfileLimit(session.user.id);

        return NextResponse.json({
            success: true,
            data: {
                profiles,
                count: profiles.length,
                limit: limit === Infinity ? -1 : limit,
            },
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể lấy danh sách profile" } },
            { status: 500 }
        );
    }
}
