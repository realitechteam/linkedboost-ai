import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Delete user's LinkedIn profile data
export async function DELETE() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: { code: "UNAUTHORIZED", message: "Please sign in" } },
                { status: 401 }
            );
        }

        // Delete all profiles for this user
        await prisma.linkedInProfile.deleteMany({
            where: { userId: session.user.id },
        });

        return NextResponse.json({
            success: true,
            message: "Profile deleted successfully",
        });
    } catch (error) {
        console.error("Profile delete error:", error);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete profile" } },
            { status: 500 }
        );
    }
}
